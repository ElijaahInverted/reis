import { useMemo } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { AppState } from '../../store/types';

export function useOsnovy(courseName?: string, courseCode?: string) {
    const globalTests = useAppStore((state: AppState) => state.osnovy);
    const status = useAppStore((state: AppState) => state.osnovyStatus);

    const tests = useMemo(() => {
        if (!globalTests || !courseName) return [];

        const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').replace(/-/g, ' ').trim();
        const matchName = normalize(courseName);

        return globalTests.filter(t => normalize(t.courseName) === matchName);
    }, [courseName, globalTests]);

    return { tests, status };
}
