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
            } else {
                // If no cache, keep priority loading true until sync service populates data
                set((state) => ({
                    classmatesProgress: { ...state.classmatesProgress, [courseCode]: 'waiting_sync' }
                }));
            }
        } catch (error) {
            console.error(`[ClassmatesSlice] Priority fetch failed for ${courseCode}:`, error);
            set((state) => ({
                classmatesPriorityLoading: { ...state.classmatesPriorityLoading, [courseCode]: false },
                classmatesProgress: { ...state.classmatesProgress, [courseCode]: 'error' }
            }));
        }
    },
    
    invalidateClassmates: () => {
        set({ classmates: {}, classmatesPriorityLoading: {}, classmatesProgress: {} });
    },
});
