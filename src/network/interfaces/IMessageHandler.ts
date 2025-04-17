import { EventEmitter } from 'events';
import { IMessage, MessageType } from './IMessage';

/**
 * Interface for handling messages of different types.
 * Implements the Strategy pattern for message handling.
 */
export interface IMessageHandler extends EventEmitter {
  /**
   * Handles a message and returns whether it was successfully processed.
   * @param connectionId The ID of the connection that received the message
   * @param message The message to handle
   * @returns True if the message was handled, false otherwise
   */
  handleMessage(connectionId: string, message: IMessage): boolean;
  
  /**
   * Registers a handler function for a specific message type.
   * @param messageType The type of message to handle
   * @param handler The handler function
   */
  registerHandler(messageType: MessageType, handler: MessageHandlerFn): void;
  
  /**
   * Unregisters a handler for a specific message type.
   * @param messageType The type of message to unregister the handler for
   */
  unregisterHandler(messageType: MessageType): void;
}

/**
 * Type definition for message handler functions.
 */
export type MessageHandlerFn = (connectionId: string, message: IMessage) => boolean;
