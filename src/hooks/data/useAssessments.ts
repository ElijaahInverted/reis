/**
 * useAssessments - Hook to access assessment data from storage.
 * 
 * Returns stored data immediately and subscribes to sync updates.
 */

import { useState, useEffect } from 'react';
import { syncService } from '../../services/sync';
import { getAssessmentsForSubject } from '../../utils/apiUtils';
import type { Assessment } from '../../types/documents';

export interface UseAssessmentsResult {
    assessments: Assessment[] | null;
    isLoading: boolean;
}

export function useAssessments(courseCode: string | undefined): UseAssessmentsResult {
    const [assessments, setAssessments] = useState<Assessment[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!courseCode) {
            setAssessments(null);
            setIsLoading(false);
            return;
        }

        const loadFromStorage = () => {
            const storedAssessments = getAssessmentsForSubject(courseCode);
            setAssessments(storedAssessments);
            // If we have data, we are not loading. 
            // If we don't have data (null), we are still "loading" in the sense that we don't know yet.
            // However, useAssessments primarily just reads storage.
            // The determining factor for "loading" vs "empty" is often handled by the caller checking if sync is in progress,
            // or if we decide to store [] for empty assessments (which we should).
            // For now, we mimic useFiles:
            setIsLoading(false);
        };

        // 1. Initial load
        loadFromStorage();

        // 2. Subscribe to sync updates
        const unsubscribe = syncService.subscribe(() => {
            loadFromStorage();
        });

        return unsubscribe;
    }, [courseCode]);

    return { assessments, isLoading };
}
