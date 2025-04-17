import { EventEmitter } from 'events';
import { IMessage } from './IMessage';
import { DiscoveredPeer } from '../../interfaces';

/**
 * Interface for the high-level network manager.
 * Coordinates discovery, connections, and message handling.
 */
export interface INetworkManager extends EventEmitter {
  /**
   * Starts all network services (discovery, server).
   */
  start(): void;
  
  /**
   * Stops all network services.
   */
  stop(): void;
  
  /**
   * Sends a message to all connected peers.
   * @param message The message to send
   * @returns True if the message was sent to at least one peer, false otherwise
   */
  sendMessage(message: IMessage): boolean;
  
  /**
   * Connects to a specific peer.
   * @param peer The peer to connect to
   */
  connectToPeer(peer: DiscoveredPeer): void;
  
  /**
   * Disconnects from all peers.
   */
  disconnectFromAllPeers(): void;
  
  /**
   * Gets the instance ID of this network manager.
   */
  readonly instanceId: string;
  
  // Events that must be implemented:
  // 'peerDiscovered' - Emitted when a peer is discovered
  // 'connected' - Emitted when a connection is established
  // 'disconnected' - Emitted when a connection is closed
  // 'messageReceived' - Emitted when a message is received
  // 'authenticated' - Emitted when authentication succeeds
  // 'authenticationFailed' - Emitted when authentication fails
}
