import { useRef, useState, useCallback } from 'react';

const SWIPE_THRESHOLD = 50; // px to commit a week switch

export function useSwipeNavigation(onPrev: () => void, onNext: () => void) {
    const touchStartX = useRef<number | null>(null);
    const [dragOffset, setDragOffset] = useState(0);
    const [snappingBack, setSnappingBack] = useState(false);

    const onTouchStart = useCallback((e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        setSnappingBack(false);
    }, []);

    const onTouchMove = useCallback((e: React.TouchEvent) => {
        if (touchStartX.current === null) return;
        // Dampen so it feels attached to finger without flying off
        setDragOffset((e.touches[0].clientX - touchStartX.current) * 0.6);
    }, []);

    const onTouchEnd = useCallback((e: React.TouchEvent) => {
        if (touchStartX.current === null) return;
        const delta = e.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;

        if (Math.abs(delta) >= SWIPE_THRESHOLD) {
            // Instant switch — no delay
            setDragOffset(0);
            delta > 0 ? onPrev() : onNext();
        } else {
            // Spring back
            setSnappingBack(true);
            setDragOffset(0);
            setTimeout(() => setSnappingBack(false), 300);
        }
    }, [onPrev, onNext]);

    const dragStyle: React.CSSProperties = {
        transform: `translateX(${dragOffset}px)`,
        transition: snappingBack ? 'transform 280ms cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none',
    };

    return { onTouchStart, onTouchMove, onTouchEnd, dragStyle };
}
