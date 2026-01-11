import { useMemo } from 'react';
import { useSchedule, useExams } from '../data';
import { getCzechHoliday } from '../../utils/holidays';
import type { BlockLesson, DateInfo } from '../../types/calendarTypes';
import { mapExamsToLessons } from '../../utils/calendarMapping';

const DAYS_META = [
    { index: 0, short: 'Po', full: 'Pondělí' },
    { index: 1, short: 'Út', full: 'Úterý' },
    { index: 2, short: 'St', full: 'Středa' },
    { index: 3, short: 'Čt', full: 'Čtvrtek' },
    { index: 4, short: 'Pá', full: 'Pátek' },
];

export function useCalendarLogic(initialDate: Date) {
    const { schedule: storedSchedule, isLoaded: isScheduleLoaded } = useSchedule();
    const { exams: storedExams } = useExams();

    // Calculate week dates (Mon-Fri)
    const weekDates = useMemo((): DateInfo[] => {
        const startOfWeek = new Date(initialDate);
        const day = startOfWeek.getDay() || 7;
        if (day !== 1) startOfWeek.setHours(-24 * (day - 1));
        startOfWeek.setHours(0, 0, 0, 0);

        const dates: DateInfo[] = [];
        for (let i = 0; i < 5; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            dates.push({
                weekday: DAYS_META[i].short,
                day: String(d.getDate()),
                month: String(d.getMonth() + 1),
                year: String(d.getFullYear()),
                full: d.toLocaleDateString('cs-CZ')
            });
        }
        return dates;
    }, [initialDate]);

    // Get week date strings (YYYYMMDD format)
    const weekDateStrings = useMemo(() => {
        return weekDates.map(d =>
            `${d.year}${d.month.padStart(2, '0')}${d.day.padStart(2, '0')}`
        );
    }, [weekDates]);

    // Process exams into BlockLesson format
    const examLessons = useMemo(() => mapExamsToLessons(storedExams || []), [storedExams]);

    // Filter schedule for this week + add exams
    const scheduleData = useMemo((): BlockLesson[] => {
        const lessons = (storedSchedule || []).filter(lesson => weekDateStrings.includes(lesson.date));
        const weekExams = examLessons.filter(exam => weekDateStrings.includes(exam.date));
        return [...lessons, ...weekExams];
    }, [storedSchedule, examLessons, weekDateStrings]);

    // Group lessons by day index (0-4 for Mon-Fri)
    const lessonsByDay = useMemo(() => {
        const grouped: Record<number, BlockLesson[]> = { 0: [], 1: [], 2: [], 3: [], 4: [] };

        scheduleData.forEach(lesson => {
            const year = parseInt(lesson.date.substring(0, 4));
            const month = parseInt(lesson.date.substring(4, 6)) - 1;
            const day = parseInt(lesson.date.substring(6, 8));
            const date = new Date(year, month, day);
            const dayOfWeek = date.getDay();

            // Convert to 0-indexed (Mon=0, Tue=1, ...)
            const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            if (dayIndex >= 0 && dayIndex < 5) {
                grouped[dayIndex].push(lesson);
            }
        });

        return grouped;
    }, [scheduleData]);

    // Check for holidays on each day
    const holidaysByDay = useMemo(() => {
        const holidays: Record<number, string | null> = {};
        weekDates.forEach((dateInfo, index) => {
            const checkDate = new Date(
                parseInt(dateInfo.year),
                parseInt(dateInfo.month) - 1,
                parseInt(dateInfo.day)
            );
            holidays[index] = getCzechHoliday(checkDate);
        });
        return holidays;
    }, [weekDates]);

    // Check if today is in this week
    const todayIndex = useMemo(() => {
        const today = new Date();
        for (let i = 0; i < weekDates.length; i++) {
            const d = weekDates[i];
            if (
                parseInt(d.day) === today.getDate() &&
                parseInt(d.month) === today.getMonth() + 1 &&
                parseInt(d.year) === today.getFullYear()
            ) {
                return i;
            }
        }
        return -1;
    }, [weekDates]);

    const showSkeleton = scheduleData.length === 0 && !isScheduleLoaded;

    return {
        weekDates,
        lessonsByDay,
        holidaysByDay,
        todayIndex,
        showSkeleton
    };
}
