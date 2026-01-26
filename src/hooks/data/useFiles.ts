import { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useSyncStatus } from './useSyncStatus';
import type { ParsedFile } from '../../types/documents';

export interface UseFilesResult {
    files: ParsedFile[] | null;
    isLoading: boolean;
}

/**
 * useFiles - Hook to access subject files from store.
 * 
 * Selects filtered files from central store.
 * Combines local store loading with global sync status.
 */
export function useFiles(courseCode: string | undefined): UseFilesResult {
    const filesMap = useAppStore(state => state.files);
    const loadingMap = useAppStore(state => state.filesLoading);
    const fetchFiles = useAppStore(state => state.fetchFiles);
    const { isSyncing } = useSyncStatus();

    const subjectFiles = courseCode ? filesMap[courseCode] : null;
    const isSubjectLoading = courseCode ? !!loadingMap[courseCode] : false;

    useEffect(() => {
        if (courseCode) {
            fetchFiles(courseCode);
        }
    }, [courseCode, fetchFiles]);

    // Final loading state: Store is fetching from IDB OR Global Sync is active (on first load)
    const isLoading = isSubjectLoading || (isSyncing && (!subjectFiles || subjectFiles.length === 0));

    return { 
        files: subjectFiles || null, 
        isLoading 
    };
}
