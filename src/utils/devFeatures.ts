/**
 * Developer Features Toggle
 * 
 * Utilities to enable/disable hidden features for testing.
 * accessible via console: window.toggleDevFeatures()
 */

import { loggers } from './logger';

export const DEV_FEATURES_KEY = 'reis_dev_features';

export const isDevFeaturesEnabled = () => {
    try {
        // 1. URL Parameter (highest priority, persistent via browser history/reload if kept in URL)
        if (typeof window !== 'undefined' && window.location.search.includes('reis_dev=1')) {
            return true;
        }
        // 2. localStorage
        return localStorage.getItem(DEV_FEATURES_KEY) === 'true';
    } catch {
        return false;
    }
};

export const isNotificationsEnabled = () => {
    try {
        // 🎯 TEMPORARY: Force enabled for demo (remove after spolky launch)
        return true;
        
        // 1. URL Parameter (highest priority - perfect for demos)
        if (typeof window !== 'undefined' && window.location.search.includes('show_notifications=1')) {
            return true;
        }
        // 2. localStorage
        return localStorage.getItem('reis_notifications_enabled') === 'true';
    } catch {
        return false;
    }
};

export const toggleDevFeatures = (enable?: boolean) => {
    const newState = enable ?? !isDevFeaturesEnabled();
    localStorage.setItem(DEV_FEATURES_KEY, String(newState));
    loggers.system.info('[REIS] Dev features changed. Reloading...', newState ? 'ENABLED' : 'DISABLED');
    
    // Small delay to ensure localStorage is written before reload in some browsers
    setTimeout(() => {
        window.location.reload();
    }, 100);
};

export const toggleNotifications = (enable?: boolean) => {
    const newState = enable ?? !isNotificationsEnabled();
    localStorage.setItem('reis_notifications_enabled', String(newState));
    loggers.system.info('[REIS] Notifications changed. Reloading...', newState ? 'ENABLED' : 'DISABLED');
    
    setTimeout(() => {
        window.location.reload();
    }, 100);
};

// Type definition for window
declare global {
    interface Window {
        toggleDevFeatures: typeof toggleDevFeatures;
        toggleNotifications: typeof toggleNotifications;
    }
}

// Auto-register when imported
if (typeof window !== 'undefined') {
    // Explicitly cast to any to ensure runtime assignment works despite TS
    window.toggleDevFeatures = toggleDevFeatures;
    window.toggleNotifications = toggleNotifications;

    const handleMessage = () => {
        loggers.system.info('[REIS] Dev toggle command received!');
        toggleDevFeatures();
    };

    // Extension Isolation Bridges
    // 1. DOM Event
    document.addEventListener('reis-toggle-dev', handleMessage);
    // 2. window.postMessage (Standard for crossing context)
    window.addEventListener('message', (e) => {
        // Security: Only allow toggle from trusted origins
        if (e.origin !== "https://is.mendelu.cz" && !e.origin.startsWith('chrome-extension://')) return;
        
        if (e.data === 'reis-toggle-dev' || e.data?.type === 'reis-toggle-dev') {
            handleMessage();
        }
    });
    
    // Log help message on first load
    const HELP_KEY = 'reis_dev_help_shown_v4';
    if (!localStorage.getItem(HELP_KEY)) {
        loggers.system.info('[REIS] Dev Tools Loaded. Use window.toggleDevFeatures() or postMessage to toggle.');
        localStorage.setItem(HELP_KEY, 'true');
    }
}
