/**
 * Abstract interface for timer operations (setTimeout, clearTimeout).
 * Facilitates testing and dependency inversion.
 */
export interface ITimer {
    /** Sets a timeout. */
    set(callback: () => void, ms: number): NodeJS.Timeout; // Or a generic handle type

    /** Clears a previously set timeout. */
    clear(handle: NodeJS.Timeout | null): void; // Or a generic handle type
}
