import type { ClassmatesSlice, AppSlice } from '../types';

export const createClassmatesSlice: AppSlice<ClassmatesSlice> = (set) => ({
    classmates: {},
    classmatesLoading: {},

    fetchClassmates: async (courseCode, _skupinaId) => {
        // Guard: don't re-fetch if already loading or data exists
        const state = (await import('../useAppStore')).useAppStore.getState();
        if (state.classmatesLoading[courseCode] || state.classmates[courseCode] !== undefined) return;

        set((s) => ({ classmatesLoading: { ...s.classmatesLoading, [courseCode]: true } }));
        try {
            // TODO: call API with skupinaId and write to IDB
            // For now resolve to empty — UI will show "no classmates" state
            set((s) => ({
                classmates: { ...s.classmates, [courseCode]: [] },
                classmatesLoading: { ...s.classmatesLoading, [courseCode]: false },
            }));
        } catch {
            set((s) => ({ classmatesLoading: { ...s.classmatesLoading, [courseCode]: false } }));
        }
    },

    invalidateClassmates: () => set({ classmates: {}, classmatesLoading: {} }),
});
