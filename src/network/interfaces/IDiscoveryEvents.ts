import { EventEmitter } from 'events';
import { DiscoveredPeer } from '../../interfaces';

/**
 * Defines the contract for handling peer discovery events.
 * Emits an event when a peer is discovered.
 */
export interface IDiscoveryEvents extends EventEmitter {
    /** Emitted when a peer is discovered on the network. */
    on(event: 'peerDiscovered', listener: (peer: DiscoveredPeer) => void): this;

    /** Starts listening for discovery events (binds events). */
    startListening(): void;

    /** Stops listening for discovery events (unbinds events). */
    stopListening(): void;
}
