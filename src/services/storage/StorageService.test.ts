/**
 * Tests for StorageService
 * 
 * Tests localStorage wrapper with type safety
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StorageService, STORAGE_KEYS } from './index';

describe('StorageService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset mock implementation
        vi.mocked(localStorage.getItem).mockReturnValue(null);
    });

    describe('get', () => {
        it('should return null for non-existent key', () => {
            vi.mocked(localStorage.getItem).mockReturnValue(null);

            const result = StorageService.get('nonexistent');
            expect(result).toBeNull();
        });

        it('should parse and return stored JSON data', () => {
            const testData = { foo: 'bar', count: 42 };
            vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(testData));

            const result = StorageService.get<typeof testData>('test_key');
            expect(result).toEqual(testData);
        });

        it('should return null for invalid JSON', () => {
            vi.mocked(localStorage.getItem).mockReturnValue('not valid json {');

            const result = StorageService.get('bad_json');
            expect(result).toBeNull();
        });
    });

    describe('set', () => {
        it('should store JSON-serialized data', () => {
            const testData = { subjects: ['math', 'physics'] };

            StorageService.set('my_key', testData);

            expect(localStorage.setItem).toHaveBeenCalledWith('my_key', JSON.stringify(testData));
        });
    });

    describe('remove', () => {
        it('should call removeItem on storage', () => {
            StorageService.remove('to_remove');

            expect(localStorage.removeItem).toHaveBeenCalledWith('to_remove');
        });
    });

    describe('STORAGE_KEYS', () => {
        it('should have all required keys defined', () => {
            expect(STORAGE_KEYS.SUBJECTS_DATA).toBeDefined();
            expect(STORAGE_KEYS.EXAMS_DATA).toBeDefined();
            expect(STORAGE_KEYS.SCHEDULE_DATA).toBeDefined();
            expect(STORAGE_KEYS.LAST_SYNC).toBeDefined();
        });
    });
});
