import { EventEmitter } from 'events';
import { IMessage } from './IMessage';

/**
 * Interface for handling network connections.
 */
export interface IConnectionHandler extends EventEmitter {
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
   * Starts the authentication process.
   * @param isInitiator Whether this side initiated the connection
   */
  startAuthentication(isInitiator: boolean): void;
  
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
}
