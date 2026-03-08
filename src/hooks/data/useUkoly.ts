import { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { AppState } from '../../store/types';

export function useUkoly(courseName?: string, courseCode?: string) {
    const globalAssignments = useAppStore((state: AppState) => state.ukoly);
    const status = useAppStore((state: AppState) => state.ukolyStatus);

    const assignments = useMemo(() => {
        if (!globalAssignments) return [];

        const matchCode = courseCode?.toLowerCase().trim();
        if (matchCode) {
            return globalAssignments.filter(a => a.courseCode?.toLowerCase().trim() === matchCode);
        }

        if (!courseName) return [];
        const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').replace(/-/g, ' ').trim();
        const matchName = normalize(courseName);
        return globalAssignments.filter(a => normalize(a.courseName) === matchName);
    }, [courseName, courseCode, globalAssignments]);

    const activeAssignments = useMemo(() => assignments.filter(a => a.isActive), [assignments]);
    const closedAssignments = useMemo(() => assignments.filter(a => !a.isActive), [assignments]);

    return {
        assignments,
        activeAssignments,
        closedAssignments,
        status
    };
}
