import type { AppSlice, StudyPlanSlice } from '../types';
import { IndexedDBService } from '../../services/storage';
import { isDualLanguageStudyPlan } from '../../types/studyPlan';
import type { StudyStats } from '../../types/studyPlan';

export const createStudyPlanSlice: AppSlice<StudyPlanSlice> = (set) => ({
    studyPlanDual: null,
    studyPlanLoading: false,
    studyStats: null,
    fetchStudyPlan: async () => {
        set({ studyPlanLoading: true });
        try {
            const stored = await IndexedDBService.get('study_plan', 'current');
            if (stored && isDualLanguageStudyPlan(stored)) {
                set({ studyPlanDual: stored, studyPlanLoading: false });
            } else {
                set({ studyPlanLoading: false });
            }
        } catch (e) {
            console.error('[Study Plan Slice] Failed to fetch from IndexedDB:', e);
            set({ studyPlanLoading: false });
        }
    },
    fetchStudyStats: async () => {
        try {
            const stored = await IndexedDBService.get('meta', 'study_stats') as StudyStats | null;
            if (stored) set({ studyStats: stored });
        } catch (e) {
            console.error('[Study Plan Slice] Failed to fetch study stats:', e);
        }
    },
});
