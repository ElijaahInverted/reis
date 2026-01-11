import { DAY_NAMES } from './timeHelpers';

/**
 * Parse capacity string to get occupied/total numbers.
 */
export function parseCapacity(capacity?: string): { occupied: number; total: number; percent: number } | null {
    if (!capacity) return null;
    const [occupied, total] = capacity.split('/').map(Number);
    if (isNaN(occupied) || isNaN(total) || total === 0) return null;
    return { occupied, total, percent: Math.min(100, (occupied / total) * 100) };
}

/**
 * Get day of week from DD.MM.YYYY string.
 */
export function getDayOfWeek(dateStr: string): string {
    const [day, month, year] = dateStr.split('.').map(Number);
    const date = new Date(year, month - 1, day);
    return DAY_NAMES[date.getDay()];
}

/**
 * Parse registrationStart string to Date object.
 */
export function parseRegistrationDate(dateStr: string): Date | null {
    try {
        const [datePart, timePart] = dateStr.split(' ');
        const [day, month, year] = datePart.split('.').map(Number);
        const [hours, minutes] = (timePart || '00:00').split(':').map(Number);
        return new Date(year, month - 1, day, hours, minutes);
    } catch {
        return null;
    }
}

/**
 * Format countdown from milliseconds to human readable string.
 */
export function formatCountdown(ms: number): string {
    if (ms <= 0) return 'Nyní';

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
        const remainingHours = hours % 24;
        return `${days}d ${remainingHours}h`;
    }
    if (hours > 0) {
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    }
    if (minutes > 0) {
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
}
