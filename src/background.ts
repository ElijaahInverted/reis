/**
 * Background Service Worker for REIS Extension (MV3)
 * 
 * Handles cross-origin requests that are blocked by CORS in the content script
 * context. Content scripts in MV3 can no longer bypass CORS for external domains.
 */

const ALLOWED_DOMAINS = [
    'uvis.mendelu.cz',
    'is.mendelu.cz'
];

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'REIS_BG_FETCH') {
        const { url, options } = message;
        
        try {
            const urlObj = new URL(url);
            if (!ALLOWED_DOMAINS.includes(urlObj.hostname)) {
                console.error('[Background] Domain not allowed:', urlObj.hostname);
                sendResponse({ 
                    success: false, 
                    error: `Domain ${urlObj.hostname} is not allowed for relay` 
                });
                return false;
            }
        } catch (e) {
            sendResponse({ success: false, error: 'Invalid URL' });
            return false;
        }
        
        console.log('[Background] Performing relay fetch for:', url);
        
        fetch(url, options)
            .then(async response => {
                const text = await response.text();
                sendResponse({ 
                    success: response.ok, 
                    status: response.status,
                    data: text 
                });
            })
            .catch(error => {
                console.error('[Background] Fetch failed:', error);
                sendResponse({ 
                    success: false, 
                    error: String(error) 
                });
            });
            
        return true; // Keep message channel open for async response
    }
});
