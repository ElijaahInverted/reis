import { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';

export function useClassmates(courseCode: string | undefined, filter: 'all' | 'seminar' = 'seminar') {
    const classmatesData = useAppStore(state => courseCode ? state.classmates[courseCode] : undefined);
    const isLoading = useAppStore(state => courseCode ? state.classmatesLoading[courseCode] : false);
    const fetchClassmates = useAppStore(state => state.fetchClassmates);

    useEffect(() => {
        if (courseCode && classmatesData === undefined) {
            fetchClassmates(courseCode);
        }
    }, [courseCode, classmatesData, fetchClassmates]);

    return {
        classmates: classmatesData?.[filter] || [],
        isLoading: isLoading
    };
}
