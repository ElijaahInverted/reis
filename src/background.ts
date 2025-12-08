/**
 * Background service worker for Chrome extension.
 *
 * Responsibilities:
 * - Native Chrome identity OAuth2 for Google Drive authentication
 * - Token management via chrome.identity.getAuthToken
 * - Auto-sync alarm (every 5 minutes)
 * - Offscreen document coordination for background sync
 */

import { DRIVE_CONSTANTS } from "./constants/drive";

console.log("[Background] Service worker started");

// ============================================================================
// Types
// ============================================================================

interface DriveAuth {
  email?: string;
  isAuthorized?: boolean;
}

interface AuthResponse {
  token?: string;
  error?: string;
}

// ============================================================================
// Native Chrome Identity OAuth2 (getAuthToken)
// ============================================================================

/**
 * Handle OAuth using Chrome's native identity API.
 * This uses the "Chrome extension" credential type which handles everything internally.
 */
async function handleOAuthFlow(interactive: boolean): Promise<AuthResponse> {
  console.log(
    `[Background] handleOAuthFlow called (interactive: ${interactive})`
  );

  try {
    // Use Chrome's native getAuthToken - handles caching, refresh, and UI automatically
    const token = await new Promise<string>((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive }, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        // Handle both old string return and new object return
        const tokenValue = typeof result === "string" ? result : result?.token;
        if (!tokenValue) {
          reject(new Error("No token received"));
          return;
        }
        resolve(tokenValue);
      });
    });

    console.log("[Background] Token obtained successfully");

    // Fetch user email for display
    let email: string | undefined;
    try {
      const userInfo = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (userInfo.ok) {
        const info = await userInfo.json();
        email = info.email;
        console.log("[Background] User email:", email);
      }
    } catch {
      // Non-critical, continue without email
    }

    // Store auth status
    await chrome.storage.local.set({
      driveAuth: { email, isAuthorized: true } as DriveAuth,
    });

    return { token };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Background] OAuth flow error:", message);
    return { error: message };
  }
}

/**
 * Get a valid access token using Chrome's native identity API.
 * Chrome handles refresh automatically.
 */
async function getValidAccessToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: false }, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      // Handle both old string return and new object return
      const tokenValue = typeof result === "string" ? result : result?.token;
      if (!tokenValue) {
        reject(new Error("Not authenticated"));
        return;
      }
      resolve(tokenValue);
    });
  });
}

/**
 * Get stored auth info from chrome.storage.local
 */
async function getStoredAuth(): Promise<DriveAuth | null> {
  const result = await chrome.storage.local.get(["driveAuth"]);
  return (result.driveAuth as DriveAuth) || null;
}

/**
 * Revoke tokens and clear stored data.
 */
async function revokeDriveTokens(): Promise<void> {
  try {
    // Get current token to revoke
    const token = await getValidAccessToken();
    if (token) {
      // Revoke at Google
      await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
        method: "POST",
      });
      console.log("[Background] Token revoked at Google");

      // Also remove from Chrome's cache
      await new Promise<void>((resolve) => {
        chrome.identity.removeCachedAuthToken({ token }, () => resolve());
      });
    }
  } catch (e) {
    console.error("[Background] Failed to revoke token:", e);
  }

  // Clear stored auth data
  await chrome.storage.local.remove(["driveAuth", "driveSettings"]);
  console.log("[Background] Drive auth and settings cleared");
}

// ============================================================================
// Offscreen Document Management
// ============================================================================

const OFFSCREEN_DOC_PATH = "offscreen.html";
let creatingOffscreen: Promise<void> | null = null;

/**
 * Ensure offscreen document exists for background operations.
 */
async function setupOffscreenDocument(): Promise<void> {
  const offscreenUrl = chrome.runtime.getURL(OFFSCREEN_DOC_PATH);

  // Check if already exists
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT" as chrome.runtime.ContextType],
    documentUrls: [offscreenUrl],
  });

  if (existingContexts.length > 0) {
    return;
  }

  // Avoid race conditions
  if (creatingOffscreen) {
    await creatingOffscreen;
  } else {
    creatingOffscreen = chrome.offscreen.createDocument({
      url: OFFSCREEN_DOC_PATH,
      reasons: [chrome.offscreen.Reason.BLOBS],
      justification: "Sync files to Google Drive in background",
    });
    await creatingOffscreen;
    creatingOffscreen = null;
  }

  console.log("[Background] Offscreen document created");
}

// ============================================================================
// Auto-Sync Alarm
// ============================================================================

// Set up auto-sync alarm on install
chrome.runtime.onInstalled.addListener(() => {
  console.log("[Background] Extension installed/updated");
  chrome.alarms.create("drive-auto-sync", {
    periodInMinutes: DRIVE_CONSTANTS.SYNC_INTERVAL_MINUTES,
  });
  console.log(
    `[Background] Auto-sync alarm created (every ${DRIVE_CONSTANTS.SYNC_INTERVAL_MINUTES} minutes)`
  );
});

// Handle auto-sync alarm
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "drive-auto-sync") {
    console.log("[Background] Auto-sync alarm fired");

    // Check if Drive sync is enabled
    const auth = await getStoredAuth();
    if (!auth?.isAuthorized) {
      console.log("[Background] Drive not authorized, skipping auto-sync");
      return;
    }

    try {
      await setupOffscreenDocument();

      // Send sync request to offscreen document
      chrome.runtime.sendMessage({
        type: "EXECUTE_DRIVE_SYNC",
        target: "offscreen",
      });
    } catch (e) {
      console.error("[Background] Failed to trigger sync:", e);
    }
  }
});

// ============================================================================
// Message Handlers
// ============================================================================

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  console.log("[Background] Received message:", request.type);

  // OAuth flow
  if (request.type === "AUTH_GOOGLE_DRIVE") {
    handleOAuthFlow(request.interactive ?? false)
      .then(sendResponse)
      .catch((e) => sendResponse({ error: e.message }));
    return true; // Async response
  }

  // Get valid token
  if (request.type === "GET_DRIVE_TOKEN") {
    getValidAccessToken()
      .then((token) => sendResponse({ token }))
      .catch((e) => sendResponse({ error: e.message }));
    return true;
  }

  // Revoke tokens
  if (request.type === "REVOKE_DRIVE_TOKEN") {
    revokeDriveTokens()
      .then(() => sendResponse({ success: true }))
      .catch((e) => sendResponse({ error: e.message }));
    return true;
  }

  // Get stored auth (for checking connection status)
  if (request.type === "GET_DRIVE_STATUS") {
    getStoredAuth()
      .then((auth) =>
        sendResponse({
          isAuthenticated: !!auth?.isAuthorized,
          email: auth?.email,
        })
      )
      .catch((e) => sendResponse({ error: e.message }));
    return true;
  }

  // Trigger manual sync
  if (request.type === "TRIGGER_DRIVE_SYNC") {
    setupOffscreenDocument()
      .then(() => {
        chrome.runtime.sendMessage({
          type: "EXECUTE_DRIVE_SYNC",
          target: "offscreen",
        });
        sendResponse({ success: true });
      })
      .catch((e) => sendResponse({ error: e.message }));
    return true;
  }

  return false;
});

console.log("[Background] Service worker initialized");
