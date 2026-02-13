import type { BlockLesson, LessonWithRow, OrganizedLessons } from '../../types/calendarTypes';

const TOTAL_HOURS = 13; // 7:00 to 20:00

export const DAYS = [
    { index: 0, short: 'Po', full: 'Pondělí' },
    { index: 1, short: 'Út', full: 'Úterý' },
    { index: 2, short: 'St', full: 'Středa' },
    { index: 3, short: 'Čt', full: 'Čtvrtek' },
    { index: 4, short: 'Pá', full: 'Pátek' },
];

export const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

export function timeToPercent(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    const hoursFrom7 = hours - 7;
    const totalMinutesFrom7 = hoursFrom7 * 60 + minutes;
    const totalMinutesInDay = TOTAL_HOURS * 60;
    return (totalMinutesFrom7 / totalMinutesInDay) * 100;
}

export function getEventStyle(startTime: string, endTime: string): { top: string; height: string } {
    const topPercent = timeToPercent(startTime);
    const bottomPercent = timeToPercent(endTime);
    return {
        top: `${topPercent}%`,
        height: `${bottomPercent - topPercent}%`,
    };
}

function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

export function organizeLessons(lessons: BlockLesson[]): OrganizedLessons {
    if (!lessons || lessons.length === 0) return { lessons: [], totalRows: 1 };

    // Filter out invalid lessons and sort
    const sortedLessons = [...lessons]
        .filter(l => l.startTime && l.endTime)
        .sort((a, b) => {
            const startA = timeToMinutes(a.startTime);
            const startB = timeToMinutes(b.startTime);
            if (startA !== startB) return startA - startB;
            return timeToMinutes(a.endTime) - timeToMinutes(b.endTime);
        });

    if (sortedLessons.length === 0) return { lessons: [], totalRows: 1 };

    const clusters: LessonWithRow[][] = [];
    let currentCluster: LessonWithRow[] = [];
    let maxEndInCluster = 0;
    let rows: number[] = [];

    sortedLessons.forEach(lesson => {
        const start = timeToMinutes(lesson.startTime);
        const end = timeToMinutes(lesson.endTime);
        
        // Skip invalid times
        if (isNaN(start) || isNaN(end)) return;

        // If this lesson starts after all previous lessons in the cluster have ended,
        // it starts a new cluster.
        if (start >= maxEndInCluster && currentCluster.length > 0) {
            clusters.push(currentCluster);
            currentCluster = [];
            maxEndInCluster = 0;
            rows = [];
        }

        let placed = false;
        // Try to place in an existing row
        for (let i = 0; i < rows.length; i++) {
            if (rows[i] <= start) {
                rows[i] = end;
                const lessonWithRow = { ...lesson, row: i, maxColumns: 0 };
                currentCluster.push(lessonWithRow);
                placed = true;
                break;
            }
        }

        // Create a new row if not placed
        if (!placed) {
            rows.push(end);
            const lessonWithRow = { ...lesson, row: rows.length - 1, maxColumns: 0 };
            currentCluster.push(lessonWithRow);
        }

        maxEndInCluster = Math.max(maxEndInCluster, end);
    });

    if (currentCluster.length > 0) {
        clusters.push(currentCluster);
    }

    let globalMaxRows = 1;
    clusters.forEach(cluster => {
        const maxLanes = Math.max(...cluster.map(l => l.row + 1));
        cluster.forEach(l => {
            l.maxColumns = maxLanes;
        });
        globalMaxRows = Math.max(globalMaxRows, maxLanes);
    });

    // Debug log to help identify why clusters might be merging
    console.debug('[WeeklyCalendar] Organized lessons:', {
        clusterCount: clusters.length,
        totalLessons: sortedLessons.length,
        globalMaxRows,
        clusters: clusters.map(c => ({
            count: c.length,
            maxColumns: c[0].maxColumns,
            lessons: c.map(l => `${l.startTime}-${l.endTime} (${l.courseName})`)
        }))
    });

    return { 
        lessons: clusters.flat(), 
        totalRows: globalMaxRows 
    };
}
