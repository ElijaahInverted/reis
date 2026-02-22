import { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { Classmate } from '../../types/classmates';

export interface UseClassmatesResult {
    classmates: Classmate[];
    isLoading: boolean;
    progressStatus: string;
}

/**
 * useClassmates - Hook to access classmates data from store.
 *
 * Triggers fetchClassmatesAll and fetchClassmatesSeminar in parallel on mount.
 * Each fetch is independently deduped and reads from IDB cache first.
 * Loading state is scoped to the active filter tab.
 */
export function useClassmates(courseCode: string | undefined, filter: 'all' | 'seminar' = 'all'): UseClassmatesResult {
    const classmatesData = useAppStore(state => courseCode ? state.classmates[courseCode] : undefined);
    const isAllLoading = useAppStore(state => courseCode ? !!state.classmatesAllLoading[courseCode] : false);
    const isSeminarLoading = useAppStore(state => courseCode ? !!state.classmatesSeminarLoading[courseCode] : false);
    const allProgress = useAppStore(state => courseCode ? state.classmatesAllProgress[courseCode] || '' : '');
    const seminarProgress = useAppStore(state => courseCode ? state.classmatesSeminarProgress[courseCode] || '' : '');
    const lastSync = useAppStore(state => state.syncStatus.lastSync);

    useEffect(() => {
        if (courseCode) {
            const state = useAppStore.getState();
            state.fetchClassmatesAll(courseCode);
            state.fetchClassmatesSeminar(courseCode);
        }
    }, [courseCode, lastSync]);

    // Show skeleton until data arrives for the active filter.
    // classmatesData undefined means neither fetch has completed yet.
    const isLoading = filter === 'all'
        ? (isAllLoading || classmatesData === undefined)
        : (isSeminarLoading || classmatesData === undefined);

    const progressStatus = filter === 'all' ? allProgress : seminarProgress;

    return {
        classmates: classmatesData?.[filter] || [],
        isLoading,
        progressStatus,
    };
}
