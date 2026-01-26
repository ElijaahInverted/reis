import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createStudyProgramSlice } from '../createStudyProgramSlice';
import { IndexedDBService } from '../../../services/storage';

// Mock IndexedDB
vi.mock('../../../services/storage', () => ({
    IndexedDBService: {
        get: vi.fn(),
        set: vi.fn()
    }
}));

describe('createStudyProgramSlice', () => {
    let set: any;
    let get: any;
    let slice: any;

    beforeEach(() => {
        vi.clearAllMocks();
        set = vi.fn((fn) => {
            const result = typeof fn === 'function' ? fn({ studyProgram: null, studyProgramLoading: false }) : fn;
            Object.assign(slice, result);
        });
        get = vi.fn(() => slice);
        slice = createStudyProgramSlice(set, get, {} as any);
    });

    it('should initialize with default state', () => {
        expect(slice.studyProgram).toBeNull();
        expect(slice.studyProgramLoading).toBe(false);
    });

    it('should fetch from IndexedDB', async () => {
        const mockData = { finalTable: [] };
        vi.mocked(IndexedDBService.get).mockResolvedValue(mockData);

        await slice.fetchStudyProgram();

        expect(IndexedDBService.get).toHaveBeenCalledWith('study_program', 'current');
        expect(slice.studyProgram).toEqual(mockData);
        expect(slice.studyProgramLoading).toBe(false);
    });

    it('should handle fetch errors', async () => {
        vi.mocked(IndexedDBService.get).mockRejectedValue(new Error('DB Error'));

        await slice.fetchStudyProgram();

        expect(slice.studyProgramLoading).toBe(false);
        // data should remain null or previous state
        expect(slice.studyProgram).toBeNull();
    });
});
