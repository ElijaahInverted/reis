import type { UkolySlice, AppSlice } from '../types';
import { IndexedDBService } from '../../services/storage';

export const createUkolySlice: AppSlice<UkolySlice> = (set) => ({
  ukoly: [],
  ukolyStatus: 'idle',
  fetchUkoly: async () => {
    set({ ukolyStatus: 'loading' });
    try {
      const userParams = await IndexedDBService.get('meta', 'reis_user_params');
      const studium = userParams?.studium;
      
      if (studium) {
        const data = await IndexedDBService.get('ukoly', studium);
        set({
          ukoly: data || [],
          ukolyStatus: 'success',
        });
      } else {
        set({ ukolyStatus: 'success', ukoly: [] });
      }
    } catch {
      set({ ukolyStatus: 'error' });
    }
  },
  setUkoly: (assignments) => {
    set({ ukoly: assignments || [] });
  },
});
