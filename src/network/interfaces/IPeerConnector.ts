import { EventEmitter } from 'events';
import * as net from 'net';
import { DiscoveredPeer } from '../../interfaces';

/**
 * Defines the contract for initiating outgoing TCP connections.
 * Emits events indicating the outcome of connection attempts.
 */
export interface IPeerConnector extends EventEmitter {
    /** Emitted when an outgoing connection is successfully established. */
    on(event: 'connectionEstablished', listener: (socket: net.Socket, peer: DiscoveredPeer) => void): this;
    /** Emitted when an outgoing connection attempt fails. */
    on(event: 'connectionFailed', listener: (peer: DiscoveredPeer, error: Error) => void): this;

    /** Attempts to connect to the specified peer. */
    connect(peer: DiscoveredPeer): void;
}
