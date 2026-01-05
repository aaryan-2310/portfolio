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
