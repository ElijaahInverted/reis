/**
 * useSchedule - Hook to access schedule data from store.
 * 
 * Returns data from Zustand global store.
 * Initialization is handled by the store itself.
 */

import { useAppStore } from '../../store/useAppStore';
import type { BlockLesson } from '../../types/calendarTypes';

export interface UseScheduleResult {
    schedule: BlockLesson[];
    isLoaded: boolean;
    status: 'idle' | 'loading' | 'success' | 'error';
    error: string | null;
    weekStart: Date | null;
}

export function useSchedule(): UseScheduleResult {
    const { data, status, weekStart } = useAppStore(state => state.schedule);
    
    return { 
        schedule: data, 
        isLoaded: status !== 'loading' && status !== 'idle', 
        status,
        error: null, // Schedule slice doesn't currently store error message, but we can add it later if needed
        weekStart 
    };
}
