import type { CommandItem } from '../types/commands';

export const FACULTY_ID_TO_CODE: Record<string, string> = {
    '2': 'PEF',
    '14': 'AF',
    '23': 'FRRMS',
    '38': 'LDF',
    '60': 'ZF',
    '220': 'ICV',
    '631': 'CSA',
    '79': 'REKT'
};

/**
 * Calculate relevance score for a command item.
 */
export function getRelevanceScore(item: CommandItem, searchQuery: string, userFacultyCode: string | null): number {
    const title = item.title.toLowerCase();
    const code = item.subjectCode?.toLowerCase() ?? '';
    let baseScore = 0;
    
    if (item.type === 'subject') baseScore = 1000;
    else if (item.type === 'page') baseScore = 500;
    else baseScore = 100;

    // Faculty boost (very high priority if matches user's faculty)
    if (userFacultyCode && item.faculty === userFacultyCode) {
        baseScore += 2000;
    }
    
    if (title === searchQuery) return baseScore + 100;
    if (title.startsWith(searchQuery)) return baseScore + 90;
    if (code === searchQuery) return baseScore + 85;
    if (code.startsWith(searchQuery)) return baseScore + 80;
    if (title.includes(` ${searchQuery}`)) return baseScore + 60;
    if (title.includes(searchQuery) || code.includes(searchQuery)) return baseScore + 40;
    return baseScore + 10;
}
