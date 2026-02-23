import type { SyncSlice, AppSlice } from '../types';
import { syncService } from '../../services/sync';

export const createSyncSlice: AppSlice<SyncSlice> = (set) => ({
    syncStatus: {
        isSyncing: false,
        lastSync: null,
        error: null,
        handshakeDone: false
    },
    isSyncing: true,
    fetchSyncStatus: async () => {
        const currentStatus = await syncService.getStatus();
        set({ 
            syncStatus: { ...currentStatus, handshakeDone: false }, // Reset handshake until message arrives
            isSyncing: currentStatus.isSyncing
        });
    },
    setSyncStatus: (status) => set((state) => ({ 
        syncStatus: { ...state.syncStatus, ...status, handshakeDone: true },
        isSyncing: status.isSyncing !== undefined ? status.isSyncing : state.isSyncing
    })),
});

