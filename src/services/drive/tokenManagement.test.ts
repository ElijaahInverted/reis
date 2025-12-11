/**
 * Tests for OAuth token management logic.
 * 
 * These tests verify the token refresh and validation logic used in the
 * background service worker. Tests focus on pure logic functions that don't
 * require Chrome APIs.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ============================================================================
// Token Management Logic (extracted for testing)
// ============================================================================

interface DriveToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
}

const DRIVE_CONSTANTS = {
  CLIENT_ID: 'test-client-id',
  TOKEN_ENDPOINT: 'https://oauth2.googleapis.com/token',
  TOKEN_REFRESH_BUFFER_MS: 5 * 60 * 1000,
};

/**
 * Check if a token needs refresh.
 */
export function tokenNeedsRefresh(tokenData: DriveToken, bufferMs: number = DRIVE_CONSTANTS.TOKEN_REFRESH_BUFFER_MS): boolean {
  return tokenData.expiresAt < Date.now() + bufferMs;
}

/**
 * Parse token response from OAuth endpoint.
 */
export function parseTokenResponse(response: {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
}): DriveToken | null {
  if (!response.access_token) {
    return null;
  }
  
  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    expiresAt: Date.now() + (response.expires_in || 3600) * 1000,
  };
}

/**
 * Validate token data structure.
 */
export function isValidTokenData(data: unknown): data is DriveToken {
  if (!data || typeof data !== 'object') return false;
  const token = data as Record<string, unknown>;
  return (
    typeof token.accessToken === 'string' &&
    token.accessToken.length > 0 &&
    typeof token.expiresAt === 'number' &&
    token.expiresAt > 0
  );
}

/**
 * Calculate when token refresh should occur.
 */
export function getRefreshTime(expiresAt: number, bufferMs: number = DRIVE_CONSTANTS.TOKEN_REFRESH_BUFFER_MS): number {
  return expiresAt - bufferMs;
}

/**
 * Build OAuth authorization URL with PKCE parameters.
 */
