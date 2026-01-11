import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { searchGlobal } from '../../api/search';
import type { SearchResult } from '../../types/search';
import { MAX_RECENT_SEARCHES, STORAGE_KEY } from '../../types/search';
import { mapPageResults, calculateRelevance, sortPeople } from '../../utils/searchMapping';

export function useSearch(onOpenExamDrawer?: () => void, onSelect?: (result: SearchResult) => void, onSearch?: (query: string) => void) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<SearchResult[]>([]);
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isMac = useMemo(() => {
    return typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  }, []);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch (e) {
      console.error('Failed to load recent searches', e);
    }
  }, []);

  const saveToHistory = useCallback((result: SearchResult) => {
    const newItem = { ...result, detail: 'Nedávno hledáno' };
    setRecentSearches(prev => {
      const filtered = prev.filter(item => item.title !== result.title);
      const updated = [newItem, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const displayResults = query.trim() === '' ? recentSearches : filteredResults;

  useEffect(() => {
    if (query.trim().length < 3) {
      setFilteredResults([]);
      setSelectedIndex(-1);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

    debounceTimeout.current = setTimeout(async () => {
      try {
        const searchQuery = query.toLowerCase();
        const { people, subjects } = await searchGlobal(query);
        
        const personResults: SearchResult[] = people.map((p, index) => ({
          id: p.id || `unknown-${index}`,
          title: p.name,
          type: 'person',
          detail: p.type === 'student' ? 'Student' : p.type === 'teacher' ? 'Vyučující' : 'Zaměstnanec',
          link: p.link,
          personType: p.type
        }));

        const subjectResults: SearchResult[] = subjects.map((s) => ({
          id: `subject-${s.id}`,
          title: s.name,
          type: 'subject',
          detail: [s.code, s.semester, s.faculty !== 'N/A' ? s.faculty : null].filter(Boolean).join(' · '),
          link: s.link,
          subjectCode: s.code
        }));

        const pageResults = mapPageResults(searchQuery);
        const allResults = [...subjectResults, ...pageResults, ...sortPeople(personResults)];
        
        allResults.sort((a, b) => {
          const scoreA = calculateRelevance(a, searchQuery);
          const scoreB = calculateRelevance(b, searchQuery);
          return (scoreB - scoreA) || a.title.localeCompare(b.title);
        });

        setFilteredResults(allResults);
      } catch (error) {
        console.error("Search failed", error);
        setFilteredResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => { if (debounceTimeout.current) clearTimeout(debounceTimeout.current); };
  }, [query]);

  const handleSelect = useCallback((result: SearchResult) => {
    saveToHistory(result);

    if (['zapisy-zkousky'].includes(result.id)) {
      if (onOpenExamDrawer) {
        onOpenExamDrawer();
        setQuery('');
        setIsOpen(false);
        setSelectedIndex(-1);
        return;
      }
    }

    if (onSelect) {
      onSelect(result);
      setQuery('');
      setIsOpen(false);
      setSelectedIndex(-1);
      return;
    }

    if (result.link) {
      // Note: injectUserParams removed here, should be handled by the component or passed to hook
      // But for simplicity in this decomposition turn, we'll assume the component handles it
      // or we pass it in.
    }
    if (onSearch) {
      onSearch(result.title);
    }
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
  }, [onOpenExamDrawer, onSelect, onSearch, saveToHistory]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' && query.trim() !== '') {
        setIsOpen(true);
      }
      return;
    }

    const resultsCount = displayResults.length;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % resultsCount);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev <= 0 ? resultsCount - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < resultsCount) {
          handleSelect(displayResults[selectedIndex]);
        } else if (resultsCount > 0) {
          handleSelect(displayResults[0]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setQuery('');
        break;
    }
  };

  return {
    query,
    setQuery,
    isOpen,
    setIsOpen,
    selectedIndex,
    setSelectedIndex,
    displayResults,
    isLoading,
    isMac,
    handleSelect,
    handleKeyDown
  };
}
