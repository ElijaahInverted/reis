const CITYMIND_SCRIPT_URL = 'https://api.citymind.tech/resources/js/80';

export default defineBackground(() => {
    chrome.runtime.onMessage.addListener((msg, sender) => {
        if (msg?.type === 'INJECT_PEFBOT' && sender.tab?.id != null) {
            injectPefBot(sender.tab.id);
        }
    });
});

async function injectPefBot(tabId: number) {
    try {
        const res = await fetch(CITYMIND_SCRIPT_URL);
        if (!res.ok) return;
        let code = await res.text();
        // Fix Citymind bug: applyUITweaks calls loadTranslationsAndUpdate(lang, $shadow)
        // but the function expects ($shadow). Drop the extra `lang` arg.
        code = code.replace(
            '.loadTranslationsAndUpdate(\\n    lang,\\n    selector =>',
            '.loadTranslationsAndUpdate(\\n    selector =>'
        );
        chrome.scripting.executeScript({
            target: { tabId },
            world: 'MAIN',
            func: (js: string) => {
                const script = document.createElement('script');
                script.textContent = js;
                document.head.appendChild(script);
                script.remove();
            },
            args: [code],
        });
    } catch (e) {
        console.error('[REIS Background] PEFbot injection failed:', e);
    }
}
