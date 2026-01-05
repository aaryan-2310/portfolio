/**
 * Date formatting utilities
 */

/**
 * Format a date range (e.g., "Jan 2023 – Present")
 */
export function formatDateRange(start: string, end?: string | null): string {
    const startDate = new Date(start);
    const startStr = startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    if (!end) return `${startStr} – Present`;
    const endDate = new Date(end);
    const endStr = endDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    return `${startStr} – ${endStr}`;
}

/**
 * Format a date for display (e.g., "Jan 5, 2023")
 */
export function formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

/**
 * Format a date in long format (e.g., "January 5, 2023")
 */
export function formatDateLong(date: Date): string {
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Format month and year only (e.g., "Jan 2023" or "Present")
 */
export function formatMonthYear(date: Date | null): string {
    if (!date) return 'Present';
    return date.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
    });
}

/**
 * Calculate duration between two dates in human-readable format
 */
export function getDuration(start: Date, end: Date | null): string {
    const endDate = end || new Date();

    // Handle invalid dates
    if (!start || isNaN(start.getTime())) {
        return 'Invalid date';
    }

    const months =
        (endDate.getFullYear() - start.getFullYear()) * 12 + (endDate.getMonth() - start.getMonth());

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years === 0) {
        return `${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
    } else if (remainingMonths === 0) {
        return `${years} ${years === 1 ? 'year' : 'years'}`;
    } else {
        return `${years} ${years === 1 ? 'year' : 'years'}, ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
    }
}
