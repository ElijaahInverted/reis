/**
 * useExams - Hook to access exam data from storage.
 * 
 * Returns stored data immediately (stale-while-revalidate pattern).
 * Subscribes to sync updates for automatic refresh.
 */

import { useState, useEffect } from 'react';
import { StorageService, STORAGE_KEYS } from '../../services/storage';
import { syncService } from '../../services/sync';
import type { ExamSubject } from '../../types/exams';

export interface UseExamsResult {
    exams: ExamSubject[];
    isLoaded: boolean;
}

export function useExams(): UseExamsResult {
    const [exams, setExams] = useState<ExamSubject[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // 1. Immediately load from storage
        const loadFromStorage = () => {
            const storedData = StorageService.get<ExamSubject[]>(STORAGE_KEYS.EXAMS_DATA);

            if (storedData) {
                setExams(storedData);
                setIsLoaded(true);
            }
        };

        loadFromStorage();

        // 2. Subscribe to sync updates
        const unsubscribe = syncService.subscribe(() => {
            loadFromStorage();
        });

        return unsubscribe;
    }, []);

    return { exams, isLoaded };
}
