import { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { Classmate } from '../../types/classmates';

export interface UseClassmatesResult {
    classmates: Classmate[];
    isLoading: boolean;
}

/**
 * useClassmates - Returns seminar (Cvičení) classmates for a course.
 *
 * Triggers fetchClassmates on mount (deduped in the slice).
 * skupinaId is forwarded to the fetch so the API can filter by seminar group.
 */
export function useClassmates(courseCode: string | undefined, skupinaId?: string): UseClassmatesResult {
    const classmates = useAppStore(state => courseCode ? state.classmates[courseCode] : undefined);
    const isLoading = useAppStore(state => courseCode ? !!state.classmatesLoading[courseCode] : false);

    useEffect(() => {
        if (courseCode) {
            useAppStore.getState().fetchClassmates(courseCode, skupinaId);
        }
    }, [courseCode, skupinaId]);

    return {
        classmates: classmates ?? [],
        isLoading: isLoading || classmates === undefined,
    };
}
