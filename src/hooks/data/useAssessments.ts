import { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useSyncStatus } from './useSyncStatus';
import type { Assessment } from '../../types/documents';

export interface UseAssessmentsResult {
    assessments: Assessment[] | null;
    isLoading: boolean;
}

/**
 * useAssessments - Hook to access assessment data from store.
 * 
 * Selects filtered assessments from central store.
 * Combines local store loading with global sync status.
 */
export function useAssessments(courseCode: string | undefined): UseAssessmentsResult {
    const assessmentsMap = useAppStore(state => state.assessments);
    const loadingMap = useAppStore(state => state.assessmentsLoading);
    const fetchAssessments = useAppStore(state => state.fetchAssessments);
    const { isSyncing } = useSyncStatus();

    const subjectAssessments = courseCode ? assessmentsMap[courseCode] : null;
    const isSubjectLoading = courseCode ? !!loadingMap[courseCode] : false;

    useEffect(() => {
        if (courseCode) {
            fetchAssessments(courseCode);
        }
    }, [courseCode, fetchAssessments]);

    // Final loading state: Store is fetching from IDB OR Global Sync is active (on first load)
    const isLoading = isSubjectLoading || (isSyncing && (!subjectAssessments || subjectAssessments.length === 0));

    return { 
        assessments: subjectAssessments || null, 
        isLoading 
    };
}
