import * as net from 'net';
import { EventEmitter } from 'events';

/**
 * Defines the contract for accepting incoming TCP connections.
 * Emits an event when a new connection is received.
 */
export interface IIncomingConnectionAcceptor extends EventEmitter {
    /** Emitted when a new incoming TCP connection is accepted by the server. */
    on(event: 'incomingConnection', listener: (socket: net.Socket) => void): this;

    /** Starts listening for incoming connections (binds events). */
    startListening(): void;

    /** Stops listening for incoming connections (unbinds events). */
    stopListening(): void;
}
