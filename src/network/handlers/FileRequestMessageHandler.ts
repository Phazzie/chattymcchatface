import { ILogger } from '../../interfaces';
import { IMessage, MessageType } from '../interfaces/IMessage';
import { FileRequestMessage } from '../messages/FileRequestMessage';
import { IMessageHandler } from '../interfaces/IMessageHandler';
import { EventEmitter } from 'events';

/**
 * Handles file request messages.
 */
export class FileRequestMessageHandler extends EventEmitter {
  /**
   * Creates a new FileRequestMessageHandler.
   * @param logger The logger instance
   * @param messageHandler The message handler to register with
   */
  constructor(
    private readonly logger: ILogger,
    messageHandler: IMessageHandler
  ) {
    super();
    
    messageHandler.registerHandler(
      MessageType.FILE_REQ,
      (connectionId: string, message: IMessage): boolean => 
        this.handleFileRequestMessage(connectionId, message as FileRequestMessage)
    );
    
    this.logger.info('[FileRequestMessageHandler] Registered handler for FILE_REQ messages');
  }
  
  /**
   * Handles a file request message.
   * @param connectionId The ID of the connection that received the message
   * @param message The file request message to handle
   * @returns True if the message was handled successfully, false otherwise
   */
  private handleFileRequestMessage(connectionId: string, message: FileRequestMessage): boolean {
    if (!message.validate()) {
      this.logger.warn(`[FileRequestMessageHandler] Invalid FILE_REQ message from ${connectionId}`);
      return false;
    }
    
    this.logger.info(
      `[FileRequestMessageHandler] Received FILE_REQ message from ${connectionId}: ` +
      `${message.fileName} (${message.fileSize} bytes)`
    );
    
    // Emit an event for the file request
    this.emit('fileRequest', connectionId, message.transferId, message.fileName, message.fileSize);
    return true;
  }
}
