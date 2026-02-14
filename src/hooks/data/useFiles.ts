import { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { ParsedFile } from '../../types/documents';

export interface UseFilesResult {
    files: ParsedFile[] | null;
    isLoading: boolean;
    isPriorityLoading: boolean;
    progressStatus: string;
}

/**
 * useFiles - Hook to access subject files from store.
 *
 * Reads files and loading state from the Zustand store.
 * Triggers a store fetch if data is missing (store action is idempotent).
 */
export function useFiles(courseCode?: string): UseFilesResult {
    const subjectFiles = useAppStore(state => courseCode ? state.files[courseCode] : undefined);
    const isSubjectLoading = useAppStore(state => courseCode ? !!state.filesLoading[courseCode] : false);
    const isPriorityLoading = useAppStore(state => courseCode ? !!state.filesPriorityLoading[courseCode] : false);
    const progressStatus = useAppStore(state => courseCode ? state.filesProgress[courseCode] || '' : '');
    const isSyncing = useAppStore(state => state.syncStatus.isSyncing);

    useEffect(() => {
        if (courseCode) {
            const state = useAppStore.getState();
            // Priority fetch only when files have never been loaded (undefined)
            // [] means synced with no files — use the normal IDB path
            if (state.files[courseCode] === undefined) {
                state.fetchFilesPriority(courseCode);
            } else {
                state.fetchFiles(courseCode);
            }
        }
    }, [courseCode]);

    const isLoading = courseCode
        ? (isSubjectLoading || subjectFiles === undefined || (isPriorityLoading && (!subjectFiles || subjectFiles.length === 0)))
        : false;

    return {
        files: subjectFiles ?? null,
        isLoading,
        isPriorityLoading,
        progressStatus
    };
}

