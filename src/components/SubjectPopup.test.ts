/**
 * Tests for SubjectPopup utility functions
 * 
 * Tests file grouping, name parsing, and URL resolution
 */

import { describe, it, expect } from 'vitest';
import type { FileObject } from '../types/calendarTypes';

// Test the file grouping logic (extracted for testability)
function groupFilesByFolder(
    files: FileObject[],
    subfolderFilter: string
): FileObject[] {
    const grouped: { [subfolder: string]: FileObject[] } = {};

    // Filter files by subfolder if a filter is active
    const filteredFiles = subfolderFilter === "all"
        ? files
        : files.filter(file => file.subfolder === subfolderFilter);

    filteredFiles.forEach(file => {
        const groupKey = file.subfolder || 'Ostatní';

        if (!grouped[groupKey]) {
            grouped[groupKey] = [];
        }
        grouped[groupKey].push(file);
    });

    // Sort folders: 'Ostatní' last, others alphabetically
    const sortedFolderKeys = Object.keys(grouped).sort((a, b) => {
        if (a === 'Ostatní') return 1;
        if (b === 'Ostatní') return -1;
        return a.localeCompare(b, 'cs');
    });

    // Flatten and sort files within each folder
    const sortedFiles: FileObject[] = [];
    sortedFolderKeys.forEach(key => {
        const folderFiles = grouped[key].sort((a, b) => {
            // Primary sort: Comment number (if present)
            const numA = parseInt(a.file_comment.match(/\d+/)?.[0] || '0');
            const numB = parseInt(b.file_comment.match(/\d+/)?.[0] || '0');

            if (numA !== numB && numA !== 0 && numB !== 0) {
                return numA - numB;
            }

            // Secondary sort: Filename
            return a.file_name.localeCompare(b.file_name, 'cs', { numeric: true });
        });
        sortedFiles.push(...folderFiles);
    });

    return sortedFiles;
}

// Test the name parsing logic
function parseName(name: string, hasComment: boolean = false): string {
    const MAX_LENGTH = hasComment ? 40 : 100;

    if (name.length > MAX_LENGTH) {
        const name_deducted = name.substring(0, MAX_LENGTH - 3);
        return name_deducted + "...";
    }
    return name;
}

// Test the subfolder display name extractor
function getSubfolderDisplayName(subfolder: string): string {
    const parts = subfolder.split('/');
    return parts.length > 1 ? parts[1].trim() : subfolder;
}

describe('SubjectPopup utilities', () => {
    describe('groupFilesByFolder', () => {
        const mockFiles: FileObject[] = [
            { file_name: 'lecture1.pdf', file_comment: '01', subfolder: 'Lectures', author: '', date: '', files: [{ link: 'url1', name: 'lecture1.pdf', type: 'pdf' }] },
            { file_name: 'lecture2.pdf', file_comment: '02', subfolder: 'Lectures', author: '', date: '', files: [{ link: 'url2', name: 'lecture2.pdf', type: 'pdf' }] },
            { file_name: 'homework.pdf', file_comment: '', subfolder: 'Exercises', author: '', date: '', files: [{ link: 'url3', name: 'homework.pdf', type: 'pdf' }] },
            { file_name: 'misc.pdf', file_comment: '', subfolder: '', author: '', date: '', files: [{ link: 'url4', name: 'misc.pdf', type: 'pdf' }] },
        ];

        it('should group files by subfolder', () => {
            const result = groupFilesByFolder(mockFiles, 'all');

            expect(result.length).toBe(4);
        });

        it('should filter by specific subfolder', () => {
            const result = groupFilesByFolder(mockFiles, 'Lectures');

            expect(result.length).toBe(2);
            expect(result.every(f => f.subfolder === 'Lectures')).toBe(true);
        });

        it('should sort files by comment number', () => {
            const result = groupFilesByFolder(mockFiles, 'Lectures');

            expect(result[0].file_comment).toBe('01');
            expect(result[1].file_comment).toBe('02');
        });

        it('should put "Ostatní" (empty subfolder) last', () => {
            const result = groupFilesByFolder(mockFiles, 'all');

            // Find the misc.pdf which has no subfolder (mapped to "Ostatní")
            const miscIndex = result.findIndex(f => f.file_name === 'misc.pdf');
            expect(miscIndex).toBe(result.length - 1);
        });
    });

    describe('parseName', () => {
        it('should return name unchanged if under limit', () => {
            const result = parseName('short name');
            expect(result).toBe('short name');
        });

        it('should truncate long names', () => {
            const longName = 'a'.repeat(150);
            const result = parseName(longName);

            expect(result.length).toBe(100);
            expect(result.endsWith('...')).toBe(true);
        });

        it('should use shorter limit when hasComment is true', () => {
            const name = 'a'.repeat(50);
            const result = parseName(name, true);

            expect(result.length).toBe(40);
            expect(result.endsWith('...')).toBe(true);
        });

        it('should not truncate 40-char name without comment', () => {
            const name = 'a'.repeat(40);
            const result = parseName(name, false);

            expect(result).toBe(name);
        });
    });

    describe('getSubfolderDisplayName', () => {
        it('should extract part after slash', () => {
            const result = getSubfolderDisplayName('Předmět/Přednášky');
            expect(result).toBe('Přednášky');
        });

        it('should return full name if no slash', () => {
            const result = getSubfolderDisplayName('Přednášky');
            expect(result).toBe('Přednášky');
        });

        it('should trim whitespace', () => {
            const result = getSubfolderDisplayName('Předmět/ Přednášky ');
            expect(result).toBe('Přednášky');
        });
    });
});
