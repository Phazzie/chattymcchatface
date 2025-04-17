import { ILogger } from '../../interfaces';
import { IMessage, MessageType } from '../interfaces/IMessage';
import { SystemMessage } from '../messages/SystemMessage';
import { IMessageHandler } from '../interfaces/IMessageHandler';

/**
 * Handles system messages.
 */
export class SystemMessageHandler {
  /**
   * Creates a new SystemMessageHandler.
   * @param logger The logger instance
   * @param messageHandler The message handler to register with
   */
  constructor(
    private readonly logger: ILogger,
    messageHandler: IMessageHandler
  ) {
    messageHandler.registerHandler(
      MessageType.SYSTEM,
      (connectionId: string, message: IMessage): boolean => 
        this.handleSystemMessage(connectionId, message as SystemMessage)
    );
    
    this.logger.info('[SystemMessageHandler] Registered handler for SYSTEM messages');
  }
  
  /**
   * Handles a system message.
   * @param connectionId The ID of the connection that received the message
   * @param message The system message to handle
   * @returns True if the message was handled successfully, false otherwise
   */
  private handleSystemMessage(connectionId: string, message: SystemMessage): boolean {
    if (!message.validate()) {
      this.logger.warn(`[SystemMessageHandler] Invalid SYSTEM message from ${connectionId}`);
      return false;
    }
    
    this.logger.info(`[SystemMessageHandler] Received SYSTEM message from ${connectionId}: ${message.content}`);
    
    // In a real implementation, this would likely emit an event or call a callback
    // For now, we just log the message and return success
    return true;
  }
}
