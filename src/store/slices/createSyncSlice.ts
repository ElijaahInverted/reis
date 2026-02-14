import type { SyncSlice, AppSlice } from '../types';
import { syncService } from '../../services/sync';

export const createSyncSlice: AppSlice<SyncSlice> = (set) => ({
    syncStatus: {
        isSyncing: false,
        lastSync: null,
        error: null
    },
    isSyncing: false,
    fetchSyncStatus: async () => {
        const currentStatus = await syncService.getStatus();
        set({ 
            syncStatus: currentStatus,
            isSyncing: currentStatus.isSyncing
        });
    },
    setSyncStatus: (status) => set((state) => ({ 
        syncStatus: { ...state.syncStatus, ...status },
        isSyncing: status.isSyncing !== undefined ? status.isSyncing : state.isSyncing
    })),
});

