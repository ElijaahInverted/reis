import type { FilesSlice, AppSlice } from '../types';
import { IndexedDBService } from '../../services/storage';
import type { ParsedFile } from '../../types/documents';

export const createFilesSlice: AppSlice<FilesSlice> = (set, get) => ({
    files: {},
    filesLoading: {},
    fetchFiles: async (courseCode) => {
        const { files, filesLoading } = get();
        
        // Skip if already in memory (optional, but keep it for now as a cache)
        // Note: For real-time updates we rely on the sync subscriber in initializeStore
        if (files[courseCode] && !filesLoading[courseCode]) {
            // We could return here, but let's refresh from IDB anyway to be safe
        }

        set((state) => ({
            filesLoading: { ...state.filesLoading, [courseCode]: true }
        }));

        try {
            const data = await IndexedDBService.get('files', courseCode);
            set((state) => ({
                files: { ...state.files, [courseCode]: data || [] },
                filesLoading: { ...state.filesLoading, [courseCode]: false }
            }));
        } catch (error) {
            console.error(`[FilesSlice] Fetch failed for ${courseCode}:`, error);
            set((state) => ({
                filesLoading: { ...state.filesLoading, [courseCode]: false }
            }));
        }
    },
    fetchAllFiles: async () => {
        try {
            const allFiles = await IndexedDBService.getAllWithKeys('files');
            const filesMap: Record<string, ParsedFile[]> = {};
            allFiles.forEach(({ key, value }) => {
                filesMap[key] = value;
            });
            set({ files: filesMap });
        } catch (error) {
            console.error('[FilesSlice] Fetch all failed:', error);
        }
    },
});
