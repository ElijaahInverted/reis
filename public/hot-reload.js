// Hot-reload background script for development
// Only activates in unpacked/development mode

const RELOAD_INTERVAL = 1000; // Check every 1 second
let lastModified = null;

// Check if extension files have changed
async function checkForChanges() {
    try {
        // Fetch manifest.json to check if build has changed
        const response = await fetch(chrome.runtime.getURL('manifest.json'), {
            cache: 'no-cache'
        });

        const currentModified = response.headers.get('last-modified') || Date.now().toString();

        if (lastModified === null) {
            lastModified = currentModified;
            console.debug('[hot-reload] Initial timestamp:', lastModified);
        } else if (lastModified !== currentModified) {
            console.log('[hot-reload] Build changed, reloading...');

            // Reload all is.mendelu.cz tabs
            const tabs = await chrome.tabs.query({ url: 'https://is.mendelu.cz/*' });
            for (const tab of tabs) {
                if (tab.id) {
                    chrome.tabs.reload(tab.id);
                }
            }

            // Reload extension itself
            chrome.runtime.reload();
        }
    } catch (error) {
        console.debug('[hot-reload] Check failed:', error);
    }
}

// Only run in development mode
chrome.management.getSelf((self) => {
    if (self.installType === 'development') {
        console.log('[hot-reload] Development mode detected, watching for changes...');
        setInterval(checkForChanges, RELOAD_INTERVAL);
        checkForChanges(); // Initial check
    }
});
