import { EventEmitter } from 'events';
import { IMessage } from './IMessage';

/**
 * Interface for a single network connection.
 * Handles the low-level details of sending and receiving data.
 */
export interface IConnection extends EventEmitter {
  /**
   * Unique identifier for this connection.
   */
  readonly id: string;
  
  /**
   * Whether the connection is authenticated.
   */
  readonly isAuthenticated: boolean;
  
  /**
   * The remote address of the connection.
   */
  readonly remoteAddress: string | undefined;
  
  /**
   * Sends a message over the connection.
   * @param message The message to send
   * @returns True if the message was sent successfully, false otherwise
   */
  sendMessage(message: IMessage): boolean;
  
  /**
   * Closes the connection.
   * @param emitEvent Whether to emit a disconnected event
   */
  close(emitEvent?: boolean): void;
  
  /**
   * Starts the authentication process for this connection.
   * @param isInitiator Whether this side initiated the connection
   */
  startAuthentication(isInitiator: boolean): void;
  
  // Events that must be implemented:
  // 'messageReceived' - Emitted when a message is received
  // 'disconnected' - Emitted when the connection is closed
  // 'authenticated' - Emitted when authentication succeeds
  // 'authenticationFailed' - Emitted when authentication fails
}
