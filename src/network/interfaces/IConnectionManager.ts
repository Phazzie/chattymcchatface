import { EventEmitter } from 'events';
import * as net from 'net';
import { IConnection } from './IConnection';
import { IMessage } from './IMessage';
import { DiscoveredPeer } from '../../interfaces';

/**
 * Interface for managing multiple network connections.
 */
export interface IConnectionManager extends EventEmitter {
  /**
   * Creates a new connection from a socket.
   * @param socket The socket to create a connection from
   * @param isInitiator Whether this side initiated the connection
   * @returns The created connection
   */
  createConnection(socket: net.Socket, isInitiator: boolean): IConnection;
  
  /**
   * Gets a connection by its ID.
   * @param connectionId The ID of the connection to get
   * @returns The connection, or undefined if not found
   */
  getConnection(connectionId: string): IConnection | undefined;
  
  /**
   * Gets all active connections.
   * @returns An array of all active connections
   */
  getAllConnections(): IConnection[];
  
  /**
   * Removes a connection.
   * @param connectionId The ID of the connection to remove
   * @returns True if the connection was removed, false if it wasn't found
   */
  removeConnection(connectionId: string): boolean;
  
  /**
   * Broadcasts a message to all authenticated connections.
   * @param message The message to broadcast
   * @param excludeConnectionId Optional connection ID to exclude from the broadcast
   * @returns The number of connections the message was sent to
   */
  broadcastMessage(message: IMessage, excludeConnectionId?: string): number;
  
  /**
   * Closes all connections.
   */
  closeAll(): void;
  
  // Events that must be implemented:
  // 'connectionAdded' - Emitted when a connection is added
  // 'connectionRemoved' - Emitted when a connection is removed
  // 'connectionAuthenticated' - Emitted when a connection is authenticated
  // 'messageReceived' - Emitted when a message is received on any connection
}
