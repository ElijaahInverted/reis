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
 * Re-fetches when language changes.
 */
export function useFiles(courseCode: string | undefined): UseFilesResult {
    const language = useAppStore((state) => state.language); // Get current language
    const filesMap = useAppStore((state) => state.files);
    const loadingMap = useAppStore((state) => state.filesLoading);
    const fetchFiles = useAppStore((state) => state.fetchFiles);
    const { isSyncing } = useSyncStatus();

    const subjectFiles = courseCode ? filesMap[courseCode] : null;
    const isSubjectLoading = courseCode ? !!loadingMap[courseCode] : false;

    useEffect(() => {
        // Fetch if missing OR if cached language differs from current language
        const shouldFetch = courseCode && (!subjectFiles || subjectFiles.length === 0 || subjectFiles[0]?.language !== language);
        if (shouldFetch) {
            fetchFiles(courseCode);
        }
    }, [courseCode, fetchFiles, language, subjectFiles]);

    // Final loading state: Store is fetching from IDB OR Global Sync is active (on first load)
    const isLoading = isSubjectLoading || (isSyncing && (!subjectFiles || subjectFiles.length === 0));

    return {
        files: subjectFiles || null,
        isLoading
    };
}
