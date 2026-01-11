/**
 * useExams - Hook to access exam data from storage.
 * 
 * Returns stored data immediately (stale-while-revalidate pattern).
 * Subscribes to sync updates for automatic refresh.
 * Includes error state for better UX feedback.
 */

import { useState, useEffect, useCallback } from 'react';
import { StorageService, STORAGE_KEYS } from '../../services/storage';
import { syncService } from '../../services/sync';
import type { ExamSubject } from '../../types/exams';

export interface UseExamsResult {
    exams: ExamSubject[];
    isLoaded: boolean;
    error: string | null;
    lastSync: number | null;
    retry: () => void;
}

export function useExams(): UseExamsResult {
    const [state, setState] = useState<{
        exams: ExamSubject[];
        isLoaded: boolean;
        error: string | null;
        lastSync: number | null;
    }>(() => {
        try {
            const storedData = StorageService.get<ExamSubject[]>(STORAGE_KEYS.EXAMS_DATA);
            const storedLastSync = StorageService.get<number>(STORAGE_KEYS.LAST_SYNC);
            return {
                exams: storedData || [],
                isLoaded: true,
                error: null,
                lastSync: storedLastSync,
            };
        } catch (err) {
            console.error('[useExams] Failed to load from storage:', err);
            return {
                exams: [],
                isLoaded: true,
                error: 'Nepodařilo se načíst data zkoušek.',
                lastSync: null,
            };
        }
    });

    const loadFromStorage = useCallback(() => {
        try {
            const storedData = StorageService.get<ExamSubject[]>(STORAGE_KEYS.EXAMS_DATA);
            const storedLastSync = StorageService.get<number>(STORAGE_KEYS.LAST_SYNC);

            setState({
                exams: storedData || [],
                isLoaded: true,
                error: null,
                lastSync: storedLastSync,
            });
        } catch (err) {
            console.error('[useExams] Failed to load from storage:', err);
            setState(prev => ({
                ...prev,
                isLoaded: true,
                error: 'Nepodařilo se načíst data zkoušek.',
            }));
        }
    }, []);

    const retry = useCallback(() => {
        setState(prev => ({ ...prev, isLoaded: false, error: null }));
        loadFromStorage();
    }, [loadFromStorage]);

    useEffect(() => {
        // Subscribe to sync updates
        const unsubscribe = syncService.subscribe(() => {
            loadFromStorage();
        });

        return unsubscribe;
    }, [loadFromStorage]);

    return { ...state, retry };
}

