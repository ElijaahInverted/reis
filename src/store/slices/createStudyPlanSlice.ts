import type { AppSlice, StudyPlanSlice } from '../types';
import { IndexedDBService } from '../../services/storage';
import { isDualLanguageStudyPlan } from '../../types/studyPlan';
import type { StudyStats } from '../../types/studyPlan';

export const createStudyPlanSlice: AppSlice<StudyPlanSlice> = (set) => ({
    studyPlanDual: null,
    studyPlanLoading: true,   // start true — skeleton shows until first fetch resolves
    studyPlanLoaded: false,
    studyStats: null,
    fetchStudyPlan: async () => {
        console.log('[StudyPlan] fetchStudyPlan → loading: true');
        set({ studyPlanLoading: true });
        try {
            const stored = await IndexedDBService.get('study_plan', 'current');
            console.log('[StudyPlan] IDB read →', stored === null ? 'null' : stored === undefined ? 'undefined' : typeof stored, stored);
            if (stored && isDualLanguageStudyPlan(stored)) {
                console.log('[StudyPlan] valid plan found → loading: false, setting studyPlanDual');
                set({ studyPlanDual: stored, studyPlanLoading: false, studyPlanLoaded: true });
            } else {
                console.warn('[StudyPlan] no valid plan in IDB (type guard failed or empty) → loading: false');
                set({ studyPlanLoading: false, studyPlanLoaded: true });
            }
        } catch (e) {
            console.error('[StudyPlan] IDB read failed:', e);
            set({ studyPlanLoading: false, studyPlanLoaded: true });
        }
    },
    fetchStudyStats: async () => {
        console.log('[StudyPlan] fetchStudyStats → reading IDB meta/study_stats');
        try {
            const stored = await IndexedDBService.get('meta', 'study_stats') as StudyStats | null;
            console.log('[StudyPlan] study_stats IDB →', stored);
            if (stored) set({ studyStats: stored });
        } catch (e) {
            console.error('[StudyPlan] Failed to fetch study stats:', e);
        }
    },
});
