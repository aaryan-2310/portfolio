/**
 * TrackBy utility functions for Angular templates
 * These reduce boilerplate and ensure consistent tracking across components
 */

/**
 * Track by id property
 */
export function trackById<T extends { id: string }>(_: number, item: T): string {
    return item.id;
}

/**
 * Track by title property
 */
export function trackByTitle<T extends { title: string }>(_: number, item: T): string {
    return item.title;
}

/**
 * Track by the value itself (for primitive arrays like string[])
 */
export function trackByValue(_: number, value: string): string {
    return value;
}

/**
 * Track by index (use sparingly, only when items have no unique identifier)
 */
export function trackByIndex(index: number): number {
    return index;
}
