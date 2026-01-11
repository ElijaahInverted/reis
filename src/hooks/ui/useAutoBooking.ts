/**
 * useAutoBooking - Hook for automatic exam term booking at registration start time.
 * 
 * This hook manages the countdown and automatic registration trigger for exam terms
 * that have a scheduled registration start time. When the current time passes the
 * registration start, it automatically calls the provided registration function.
 * 
 * Features:
 * - Countdown timer for locked terms
 * - Automatic registration trigger
 * - Cancellation support
 * - Time formatting utilities
 */

import { useState, useEffect, useCallback } from 'react';

interface ExamTerm {
    id: string;
    registrationStart?: string;
    date?: string;
    time?: string;
}

interface UseAutoBookingOptions<T extends ExamTerm> {
    /** List of terms to monitor */
    terms: T[];
    /** Function to find a term by ID (optional, defaults to simple find) */
    findTerm?: (termId: string, terms: T[]) => T | undefined;
    /** Function to call when auto-booking triggers */
    onRegister: (termId: string) => Promise<void>;
    /** Callback when booking is triggered */
    onBookingTriggered?: (termId: string) => void;
    /** Callback on error */
    onError?: (error: Error) => void;
}

interface UseAutoBookingReturn {
    /** ID of the term being auto-booked (null if none) */
    autoBookingTermId: string | null;
    /** Start auto-booking for a term */
    startAutoBooking: (termId: string) => void;
    /** Cancel current auto-booking */
    cancelAutoBooking: () => void;
    /** Check if a term is currently being auto-booked */
    isAutoBooking: (termId: string) => boolean;
    /** Get countdown info for a locked term */
    getCountdown: (registrationStart: string | undefined) => CountdownInfo | null;
    /** Parse registration start date string */
    parseDate: (dateStr: string) => Date;
}

interface CountdownInfo {
    isLocked: boolean;
    timeUntil: number; // milliseconds
    formatted: string;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

/**
 * Parse Czech date string format "DD.MM.YYYY HH:MM" into a Date object
 */
function parseCzechDate(dateStr: string): Date {
    const [datePart, timePart] = dateStr.split(' ');
    const [day, month, year] = datePart.split('.').map(Number);
    const [hours, minutes] = timePart?.split(':').map(Number) ?? [0, 0];
    return new Date(year, month - 1, day, hours, minutes);
}

/**
 * Format countdown duration into human-readable string
 */
function formatCountdown(ms: number): string {
    if (ms <= 0) return 'Registrace otevřena';

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        return `${days}d ${hours % 24}h ${minutes % 60}m`;
    }
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    }
    if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
}

export function useAutoBooking<T extends ExamTerm>(
    options: UseAutoBookingOptions<T>
): UseAutoBookingReturn {
    const { terms, findTerm, onRegister, onBookingTriggered, onError } = options;

    const [autoBookingTermId, setAutoBookingTermId] = useState<string | null>(null);
    const [now, setNow] = useState(() => new Date());

    // Update "now" every second for countdown
    useEffect(() => {
        const interval = setInterval(() => {
            setNow(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Start auto-booking for a term
    const startAutoBooking = useCallback((termId: string) => {
        setAutoBookingTermId(termId);
    }, []);

    // Cancel auto-booking
    const cancelAutoBooking = useCallback(() => {
        setAutoBookingTermId(null);
    }, []);

    // Check if a specific term is being auto-booked
    const isAutoBooking = useCallback((termId: string) => {
        return autoBookingTermId === termId;
    }, [autoBookingTermId]);

    // Get countdown info for a locked term
    const getCountdown = useCallback((registrationStart: string | undefined): CountdownInfo | null => {
        if (!registrationStart) return null;

        try {
            const startDate = parseCzechDate(registrationStart);
            const timeUntil = startDate.getTime() - now.getTime();
            const isLocked = timeUntil > 0;

            const totalSeconds = Math.max(0, Math.floor(timeUntil / 1000));
            const days = Math.floor(totalSeconds / 86400);
            const hours = Math.floor((totalSeconds % 86400) / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;

            return {
                isLocked,
                timeUntil,
                formatted: formatCountdown(timeUntil),
                days,
                hours,
                minutes,
                seconds,
            };
        } catch {
            return null;
        }
    }, [now]);

    // Parse date utility (exposed for component use)
    const parseDate = useCallback(parseCzechDate, []);

    // Monitor and trigger registration when time comes
    useEffect(() => {
        if (!autoBookingTermId) return;

        const interval = setInterval(async () => {
            // Find the term
            const term = findTerm
                ? findTerm(autoBookingTermId, terms)
                : terms.find(t => t.id === autoBookingTermId);

            if (!term || !term.registrationStart) {
                setAutoBookingTermId(null);
                return;
            }

            const start = parseCzechDate(term.registrationStart);
            if (new Date() >= start) {
                try {
                    onBookingTriggered?.(autoBookingTermId);
                    await onRegister(autoBookingTermId);
                } catch (error) {
                    onError?.(error as Error);
                } finally {
                    setAutoBookingTermId(null);
                }
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [autoBookingTermId, terms, findTerm, onRegister, onBookingTriggered, onError]);

    return {
        autoBookingTermId,
        startAutoBooking,
        cancelAutoBooking,
        isAutoBooking,
        getCountdown,
        parseDate,
    };
}
