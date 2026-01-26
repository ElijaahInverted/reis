import type { SubjectsSlice, AppSlice } from '../types';
import { IndexedDBService } from '../../services/storage';

export const createSubjectsSlice: AppSlice<SubjectsSlice> = (set) => ({
    subjects: null,
    subjectsLoading: false,
    fetchSubjects: async () => {
        set({ subjectsLoading: true });
        try {
            const data = await IndexedDBService.get('subjects', 'current');
            set({ 
                subjects: data || null,
                subjectsLoading: false 
            });
        } catch (error) {
            console.error('[SubjectsSlice] Fetch failed:', error);
            set({ subjectsLoading: false });
        }
    },
});
