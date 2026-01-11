/**
 * Command Palette Hook
 * 
 * Manages the state and keyboard shortcuts for the command palette.
 * Integrates with the search API to find subjects, people, and pages.
 * Prioritizes results matching the user's faculty.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { searchGlobal } from '../api/search';
import { pagesData } from '../data/pagesData';
import { injectUserParams } from '../utils/urlHelpers';
import { fuzzyIncludes } from '../utils/searchUtils';
import { getFacultySync } from '../utils/userParams';
import { FACULTY_ID_TO_CODE, getRelevanceScore } from '../utils/commandPaletteUtils';
import type { CommandItem } from '../types/commands';

interface UseCommandPaletteReturn {
    isOpen: boolean;
    open: () => void;
    close: () => void;
    toggle: () => void;
    query: string;
    setQuery: (query: string) => void;
    results: CommandItem[];
    selectedIndex: number;
    setSelectedIndex: (index: number) => void;
    executeSelected: () => void;
    isLoading: boolean;
}

export function useCommandPalette(staticItems: CommandItem[]): UseCommandPaletteReturn {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [searchResults, setSearchResults] = useState<CommandItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Debounced search - mirrors useSearch behavior with faculty awareness
    useEffect(() => {
        if (query.trim().length < 2) {
            setSearchResults([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(async () => {
            try {
                const searchQuery = query.toLowerCase();
                const { people, subjects } = await searchGlobal(query);
                
                const userFacultyId = getFacultySync();
                const userFacultyCode = userFacultyId ? FACULTY_ID_TO_CODE[userFacultyId] : null;

                // Subject results
                const subjectItems: CommandItem[] = subjects.map((s) => ({
                    id: `subject-${s.id}`,
                    type: 'subject' as const,
                    title: s.name,
                    subtitle: [s.code, s.semester, s.faculty !== 'N/A' ? s.faculty : null].filter(Boolean).join(' · '),
                    link: s.link,
                    subjectCode: s.code,
                    faculty: s.faculty,
                    action: () => {
                        if (s.link) {
                            window.open(injectUserParams(s.link), '_blank');
                        }
                    }
                }));

                // Person results
                const personItems: CommandItem[] = people.map((p, index) => ({
                    id: p.id || `person-${index}`,
                    type: 'person' as const,
                    title: p.name,
                    subtitle: [
                        p.type === 'student' ? 'Student' : p.type === 'teacher' ? 'Vyučující' : 'Zaměstnanec',
                        p.faculty !== 'N/A' ? p.faculty : null
                    ].filter(Boolean).join(' · '),
                    link: p.link,
                    faculty: p.faculty,
                    action: () => {
                        if (p.link) {
                            window.open(injectUserParams(p.link), '_blank');
                        }
                    }
                }));

                // Page results from pagesData
                const pageItems: CommandItem[] = [];
                pagesData.forEach((category) => {
                    category.children.forEach((page) => {
                        if (fuzzyIncludes(page.label, searchQuery)) {
                            pageItems.push({
                                id: page.id,
                                type: 'page' as const,
                                title: page.label,
                                subtitle: category.label,
                                link: page.href,
                                action: () => {
                                    if (page.href) {
                                        window.open(injectUserParams(page.href), '_blank');
                                    }
                                }
                            });
                        }
                    });
                });

                // Relevance scoring with faculty boost helper is now imported from commandPaletteUtils

                // Sort all results by relevance
                const allResults = [...subjectItems, ...pageItems, ...personItems];
                allResults.sort((a, b) => {
                    const searchQuery = query.toLowerCase();
                    const scoreA = getRelevanceScore(a, searchQuery, userFacultyCode);
                    const scoreB = getRelevanceScore(b, searchQuery, userFacultyCode);
                    if (scoreB !== scoreA) return scoreB - scoreA;
                    return a.title.localeCompare(b.title);
                });

                setSearchResults(allResults);
            } catch (error) {
                console.error('[CommandPalette] Search failed:', error);
                setSearchResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => {
            if (debounceTimeout.current) {
                clearTimeout(debounceTimeout.current);
            }
        };
    }, [query]);

    // Filter static items + add search results
    const filteredStaticItems = query.trim()
        ? staticItems.filter(item =>
              item.title.toLowerCase().includes(query.toLowerCase()) ||
              (item.subtitle?.toLowerCase().includes(query.toLowerCase()) ?? false)
          )
        : staticItems;

    // Merge: search results first, then matching static items
    const results = useMemo(() => 
        query.trim().length >= 2 ? [...searchResults, ...filteredStaticItems] : [],
    [query, searchResults, filteredStaticItems]);

    // Reset selection when results change
    useEffect(() => {
        setSelectedIndex(0);
    }, [results.length]);

    // Global keyboard shortcut: Ctrl+K / Cmd+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Open palette
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }

            // Close palette on Escape
            if (e.key === 'Escape' && isOpen) {
                e.preventDefault();
                setIsOpen(false);
                setQuery('');
            }

            // Navigate results
            if (isOpen) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedIndex(prev => Math.max(prev - 1, 0));
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (results[selectedIndex]) {
                        results[selectedIndex].action();
                        setIsOpen(false);
                        setQuery('');
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, results, selectedIndex]);

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => {
        setIsOpen(false);
        setQuery('');
        setSearchResults([]);
    }, []);
    const toggle = useCallback(() => setIsOpen(prev => !prev), []);

    const executeSelected = useCallback(() => {
        if (results[selectedIndex]) {
            results[selectedIndex].action();
            close();
        }
    }, [results, selectedIndex, close]);

    return {
        isOpen,
        open,
        close,
        toggle,
        query,
        setQuery,
        results,
        selectedIndex,
        setSelectedIndex,
        executeSelected,
        isLoading,
    };
}
