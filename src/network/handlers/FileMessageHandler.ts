import { ILogger } from '../../interfaces';
import { IMessage, MessageType } from '../interfaces/IMessage';
import { FileMessageBase } from '../messages/FileMessageBase';
import { FileRequestMessage } from '../messages/FileRequestMessage';
import { FileChunkMessage } from '../messages/FileChunkMessage';
import { FileCompleteMessage } from '../messages/FileCompleteMessage';
import { IMessageHandler } from '../interfaces/IMessageHandler';
import { EventEmitter } from 'events';

/**
 * Handles file-related messages.
 */
export class FileMessageHandler extends EventEmitter {
  /**
   * Creates a new FileMessageHandler.
   * @param logger The logger instance
   * @param messageHandler The message handler to register with
   */
  constructor(
    private readonly logger: ILogger,
    messageHandler: IMessageHandler
  ) {
    super();

    // Register handlers for all file message types
    messageHandler.registerHandler(
      MessageType.FILE_REQ,
      (connectionId: string, message: IMessage): boolean =>
        this.handleFileRequestMessage(connectionId, message as FileRequestMessage)
    );

    messageHandler.registerHandler(
      MessageType.FILE_CHUNK,
      (connectionId: string, message: IMessage): boolean =>
        this.handleFileChunkMessage(connectionId, message as FileChunkMessage)
    );

    messageHandler.registerHandler(
      MessageType.FILE_COMPLETE,
      (connectionId: string, message: IMessage): boolean =>
        this.handleFileCompleteMessage(connectionId, message as FileCompleteMessage)
    );

    this.logger.info('[FileMessageHandler] Registered handlers for FILE messages');
  }

  /**
   * Handles a file request message.
   * @param connectionId The ID of the connection that received the message
   * @param message The file request message to handle
   * @returns True if the message was handled successfully, false otherwise
   */
  private handleFileRequestMessage(connectionId: string, message: FileRequestMessage): boolean {
    if (!message.validate()) {
      this.logger.warn(`[FileMessageHandler] Invalid FILE_REQ message from ${connectionId}`);
      return false;
    }

    this.logger.info(`[FileMessageHandler] Received FILE_REQ message from ${connectionId}: ${message.fileName} (${message.fileSize} bytes)`);

    // Emit an event for the file request
    this.emit('fileRequest', connectionId, message.transferId, message.fileName, message.fileSize);
    return true;
  }

  /**
   * Handles a file chunk message.
   * @param connectionId The ID of the connection that received the message
   * @param message The file chunk message to handle
   * @returns True if the message was handled successfully, false otherwise
   */
  private handleFileChunkMessage(connectionId: string, message: FileChunkMessage): boolean {
    if (!message.validate()) {
      this.logger.warn(`[FileMessageHandler] Invalid FILE_CHUNK message from ${connectionId}`);
      return false;
    }

    this.logger.info(`[FileMessageHandler] Received FILE_CHUNK message from ${connectionId}: chunk ${message.chunkIndex + 1}/${message.totalChunks}`);

    // Emit an event for the file chunk
    this.emit('fileChunk', connectionId, message.transferId, message.chunkIndex, message.totalChunks, message.data);
    return true;
  }

  /**
   * Handles a file complete message.
   * @param connectionId The ID of the connection that received the message
   * @param message The file complete message to handle
   * @returns True if the message was handled successfully, false otherwise
   */
  private handleFileCompleteMessage(connectionId: string, message: FileCompleteMessage): boolean {
    if (!message.validate()) {
      this.logger.warn(`[FileMessageHandler] Invalid FILE_COMPLETE message from ${connectionId}`);
      return false;
    }

    this.logger.info(`[FileMessageHandler] Received FILE_COMPLETE message from ${connectionId}`);

    // Emit an event for the file complete
    this.emit('fileComplete', connectionId, message.transferId);
    return true;
  }
}
