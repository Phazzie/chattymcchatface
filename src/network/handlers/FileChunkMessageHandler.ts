import { ILogger } from '../../interfaces';
import { IMessage, MessageType } from '../interfaces/IMessage';
import { FileChunkMessage } from '../messages/FileChunkMessage';
import { IMessageHandler } from '../interfaces/IMessageHandler';
import { EventEmitter } from 'events';

/**
 * Handles file chunk messages.
 */
export class FileChunkMessageHandler extends EventEmitter {
  /**
   * Creates a new FileChunkMessageHandler.
   * @param logger The logger instance
   * @param messageHandler The message handler to register with
   */
  constructor(
    private readonly logger: ILogger,
    messageHandler: IMessageHandler
  ) {
    super();
    
    messageHandler.registerHandler(
      MessageType.FILE_CHUNK,
      (connectionId: string, message: IMessage): boolean => 
        this.handleFileChunkMessage(connectionId, message as FileChunkMessage)
    );
    
    this.logger.info('[FileChunkMessageHandler] Registered handler for FILE_CHUNK messages');
  }
  
  /**
   * Handles a file chunk message.
   * @param connectionId The ID of the connection that received the message
   * @param message The file chunk message to handle
   * @returns True if the message was handled successfully, false otherwise
   */
  private handleFileChunkMessage(connectionId: string, message: FileChunkMessage): boolean {
    if (!message.validate()) {
      this.logger.warn(`[FileChunkMessageHandler] Invalid FILE_CHUNK message from ${connectionId}`);
      return false;
    }
    
    this.logger.info(
      `[FileChunkMessageHandler] Received FILE_CHUNK message from ${connectionId}: ` +
      `chunk ${message.chunkIndex + 1}/${message.totalChunks}`
    );
    
    // Emit an event for the file chunk
    this.emit(
      'fileChunk', 
      connectionId, 
      message.transferId, 
      message.chunkIndex, 
      message.totalChunks, 
      message.data
    );
    return true;
  }
}
