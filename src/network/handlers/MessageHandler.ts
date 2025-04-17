import { EventEmitter } from 'events';
import { ILogger } from '../../interfaces';
import { IMessage, MessageType } from '../interfaces/IMessage';
import { IMessageHandler, MessageHandlerFn } from '../interfaces/IMessageHandler';

/**
 * Handles messages based on their type.
 * Implements the Strategy pattern for message handling.
 */
export class MessageHandler extends EventEmitter implements IMessageHandler {
  private readonly handlers: Map<MessageType, MessageHandlerFn> = new Map();
  
  /**
   * Creates a new MessageHandler.
   * @param logger The logger instance
   */
  constructor(private readonly logger: ILogger) {
    super();
  }
  
  /**
   * Handles a message and returns whether it was successfully processed.
   * @param connectionId The ID of the connection that received the message
   * @param message The message to handle
   * @returns True if the message was handled, false otherwise
   */
  public handleMessage(connectionId: string, message: IMessage): boolean {
    if (!message.validate()) {
      this.logger.warn(`[MessageHandler] Invalid message of type ${message.type} from ${connectionId}`);
      return false;
    }
    
    const handler = this.handlers.get(message.type);
    if (!handler) {
      this.logger.warn(`[MessageHandler] No handler registered for message type ${message.type}`);
      return false;
    }
    
    try {
      const result = handler(connectionId, message);
      this.emit('messageHandled', connectionId, message, result);
      return result;
    } catch (error) {
      this.logger.error(`[MessageHandler] Error handling message of type ${message.type}`, error);
      return false;
    }
  }
  
  /**
   * Registers a handler function for a specific message type.
   * @param messageType The type of message to handle
   * @param handler The handler function
   */
  public registerHandler(messageType: MessageType, handler: MessageHandlerFn): void {
    this.handlers.set(messageType, handler);
    this.logger.info(`[MessageHandler] Registered handler for message type ${messageType}`);
  }
  
  /**
   * Unregisters a handler for a specific message type.
   * @param messageType The type of message to unregister the handler for
   */
  public unregisterHandler(messageType: MessageType): void {
    const removed = this.handlers.delete(messageType);
    if (removed) {
      this.logger.info(`[MessageHandler] Unregistered handler for message type ${messageType}`);
    }
  }
}
