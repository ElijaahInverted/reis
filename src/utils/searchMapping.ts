import type { SearchResult } from '../types/search';
import { pagesData } from '../data/pagesData';
import { fuzzyIncludes } from './searchUtils';

/**
 * Filter and map pages categories to SearchResult objects.
 */
export function mapPageResults(searchQuery: string): SearchResult[] {
    const pageResults: SearchResult[] = [];
    pagesData.forEach((category) => {
        category.children.forEach((page) => {
            if (fuzzyIncludes(page.label, searchQuery)) {
                pageResults.push({
                    id: page.id,
                    title: page.label,
                    type: 'page',
                    detail: category.label,
                    link: page.href,
                    category: category.label
                });
            }
        });
    });
    return pageResults;
}

/**
 * Calculate relevance score for search results.
 */
export function calculateRelevance(result: SearchResult, searchQuery: string): number {
    const title = result.title.toLowerCase();
    const code = result.subjectCode?.toLowerCase() ?? '';
    let baseScore = 0;
    
    if (result.type === 'subject') baseScore = 1000;
    else if (result.type === 'page') baseScore = 500;
    else baseScore = 100;
    
    if (title === searchQuery) return baseScore + 100;
    if (title.startsWith(searchQuery)) return baseScore + 90;
    if (code === searchQuery) return baseScore + 85;
    if (code.startsWith(searchQuery)) return baseScore + 80;
    if (title.includes(` ${searchQuery}`)) return baseScore + 60;
    if (title.includes(searchQuery) || code.includes(searchQuery)) return baseScore + 40;
    return baseScore + 10;
}

/**
 * Sort person results by role priority.
 */
export function sortPeople(people: SearchResult[]): SearchResult[] {
    const getPriority = (type?: string) => {
        if (type === 'teacher') return 0;
        if (type === 'student') return 1;
        if (type === 'staff') return 2;
        return 3;
    };
    return [...people].sort((a, b) => getPriority(a.personType) - getPriority(b.personType));
}
