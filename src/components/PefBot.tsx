import { useRef } from 'react';

const PEFBOT_URL = 'https://reis-mendelu.github.io/reis-data/pefbot.html';

interface PefBotProps {
    visible: boolean;
}

export function PefBot({ visible }: PefBotProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    return (
        <iframe
            ref={iframeRef}
            src={PEFBOT_URL}
            title="PEFbot"
            className="fixed bottom-0 right-0 z-50 border-none"
            style={{
                display: visible ? 'block' : 'none',
                width: '420px',
                height: '600px',
                background: 'transparent',
                colorScheme: 'normal',
            }}
            allow="microphone"
            allowTransparency
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
    );
}
