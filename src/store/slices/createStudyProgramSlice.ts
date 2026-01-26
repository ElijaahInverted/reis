import type { StudyProgramSlice, AppSlice } from '../types';
import { IndexedDBService } from '../../services/storage';

export const createStudyProgramSlice: AppSlice<StudyProgramSlice> = (set) => ({
    studyProgram: null,
    studyProgramLoading: false,
    fetchStudyProgram: async () => {
        set({ studyProgramLoading: true });
        try {
            const data = await IndexedDBService.get('study_program', 'current');
            set({ 
                studyProgram: data || null,
                studyProgramLoading: false 
            });
        } catch (error) {
            console.error('[StudyProgramSlice] Fetch failed:', error);
            set({ studyProgramLoading: false });
        }
    },
});
