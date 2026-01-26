import type { AssessmentsSlice, AppSlice } from '../types';
import { IndexedDBService } from '../../services/storage';

export const createAssessmentsSlice: AppSlice<AssessmentsSlice> = (set) => ({
    assessments: {},
    assessmentsLoading: {},
    fetchAssessments: async (courseCode) => {
        set((state) => ({
            assessmentsLoading: { ...state.assessmentsLoading, [courseCode]: true }
        }));

        try {
            const data = await IndexedDBService.get('assessments', courseCode);
            set((state) => ({
                assessments: { ...state.assessments, [courseCode]: data || [] },
                assessmentsLoading: { ...state.assessmentsLoading, [courseCode]: false }
            }));
        } catch (error) {
            console.error(`[AssessmentsSlice] Fetch failed for ${courseCode}:`, error);
            set((state) => ({
                assessmentsLoading: { ...state.assessmentsLoading, [courseCode]: false }
            }));
        }
    },
});
