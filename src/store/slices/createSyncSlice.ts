import type { SyncSlice, AppSlice } from '../types';
import { syncService } from '../../services/sync';

export const createSyncSlice: AppSlice<SyncSlice> = (set) => ({
    syncStatus: {
        isSyncing: false,
        lastSync: null,
        error: null
    },
    fetchSyncStatus: async () => {
        const currentStatus = await syncService.getStatus();
        set({ syncStatus: currentStatus });
    },
    setSyncStatus: (status) => set((state) => ({ 
        syncStatus: { ...state.syncStatus, ...status } 
    })),
});
