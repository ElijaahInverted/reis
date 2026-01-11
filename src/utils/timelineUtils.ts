/**
 * Utility functions for Exam Timeline calculations and formatting.
 */

/**
 * Parse DD.MM.YYYY date string to Date object.
 */
export function parseTimelineDate(dateStr: string): Date {
    const [day, month, year] = dateStr.split('.').map(Number);
    return new Date(year, month - 1, day);
}

/**
 * Calculate days between two dates.
 */
export function daysBetween(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format date for display (e.g., "18.12.")
 */
export function formatShortDate(dateStr: string): string {
    const [day, month] = dateStr.split('.');
    return `${day}.${month}.`;
}

/**
 * Get exam urgency color based on days until exam.
 * Red: 1-2 days, Orange: 3-4 days, Primary: > 4 days
 */
export function getExamUrgency(dateStr: string): { 
    textColor: string; 
    bgColor: string; 
    borderColor: string;
    pulse: boolean;
    daysUntil: number;
} {
    const examDate = parseTimelineDate(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysUntil = Math.ceil(
        (examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntil <= 2) {
        return { textColor: 'text-error', bgColor: 'bg-error', borderColor: 'border-error', pulse: true, daysUntil };
    }
    if (daysUntil <= 4) {
        return { textColor: 'text-warning', bgColor: 'bg-warning', borderColor: 'border-warning', pulse: false, daysUntil };
    }
    return { textColor: 'text-primary', bgColor: 'bg-primary', borderColor: 'border-primary', pulse: false, daysUntil };
}
