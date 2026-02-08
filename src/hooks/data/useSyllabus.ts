/**
 * useSyllabus - Hook to access syllabus data from store cache.
 * 
 * Returns data from Zustand global store.
 * Triggers fetch if missing.
 */

import { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useTranslation } from '../useTranslation';
import type { SyllabusRequirements } from '../../types/documents';

export interface UseSyllabusResult {
    syllabus: SyllabusRequirements | null;
    isLoading: boolean;
}

export function useSyllabus(courseCode: string | undefined, courseId?: string, subjectName?: string): UseSyllabusResult {
    const { language } = useTranslation();
    const syllabus = useAppStore(state => (courseCode ? state.syllabuses.cache[courseCode] : null));
    const isLoading = useAppStore(state => (courseCode ? !!state.syllabuses.loading[courseCode] : false));
    const fetchSyllabus = useAppStore(state => state.fetchSyllabus);

    useEffect(() => {
        // Fetch if missing OR if cached language differs from current language
        const shouldFetch = courseCode && !isLoading && (!syllabus || syllabus.language !== language);
        if (shouldFetch) {
            void fetchSyllabus(courseCode, courseId, subjectName);
        }
    }, [courseCode, courseId, subjectName, syllabus, isLoading, fetchSyllabus, language]);

    return { syllabus: syllabus || null, isLoading };
}
