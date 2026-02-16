import type { ClassmatesSlice, AppSlice } from '../types';
import type { ClassmatesData } from '../../types/classmates';
import { IndexedDBService } from '../../services/storage';

export const createClassmatesSlice: AppSlice<ClassmatesSlice> = (set) => ({
    classmates: {},
    classmatesLoading: {},
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
                classmatesLoading: { ...state.classmatesLoading, [courseCode]: false }
            }));
        } catch (error) {
            console.error(`[ClassmatesSlice] Fetch failed for ${courseCode}:`, error);
            set((state) => ({
                classmatesLoading: { ...state.classmatesLoading, [courseCode]: false }
            }));
        }
    },
    invalidateClassmates: () => {
        set({ classmates: {} });
    },
});
