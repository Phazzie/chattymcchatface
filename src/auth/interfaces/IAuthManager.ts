import { EventEmitter } from 'events';

/**
 * Manages multiple authentication processes, routing messages and
 * starting new processes as needed. Forwards events from individual processes.
 */
export interface IAuthManager extends EventEmitter {
    /** Emitted when any managed auth process completes successfully. */
    on(event: 'authenticated', listener: (connectionId: string) => void): this;
    /** Emitted when any managed auth process fails. */
    on(event: 'authFailed', listener: (connectionId: string, reason: string) => void): this;

    /** Initiates authentication for a new connection. */
    startAuthentication(
        connectionId: string,
        isInitiator: boolean,
        sendMessage: (message: string) => boolean
    ): void;

    /** Handles an incoming message, routing it to the correct auth process. */
    handleMessage(connectionId: string, message: any): void; // Use specific type

    /** Stops and cleans up the auth process for a specific connection. */
    cleanupConnection(connectionId: string): void;
}
