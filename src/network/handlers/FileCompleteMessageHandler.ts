import { ILogger } from '../../interfaces';
import { IMessage, MessageType } from '../interfaces/IMessage';
import { FileCompleteMessage } from '../messages/FileCompleteMessage';
import { IMessageHandler } from '../interfaces/IMessageHandler';
import { EventEmitter } from 'events';

/**
 * Handles file complete messages.
 */
export class FileCompleteMessageHandler extends EventEmitter {
  /**
   * Creates a new FileCompleteMessageHandler.
   * @param logger The logger instance
   * @param messageHandler The message handler to register with
   */
  constructor(
    private readonly logger: ILogger,
    messageHandler: IMessageHandler
  ) {
    super();
    
    messageHandler.registerHandler(
      MessageType.FILE_COMPLETE,
      (connectionId: string, message: IMessage): boolean => 
        this.handleFileCompleteMessage(connectionId, message as FileCompleteMessage)
    );
    
    this.logger.info('[FileCompleteMessageHandler] Registered handler for FILE_COMPLETE messages');
  }
  
  /**
   * Handles a file complete message.
   * @param connectionId The ID of the connection that received the message
   * @param message The file complete message to handle
   * @returns True if the message was handled successfully, false otherwise
   */
  private handleFileCompleteMessage(connectionId: string, message: FileCompleteMessage): boolean {
    if (!message.validate()) {
      this.logger.warn(`[FileCompleteMessageHandler] Invalid FILE_COMPLETE message from ${connectionId}`);
      return false;
    }
    
    this.logger.info(`[FileCompleteMessageHandler] Received FILE_COMPLETE message from ${connectionId}`);
    
    // Emit an event for the file complete
    this.emit('fileComplete', connectionId, message.transferId);
    return true;
  }
}
