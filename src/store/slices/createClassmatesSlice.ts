import type { ClassmatesSlice, AppSlice } from '../types';
import type { ClassmatesData } from '../../types/classmates';
import { IndexedDBService } from '../../services/storage';

export const createClassmatesSlice: AppSlice<ClassmatesSlice> = (set, get) => ({
    classmates: {},
    classmatesLoading: {},
    classmatesPriorityLoading: {},
    classmatesProgress: {},

    fetchClassmates: async (courseCode) => {
        set((state) => ({
            classmatesLoading: { ...state.classmatesLoading, [courseCode]: true }
        }));

        try {
            const data = await IndexedDBService.get('classmates', courseCode) as ClassmatesData | null;
            set((state) => ({
                classmates: {
                    ...state.classmates,
                    [courseCode]: data || { all: [], seminar: [] }
                },
                classmatesLoading: { ...state.classmatesLoading, [courseCode]: false },
                // Also clear priority loading if it was active
                classmatesPriorityLoading: { ...state.classmatesPriorityLoading, [courseCode]: false }
            }));
        } catch (error) {
            console.error(`[ClassmatesSlice] Fetch failed for ${courseCode}:`, error);
            set((state) => ({
                classmates: { ...state.classmates, [courseCode]: state.classmates[courseCode] ?? { all: [], seminar: [] } },
                classmatesLoading: { ...state.classmatesLoading, [courseCode]: false },
                classmatesPriorityLoading: { ...state.classmatesPriorityLoading, [courseCode]: false }
            }));
        }
    },

    fetchClassmatesPriority: async (courseCode) => {
        // Avoid duplicate priority fetches
        if (get().classmatesPriorityLoading[courseCode]) return;

        set((state) => ({
            classmatesPriorityLoading: { ...state.classmatesPriorityLoading, [courseCode]: true },
            classmatesProgress: { ...state.classmatesProgress, [courseCode]: 'fetching' }
        }));

        try {
            // First try IndexedDB for instant load
            const cachedData = await IndexedDBService.get('classmates', courseCode) as ClassmatesData | null;
            if (cachedData) {
                set((state) => ({
                    classmates: { ...state.classmates, [courseCode]: cachedData },
                    classmatesPriorityLoading: { ...state.classmatesPriorityLoading, [courseCode]: false },
                    classmatesProgress: { ...state.classmatesProgress, [courseCode]: 'success' }
                }));
                return;
            }

            // No IDB cache — only wait if sync is actively running
            const isSyncCurrentlyRunning = get().syncStatus.isSyncing;
            if (!isSyncCurrentlyRunning) {
                // Sync already finished with no data for this course
                set((state) => ({
                    classmates: { ...state.classmates, [courseCode]: { all: [], seminar: [] } },
                    classmatesPriorityLoading: { ...state.classmatesPriorityLoading, [courseCode]: false },
                    classmatesProgress: { ...state.classmatesProgress, [courseCode]: 'success' }
                }));
                return;
            }

            // Sync is running: subscribe to its completion then re-check IDB
            set((state) => ({
                classmatesProgress: { ...state.classmatesProgress, [courseCode]: 'waiting_sync' }
            }));

            const { useAppStore } = await import('../useAppStore');
            const unsubscribe = useAppStore.subscribe(async (state, prevState) => {
                if (prevState.syncStatus.isSyncing && !state.syncStatus.isSyncing) {
                    unsubscribe();
                    await get().fetchClassmates(courseCode);
                }
            });
        } catch (error) {
            console.error(`[ClassmatesSlice] Priority fetch failed for ${courseCode}:`, error);
            set((state) => ({
                classmates: { ...state.classmates, [courseCode]: { all: [], seminar: [] } },
                classmatesPriorityLoading: { ...state.classmatesPriorityLoading, [courseCode]: false },
                classmatesProgress: { ...state.classmatesProgress, [courseCode]: 'error' }
            }));
        }
    },

    invalidateClassmates: () => {
        set({ classmates: {}, classmatesPriorityLoading: {}, classmatesProgress: {} });
    },
});
