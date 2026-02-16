import type { FilesSlice, AppSlice } from '../types';
import { IndexedDBService } from '../../services/storage';
import type { ParsedFile } from '../../types/documents';

export const createFilesSlice: AppSlice<FilesSlice> = (set, get) => ({
    files: {},
    filesLoading: {},
    filesPriorityLoading: {},
    filesProgress: {},
    filesTotalCount: {},
    fetchFiles: async (courseCode) => {
        const { files, filesLoading } = get();

        // We skip if:
        // 1. We're already loading this course
        // 2. We have cached files (even if empty [])
        if (filesLoading[courseCode] || files[courseCode] !== undefined) {
            return;
        }

        // Set loading synchronously before any await so the skeleton renders immediately
        set((state) => ({
            filesLoading: { ...state.filesLoading, [courseCode]: true }
        }));

        await get().refreshFiles(courseCode);
    },
    fetchFilesPriority: async (courseCode) => {
        const { files, filesPriorityLoading, language: currentLang } = get();

        // Already loading, or files have been fetched (even if empty — [] means "synced, no files")
        if (filesPriorityLoading[courseCode] || Array.isArray(files[courseCode])) {
            return;
        }

        console.log(`[FilesSlice] Starting priority fetch for ${courseCode}`);
        set((state) => ({
            filesPriorityLoading: { ...state.filesPriorityLoading, [courseCode]: true },
            filesProgress: { ...state.filesProgress, [courseCode]: 'initializing' }
        }));

        try {
            // Check IndexedDB first
            const cached = await IndexedDBService.get('files', courseCode);
            if (cached) {
                const data = (cached as { cz?: ParsedFile[], en?: ParsedFile[] })[currentLang] || [];
                set((state) => ({
                    files: { ...state.files, [courseCode]: data },
                    filesPriorityLoading: { ...state.filesPriorityLoading, [courseCode]: false },
                    filesProgress: { ...state.filesProgress, [courseCode]: 'success' },
                    filesTotalCount: { ...state.filesTotalCount, [courseCode]: data.length }
                }));
                return;
            }

            // Wait for metadata and handshake
            let subjects = get().subjects;
            let syncStatus = get().syncStatus;

            if (!syncStatus.handshakeDone || !subjects) {
                set((state) => ({ filesProgress: { ...state.filesProgress, [courseCode]: 'waiting_metadata' } }));
                const { useAppStore } = await import('../useAppStore');
                await new Promise<void>((resolve) => {
                    const unsubscribe = useAppStore.subscribe((state) => {
                        if (state.syncStatus.handshakeDone && state.subjects) {
                            unsubscribe();
                            subjects = state.subjects;
                            syncStatus = state.syncStatus;
                            resolve();
                        }
                    });
                    setTimeout(() => { unsubscribe(); resolve(); }, 5000);
                });
            }

            const { fetchFilesFromFolder } = await import('../../api/documents/service');
            const subject = subjects?.data?.[courseCode];

            if (!subject?.folderUrl) {
                const isSyncActive = syncStatus.isSyncing || !syncStatus.handshakeDone;
                if (!isSyncActive) {
                    console.warn(`[FilesSlice] No folder URL found and sync finished for ${courseCode}, setting empty files`);
                    set((state) => ({
                        files: { ...state.files, [courseCode]: [] },
                        filesPriorityLoading: { ...state.filesPriorityLoading, [courseCode]: false },
                        filesProgress: { ...state.filesProgress, [courseCode]: 'success' }
                    }));
                } else {
                    set((state) => ({ filesProgress: { ...state.filesProgress, [courseCode]: 'waiting_sync' } }));
                }
                return;
            }

            const folderId = subject.folderUrl.match(/[?&;]id=(\d+)/)?.[1];
            if (!folderId) {
                console.warn(`[FilesSlice] Invalid folder URL for ${courseCode}: ${subject.folderUrl}`);
                set((state) => ({
                    files: { ...state.files, [courseCode]: [] },
                    filesPriorityLoading: { ...state.filesPriorityLoading, [courseCode]: false },
                    filesProgress: { ...state.filesProgress, [courseCode]: 'success' }
                }));
                return;
            }

            const folderUrl = `https://is.mendelu.cz/auth/dok_server/slozka.pl?id=${folderId}`;
            console.log(`[FilesSlice] Priority fetch URL for ${courseCode}: ${folderUrl}`);

            set((state) => ({
                filesProgress: { ...state.filesProgress, [courseCode]: 'fetching_first' }
            }));

            // Fetch with onChunk callback for progressive update
            const fullFilesList = await fetchFilesFromFolder(folderUrl, currentLang, true, 0, 2, (chunk) => {
                console.log(`[FilesSlice] Received first chunk for ${courseCode}: ${chunk.length} files`);
                set((state) => ({
                    files: { ...state.files, [courseCode]: chunk },
                    filesProgress: { ...state.filesProgress, [courseCode]: 'syncing_remaining' }
                }));
            });

            console.log(`[FilesSlice] Priority fetch complete for ${courseCode}. Total files: ${fullFilesList.length}`);
            
            // Store full data in IndexedDB
            const cachedFiles = await IndexedDBService.get('files', courseCode);
            const data = (cachedFiles || { cz: [], en: [] }) as { cz: ParsedFile[], en: ParsedFile[] };
            if (currentLang === 'en') data.en = fullFilesList; else data.cz = fullFilesList;
            await IndexedDBService.set('files', courseCode, data);
            console.log(`[FilesSlice] Persisted ${fullFilesList.length} files to IndexedDB for ${courseCode}`);

            set((state) => ({
                files: { ...state.files, [courseCode]: fullFilesList },
                filesPriorityLoading: { ...state.filesPriorityLoading, [courseCode]: false },
                filesProgress: { ...state.filesProgress, [courseCode]: 'success' },
                filesTotalCount: { ...state.filesTotalCount, [courseCode]: fullFilesList.length }
            }));
        } catch (error) {
            console.error(`[FilesSlice] Priority fetch failed for ${courseCode}:`, error);
            set((state) => ({
                files: { ...state.files, [courseCode]: [] },
                filesPriorityLoading: { ...state.filesPriorityLoading, [courseCode]: false },
                filesProgress: { ...state.filesProgress, [courseCode]: 'error' }
            }));
        }
    },
    refreshFiles: async (courseCode) => {
        const { language: currentLang } = get();
        
        set((state) => ({
            filesLoading: { ...state.filesLoading, [courseCode]: true }
        }));

        try {
            const data = await IndexedDBService.get('files', courseCode);
            let languageMatches = false;

            // Handle dual-language structure vs legacy array
            let filesList: ParsedFile[] = [];
            if (data && 'cz' in data && 'en' in data) {
                 // Dual language structure
                 filesList = currentLang === 'en' ? data.en : data.cz;
                 languageMatches = true; // Always matches since we have both
            } else if (Array.isArray(data)) {
                 // Legacy array structure
                 filesList = data;
                 languageMatches = data.length > 0 && data[0]?.language === currentLang;
            }
            
            if (!languageMatches && data) {
                // Language mismatch in legacy structure - fetch fresh data from API
                console.log(`[FilesSlice] Language mismatch for ${courseCode}...`);
                
                const { fetchFilesFromFolder } = await import('../../api/documents/service');
                const subjectsData = await IndexedDBService.get('subjects', 'current');
                const subject = subjectsData?.data?.[courseCode];
                
                if (subject?.folderUrl) {
                    const folderId = subject.folderUrl.match(/[?&;]id=(\d+)/)?.[1];
                    if (folderId) {
                        const folderUrl = `https://is.mendelu.cz/auth/dok_server/slozka.pl?id=${folderId}`;
                        try {
                            const [czFiles, enFiles] = await Promise.all([
                                fetchFilesFromFolder(folderUrl, 'cz'),
                                fetchFilesFromFolder(folderUrl, 'en')
                            ]);
                            const dualData = { cz: czFiles || [], en: enFiles || [] };
                            await IndexedDBService.set('files', courseCode, dualData);
                            filesList = currentLang === 'en' ? dualData.en : dualData.cz;
                        } catch (err) {
                            console.error(`[FilesSlice] Failed to re-fetch:`, err);
                        }
                    }
                }
            }
            
            set((state) => ({
                files: { ...state.files, [courseCode]: filesList },
                filesLoading: { ...state.filesLoading, [courseCode]: false }
            }));
        } catch (error) {
            console.error(`[FilesSlice] Fetch failed for ${courseCode}:`, error);
            set((state) => ({
                files: { ...state.files, [courseCode]: state.files[courseCode] ?? [] },
                filesLoading: { ...state.filesLoading, [courseCode]: false }
            }));
        }
    },
    fetchAllFiles: async () => {
        try {
            const currentLang = get().language;
            const allFiles = await IndexedDBService.getAllWithKeys('files');
            const filesMap: Record<string, ParsedFile[]> = {};

            allFiles.forEach(({ key, value }) => {
                if (value && 'cz' in value && 'en' in value) {
                    filesMap[key] = currentLang === 'en' ? value.en : value.cz;
                } else if (Array.isArray(value)) {
                    filesMap[key] = value;
                }
            });
            set({ files: filesMap });
        } catch (error) {
            console.error('[FilesSlice] Fetch all failed:', error);
        }
    },
});
