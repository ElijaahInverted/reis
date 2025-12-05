/**
 * useSchedule - Hook to access schedule data from storage.
 * 
 * Returns stored data immediately (stale-while-revalidate pattern).
 * Subscribes to sync updates for automatic refresh.
 */

import { useState, useEffect } from 'react';
import { StorageService, STORAGE_KEYS } from '../../services/storage';
import { syncService } from '../../services/sync';
import type { BlockLesson } from '../../types/calendarTypes';

export interface UseScheduleResult {
    schedule: BlockLesson[];
    isLoaded: boolean;
    weekStart: Date | null;
}

export function useSchedule(): UseScheduleResult {
    const [schedule, setSchedule] = useState<BlockLesson[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [weekStart, setWeekStart] = useState<Date | null>(null);

    useEffect(() => {
        // 1. Immediately load from storage
        const loadFromStorage = () => {
            const storedData = StorageService.get<BlockLesson[]>(STORAGE_KEYS.SCHEDULE_DATA);
            const storedWeekStart = StorageService.get<string>(STORAGE_KEYS.SCHEDULE_WEEK_START);

            if (storedData) {
                setSchedule(storedData);
                setIsLoaded(true);
            }

            if (storedWeekStart) {
                setWeekStart(new Date(storedWeekStart));
            }
        };

        loadFromStorage();

        // 2. Subscribe to sync updates
        const unsubscribe = syncService.subscribe(() => {
            loadFromStorage();
        });

        return unsubscribe;
    }, []);

    return { schedule, isLoaded, weekStart };
}
