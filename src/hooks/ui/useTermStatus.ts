import { useState, useEffect } from 'react';
import type { ExamTerm } from '../../types/exams';
import { parseCapacity, parseRegistrationDate } from '../../utils/termHelpers';

interface TermStatus {
    capacity: { occupied: number; total: number; percent: number } | null;
    isFull: boolean;
    isFutureOpening: boolean;
    isRegistrationClosed: boolean;
    isBlocked: boolean;
    msUntilOpen: number;
}

export function useTermStatus(term: ExamTerm): TermStatus {
    const [now, setNow] = useState(() => new Date());
    
    const capacity = parseCapacity(term.capacity);
    const isFull = term.full || (capacity && capacity.occupied >= capacity.total) || false;

    const registrationDate = term.registrationStart ? parseRegistrationDate(term.registrationStart) : null;
    const isFutureOpening = Boolean(registrationDate && registrationDate > now);
    const msUntilOpen = isFutureOpening && registrationDate ? registrationDate.getTime() - now.getTime() : 0;

    const registrationEndDate = term.registrationEnd ? parseRegistrationDate(term.registrationEnd) : null;
    const isRegistrationClosed = Boolean(registrationEndDate && registrationEndDate < now);

    const isBlocked = term.canRegisterNow === false && !isFutureOpening && !isFull;

    useEffect(() => {
        if (!isFutureOpening) return;
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, [isFutureOpening]);

    return {
        capacity,
        isFull,
        isFutureOpening,
        isRegistrationClosed,
        isBlocked,
        msUntilOpen
    };
}