export function buildAuthUrl(params: {
  clientId: string;
  redirectUri: string;
  scopes: string[];
  codeChallenge: string;
  interactive: boolean;
}): string {
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', params.clientId);
  authUrl.searchParams.set('redirect_uri', params.redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', params.scopes.join(' '));
  authUrl.searchParams.set('prompt', params.interactive ? 'consent' : 'none');
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('code_challenge', params.codeChallenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  return authUrl.toString();
}

/**
 * Build token exchange request body.
 */
export function buildTokenExchangeBody(params: {
  clientId: string;
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): URLSearchParams {
  return new URLSearchParams({
    client_id: params.clientId,
    code: params.code,
    code_verifier: params.codeVerifier,
    grant_type: 'authorization_code',
    redirect_uri: params.redirectUri,
  });
}

/**
 * Build token refresh request body.
 */
export function buildTokenRefreshBody(params: {
  clientId: string;
  refreshToken: string;
}): URLSearchParams {
  return new URLSearchParams({
    client_id: params.clientId,
    refresh_token: params.refreshToken,
    grant_type: 'refresh_token',
  });
}

/**
 * Extract authorization code from OAuth callback URL.
 */
export function extractAuthCode(responseUrl: string): { code?: string; error?: string } {
  const url = new URL(responseUrl);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  return { code: code || undefined, error: error || undefined };
}

// ============================================================================
// Tests
// ============================================================================

describe('Token Management Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('tokenNeedsRefresh', () => {
    it('should return true when token is expired', () => {
      const expiredToken: DriveToken = {
        accessToken: 'test-token',
        expiresAt: Date.now() - 1000, // 1 second ago
      };
      expect(tokenNeedsRefresh(expiredToken)).toBe(true);
    });

    it('should return true when token expires within buffer period', () => {
      const expiringToken: DriveToken = {
        accessToken: 'test-token',
        expiresAt: Date.now() + (3 * 60 * 1000), // 3 minutes from now
      };
      // Default buffer is 5 minutes
      expect(tokenNeedsRefresh(expiringToken)).toBe(true);
    });

    it('should return false when token has plenty of time left', () => {
      const validToken: DriveToken = {
        accessToken: 'test-token',
        expiresAt: Date.now() + (30 * 60 * 1000), // 30 minutes from now
      };
      expect(tokenNeedsRefresh(validToken)).toBe(false);
    });

    it('should respect custom buffer period', () => {
      const token: DriveToken = {
        accessToken: 'test-token',
        expiresAt: Date.now() + (3 * 60 * 1000), // 3 minutes from now
      };
      // With 1 minute buffer, should not need refresh
      expect(tokenNeedsRefresh(token, 1 * 60 * 1000)).toBe(false);
      // With 5 minute buffer, should need refresh
      expect(tokenNeedsRefresh(token, 5 * 60 * 1000)).toBe(true);
    });

    it('should handle edge case of exactly at buffer boundary', () => {
      const bufferMs = 5 * 60 * 1000;
      const token: DriveToken = {
        accessToken: 'test-token',
        expiresAt: Date.now() + bufferMs, // exactly at buffer
      };
      // Should not need refresh (uses < not <=)
      expect(tokenNeedsRefresh(token, bufferMs)).toBe(false);
    });
  });

  describe('parseTokenResponse', () => {
    it('should parse valid token response', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));

      const response = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
      };

      const token = parseTokenResponse(response);
      expect(token).not.toBeNull();
      expect(token!.accessToken).toBe('new-access-token');
      expect(token!.refreshToken).toBe('new-refresh-token');
      expect(token!.expiresAt).toBe(Date.now() + 3600 * 1000);
    });

    it('should return null for missing access_token', () => {
      const response = {
        refresh_token: 'some-token',
        expires_in: 3600,
      };
      expect(parseTokenResponse(response)).toBeNull();
    });

    it('should use default expires_in of 3600 when not provided', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T12:00:00Z'));

      const response = {
        access_token: 'test-token',
      };

      const token = parseTokenResponse(response);
      expect(token!.expiresAt).toBe(Date.now() + 3600 * 1000);
    });

    it('should handle response without refresh_token', () => {
      const response = {
        access_token: 'test-token',
        expires_in: 1800,
      };

      const token = parseTokenResponse(response);
      expect(token!.refreshToken).toBeUndefined();
    });

    it('should handle empty access_token string as invalid', () => {
      const response = {
        access_token: '',
        expires_in: 3600,
      };
      // Empty string is falsy, so should return null
      expect(parseTokenResponse(response)).toBeNull();
    });
  });

  describe('isValidTokenData', () => {
    it('should validate correct token data', () => {
      const validToken: DriveToken = {
        accessToken: 'valid-token',
        expiresAt: Date.now() + 3600000,
      };
      expect(isValidTokenData(validToken)).toBe(true);
    });

    it('should reject null', () => {
      expect(isValidTokenData(null)).toBe(false);
    });

    it('should reject undefined', () => {
      expect(isValidTokenData(undefined)).toBe(false);
    });

    it('should reject non-object types', () => {
      expect(isValidTokenData('string')).toBe(false);
      expect(isValidTokenData(123)).toBe(false);
      expect(isValidTokenData(true)).toBe(false);
      expect(isValidTokenData([])).toBe(false);
    });

    it('should reject empty accessToken', () => {
      expect(isValidTokenData({ accessToken: '', expiresAt: 12345 })).toBe(false);
    });

    it('should reject missing accessToken', () => {
      expect(isValidTokenData({ expiresAt: 12345 })).toBe(false);
    });

    it('should reject invalid expiresAt types', () => {
      expect(isValidTokenData({ accessToken: 'token', expiresAt: 'invalid' })).toBe(false);
      expect(isValidTokenData({ accessToken: 'token', expiresAt: null })).toBe(false);
    });

    it('should reject non-positive expiresAt', () => {
      expect(isValidTokenData({ accessToken: 'token', expiresAt: -1 })).toBe(false);
      expect(isValidTokenData({ accessToken: 'token', expiresAt: 0 })).toBe(false);
    });

    it('should accept token with optional refreshToken', () => {
      const tokenWithRefresh: DriveToken = {
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresAt: Date.now() + 3600000,
      };
      expect(isValidTokenData(tokenWithRefresh)).toBe(true);
    });
  });

  describe('getRefreshTime', () => {
    it('should calculate refresh time before expiry', () => {
      const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour from now
      const bufferMs = 5 * 60 * 1000; // 5 minutes
      
      const refreshTime = getRefreshTime(expiresAt, bufferMs);
      expect(refreshTime).toBe(expiresAt - bufferMs);
    });

    it('should use default buffer when not specified', () => {
      const expiresAt = Date.now() + (60 * 60 * 1000);
      const refreshTime = getRefreshTime(expiresAt);
      expect(refreshTime).toBe(expiresAt - DRIVE_CONSTANTS.TOKEN_REFRESH_BUFFER_MS);
    });

    it('should handle past expiry times', () => {
      const expiresAt = Date.now() - 1000; // Already expired
      const refreshTime = getRefreshTime(expiresAt);
      expect(refreshTime).toBeLessThan(Date.now());
    });
  });
});

