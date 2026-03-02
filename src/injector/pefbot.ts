let injected = false;
let desiredVisible = true;
let widgetObserver: MutationObserver | null = null;

export async function injectPefBot() {
    if (injected) return;
    injected = true;
    try {
        await chrome.runtime.sendMessage({ type: 'INJECT_PEFBOT' });
        watchForWidget();
    } catch {
        injected = false;
    }
}

function watchForWidget() {
    const apply = () => {
        const widget = document.getElementById('shadow-root');
        if (!widget) return false;
        widget.style.position = 'fixed';
        widget.style.zIndex = '2147483647';
        widget.style.bottom = '0';
        widget.style.right = '0';
        widget.style.display = desiredVisible ? '' : 'none';
        patchShadowStyles(widget);
        return true;
    };

    if (apply()) return;

    widgetObserver = new MutationObserver(() => {
        if (apply()) {
            widgetObserver?.disconnect();
            widgetObserver = null;
        }
    });
    widgetObserver.observe(document.body, { childList: true, subtree: true });
}

function patchShadowStyles(widget: HTMLElement) {
    const shadow = widget.shadowRoot;
    if (!shadow) return;
    const style = document.createElement('style');
    style.textContent = `
        .chat-button, .chat-button-mobile {
            animation: none !important;
        }
    `;
    shadow.appendChild(style);
}

export function setPefBotVisible(visible: boolean) {
    desiredVisible = visible;
    const widget = document.getElementById('shadow-root');
    if (widget) {
        widget.style.display = visible ? '' : 'none';
    }
}
