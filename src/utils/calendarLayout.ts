import type { BlockLesson, LessonWithRow, OrganizedLessons } from '../types/calendarTypes';

const TOTAL_HOURS = 13; // 7:00 to 20:00 (13 hour slots)

/**
 * Convert time string to percentage from top (7:00 = 0%, 20:00 = 100%)
 */
export function timeToPercent(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    const hoursFrom7 = hours - 7;
    const totalMinutesFrom7 = hoursFrom7 * 60 + minutes;
    const totalMinutesInDay = TOTAL_HOURS * 60; // 13 hours * 60 minutes
    return (totalMinutesFrom7 / totalMinutesInDay) * 100;
}

/**
 * Calculate position style for an event using percentages
 */
export function getEventStyle(startTime: string, endTime: string): { top: string; height: string } {
    const topPercent = timeToPercent(startTime);
    const bottomPercent = timeToPercent(endTime);
    const heightPercent = bottomPercent - topPercent;
    return {
        top: `${topPercent}%`,
        height: `${heightPercent}%`,
    };
}

/**
 * Convert time string to minutes
 */
export function timeToMinutesLocal(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * Organize lessons into rows to prevent overlap
 */
export function organizeLessons(lessons: BlockLesson[]): OrganizedLessons {
    if (!lessons || lessons.length === 0) return { lessons: [], totalRows: 1 };

    const sortedLessons = [...lessons].sort((a, b) =>
        timeToMinutesLocal(a.startTime) - timeToMinutesLocal(b.startTime)
    );

    const rows: number[] = [];
    const lessonsWithRows: LessonWithRow[] = [];

    sortedLessons.forEach(lesson => {
        const start = timeToMinutesLocal(lesson.startTime);
        const end = timeToMinutesLocal(lesson.endTime);
        let placed = false;

        for (let i = 0; i < rows.length; i++) {
            if (rows[i] <= start) {
                rows[i] = end;
                lessonsWithRows.push({ ...lesson, row: i });
                placed = true;
                break;
            }
        }

        if (!placed) {
            rows.push(end);
            lessonsWithRows.push({ ...lesson, row: rows.length - 1 });
        }
    });

    return { lessons: lessonsWithRows, totalRows: rows.length };
}
