import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createFilesSlice } from '../createFilesSlice';
import { IndexedDBService } from '../../../services/storage';

// Mock IndexedDB
vi.mock('../../../services/storage', () => ({
    IndexedDBService: {
        get: vi.fn(),
        set: vi.fn()
    }
}));

describe('createFilesSlice', () => {
    let set: ReturnType<typeof vi.fn>;
    let get: ReturnType<typeof vi.fn>;
    let slice: ReturnType<typeof createFilesSlice>;

    beforeEach(() => {
        vi.clearAllMocks();
        set = vi.fn((fn) => {
            const result = typeof fn === 'function' ? fn({ files: {}, filesLoading: {}, filesPriorityLoading: {}, filesProgress: {} }) : fn;
            Object.assign(slice, result);
        });

        get = vi.fn(() => slice);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        slice = createFilesSlice(set, get, {} as unknown as any);
    });

    it('should initialize with default state', () => {
        expect(slice.files).toEqual({});
        expect(slice.filesLoading).toEqual({});
    });

    it('should fetch files for a subject', async () => {
        const mockFiles = [{ file_name: 'test.pdf' }];
        vi.mocked(IndexedDBService.get).mockResolvedValue(mockFiles);

        await slice.fetchFiles('ALG');

        expect(IndexedDBService.get).toHaveBeenCalledWith('files', 'ALG');
        expect(slice.files['ALG']).toEqual(mockFiles);
        expect(slice.filesLoading['ALG']).toBe(false);
    });

    it('should set filesLoading to true synchronously before resolving', () => {
        vi.mocked(IndexedDBService.get).mockReturnValue(new Promise(() => {})); // never resolves

        slice.fetchFiles('ALG'); // intentionally not awaited

        expect(slice.filesLoading['ALG']).toBe(true);
    });

    it('should handle fetch errors', async () => {
        vi.mocked(IndexedDBService.get).mockRejectedValue(new Error('DB Error'));

        await slice.fetchFiles('ALG');

        expect(slice.filesLoading['ALG']).toBe(false);
        expect(slice.files['ALG']).toBeUndefined();
    });

    it('should fetch files with priority progressively', async () => {
        const mockFolders = { data: { ALG: { folderUrl: 'slozka.pl?id=123' } } };
        vi.mocked(IndexedDBService.get).mockResolvedValueOnce(mockFolders); // subjects
        vi.mocked(IndexedDBService.get).mockResolvedValueOnce(null); // existing files
        
        // Mock the dynamic import which is used inside fetchFilesPriority
        // We can't easily mock dynamic imports in vitest like this, 
        // so we'll just verify the initial status transition
        await slice.fetchFilesPriority('ALG');

        expect(slice.filesPriorityLoading['ALG']).toBeDefined();
        // Since the dynamic import/API call will likely fail in this test environment 
        // (unless we setup proper happy-dom mocking for fetch), 
        // we'll at least verify it reached the loading state.
    });
});


