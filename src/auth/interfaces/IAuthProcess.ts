import { EventEmitter } from 'events';

/**
 * Represents the authentication process for a single connection.
 * Manages its own state machine, handles relevant messages, and times out.
 */
export interface IAuthProcess extends EventEmitter {
    /** Emitted when the process completes successfully. */
    on(event: 'authenticated', listener: (connectionId: string) => void): this;
    /** Emitted when the process fails. */
    on(event: 'failed', listener: (connectionId: string, reason: string) => void): this;

    /** Handles an incoming message relevant to this auth process. */
    handleMessage(message: any): void; // Use a more specific type if possible

    /** Starts the authentication flow. */
    start(): void;

    /** Aborts the authentication process and cleans up resources (e.g., timers). */
    abort(reason: string): void;

    /** Gets the unique identifier for the connection this process handles. */
    getConnectionId(): string;
}
