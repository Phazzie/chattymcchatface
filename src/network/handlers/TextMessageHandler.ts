import { ILogger } from '../../interfaces';
import { IMessage, MessageType } from '../interfaces/IMessage';
import { TextMessage } from '../messages/TextMessage';
import { IMessageHandler } from '../interfaces/IMessageHandler';

/**
 * Handles text messages.
 */
export class TextMessageHandler {
  /**
   * Creates a new TextMessageHandler.
   * @param logger The logger instance
   * @param messageHandler The message handler to register with
   */
  constructor(
    private readonly logger: ILogger,
    messageHandler: IMessageHandler
  ) {
    messageHandler.registerHandler(
      MessageType.TEXT,
      (connectionId: string, message: IMessage): boolean => this.handleTextMessage(connectionId, message as TextMessage)
    );
    
    this.logger.info('[TextMessageHandler] Registered handler for TEXT messages');
  }
  
  /**
   * Handles a text message.
   * @param connectionId The ID of the connection that received the message
   * @param message The text message to handle
   * @returns True if the message was handled successfully, false otherwise
   */
  private handleTextMessage(connectionId: string, message: TextMessage): boolean {
    if (!message.validate()) {
      this.logger.warn(`[TextMessageHandler] Invalid TEXT message from ${connectionId}`);
      return false;
    }
    
    this.logger.info(`[TextMessageHandler] Received TEXT message from ${connectionId}: ${message.content}`);
    
    // In a real implementation, this would likely emit an event or call a callback
    // For now, we just log the message and return success
    return true;
  }
}
