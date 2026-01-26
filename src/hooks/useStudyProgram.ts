import { useAppStore } from '../store/useAppStore';
import { useSyncStatus } from './data/useSyncStatus';

/**
 * useStudyProgram - Centralized hook for study program data.
 * 
 * Replaces local fetching logic with Zustand store selectors.
 * Aggregates store loading with global sync status for robust UI.
 */
export function useStudyProgram() {
    const data = useAppStore(state => state.studyProgram);
    const storeLoading = useAppStore(state => state.studyProgramLoading);
    const { isSyncing } = useSyncStatus();
    const fetchStudyProgram = useAppStore(state => state.fetchStudyProgram);

    // Final loading state: Store is fetching from IDB OR Global Sync is active (on first load)
    const isLoading = storeLoading || (isSyncing && !data);

    return { 
        data, 
        loading: isLoading, 
        error: null, // Error handling moved to slice
        reload: fetchStudyProgram, 
        sync: fetchStudyProgram // In new architecture, sync triggers reload via subscriber
    };
}
