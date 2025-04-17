import { EventEmitter } from 'events';
import * as net from 'net';
import { DiscoveredPeer, IConnectionHandler } from '../../interfaces';

/**
 * Coordinates the establishment, state, and events of the single active
 * connection. Decides whether to accept incoming or initiate outgoing connections.
 * Emits high-level connection status events.
 */
export interface IActiveConnectionCoordinator extends EventEmitter {
    /** Emitted when a connection is fully established and authenticated. */
    on(event: 'connected', listener: (peer: DiscoveredPeer) => void): this;
    /** Emitted when the active connection is lost or fails authentication. */
    on(event: 'disconnected', listener: (reason?: string) => void): this;
    /** Emitted when an authenticated message is received. */
    on(event: 'messageReceived', listener: (message: any) => void): this;

    /** Attempts to initiate a connection to the specified peer. */
    initiateConnection(peer: DiscoveredPeer): void;

    /** Handles a successfully established outgoing connection socket. */
    registerOutgoingConnection(socket: net.Socket, peer: DiscoveredPeer): void;

    /** Handles a potential incoming connection socket. */
    registerIncomingConnection(socket: net.Socket): void;

    /** Handles a failure during an outgoing connection attempt. */
    handleConnectionFailure(peer: DiscoveredPeer, error: Error): void;

    /** Manually disconnects the current connection, if any. */
    disconnect(reason?: string): void;

    /** Gets the currently active and authenticated connection handler. */
    getActiveHandler(): IConnectionHandler | null;

    /** Gets the peer information for the active connection. */
    getConnectedPeer(): DiscoveredPeer | null;

    /** Indicates if there is an active, authenticated connection. */
    isConnected(): boolean;
}