describe('OAuth URL Building', () => {
  describe('buildAuthUrl', () => {
    it('should build correct OAuth URL with all parameters', () => {
      const url = buildAuthUrl({
        clientId: 'test-client-id',
        redirectUri: 'https://test.chromiumapp.org/',
        scopes: ['drive.file', 'userinfo.email'],
        codeChallenge: 'test-challenge-abc123',
        interactive: true,
      });

      const parsed = new URL(url);
      expect(parsed.origin).toBe('https://accounts.google.com');
      expect(parsed.pathname).toBe('/o/oauth2/v2/auth');
      expect(parsed.searchParams.get('client_id')).toBe('test-client-id');
      expect(parsed.searchParams.get('redirect_uri')).toBe('https://test.chromiumapp.org/');
      expect(parsed.searchParams.get('response_type')).toBe('code');
      expect(parsed.searchParams.get('scope')).toBe('drive.file userinfo.email');
      expect(parsed.searchParams.get('prompt')).toBe('consent');
      expect(parsed.searchParams.get('access_type')).toBe('offline');
      expect(parsed.searchParams.get('code_challenge')).toBe('test-challenge-abc123');
      expect(parsed.searchParams.get('code_challenge_method')).toBe('S256');
    });

    it('should set prompt to none for non-interactive flow', () => {
      const url = buildAuthUrl({
        clientId: 'test',
        redirectUri: 'https://test.chromiumapp.org/',
        scopes: ['drive.file'],
        codeChallenge: 'challenge',
        interactive: false,
      });

      const parsed = new URL(url);
      expect(parsed.searchParams.get('prompt')).toBe('none');
    });

    it('should handle single scope', () => {
      const url = buildAuthUrl({
        clientId: 'test',
        redirectUri: 'https://test.chromiumapp.org/',
        scopes: ['drive.file'],
        codeChallenge: 'challenge',
        interactive: true,
      });

      const parsed = new URL(url);
      expect(parsed.searchParams.get('scope')).toBe('drive.file');
    });
  });

  describe('buildTokenExchangeBody', () => {
    it('should build correct token exchange body', () => {
      const body = buildTokenExchangeBody({
        clientId: 'test-client',
        code: 'auth-code-123',
        codeVerifier: 'verifier-abc',
        redirectUri: 'https://test.chromiumapp.org/',
      });

      expect(body.get('client_id')).toBe('test-client');
      expect(body.get('code')).toBe('auth-code-123');
      expect(body.get('code_verifier')).toBe('verifier-abc');
      expect(body.get('grant_type')).toBe('authorization_code');
      expect(body.get('redirect_uri')).toBe('https://test.chromiumapp.org/');
    });
  });

  describe('buildTokenRefreshBody', () => {
    it('should build correct refresh body', () => {
      const body = buildTokenRefreshBody({
        clientId: 'test-client',
        refreshToken: 'refresh-token-xyz',
      });

      expect(body.get('client_id')).toBe('test-client');
      expect(body.get('refresh_token')).toBe('refresh-token-xyz');
      expect(body.get('grant_type')).toBe('refresh_token');
    });
  });

  describe('extractAuthCode', () => {
    it('should extract code from valid callback URL', () => {
      const result = extractAuthCode('https://test.chromiumapp.org/?code=auth-code-123&state=xyz');
      expect(result.code).toBe('auth-code-123');
      expect(result.error).toBeUndefined();
    });

    it('should extract error from failed callback URL', () => {
      const result = extractAuthCode('https://test.chromiumapp.org/?error=access_denied&error_description=User+denied');
      expect(result.code).toBeUndefined();
      expect(result.error).toBe('access_denied');
    });

    it('should handle URL with both code and error (edge case)', () => {
      const result = extractAuthCode('https://test.chromiumapp.org/?code=abc&error=test');
      expect(result.code).toBe('abc');
      expect(result.error).toBe('test');
    });

    it('should handle URL with no code or error', () => {
      const result = extractAuthCode('https://test.chromiumapp.org/');
      expect(result.code).toBeUndefined();
      expect(result.error).toBeUndefined();
    });
  });
});
