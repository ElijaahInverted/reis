/**
 * useSyncStatus - Hook to access sync service status.
 * 
 * Provides real-time visibility into sync state.
 */

import { useState, useEffect } from 'react';
import { syncService, type SyncStatus } from '../../services/sync';

export function useSyncStatus(): SyncStatus {
    const [status, setStatus] = useState<SyncStatus>(syncService.getStatus());

    useEffect(() => {
        // Refresh status when sync completes
        const unsubscribe = syncService.subscribe(() => {
            setStatus(syncService.getStatus());
        });

        // Also poll periodically for isSyncing changes
        const interval = setInterval(() => {
            setStatus(syncService.getStatus());
        }, 1000);

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, []);

    return status;
}
