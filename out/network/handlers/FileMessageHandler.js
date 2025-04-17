"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileMessageHandler = void 0;
const IMessage_1 = require("../interfaces/IMessage");
const events_1 = require("events");
/**
 * Handles file-related messages.
 */
class FileMessageHandler extends events_1.EventEmitter {
    /**
     * Creates a new FileMessageHandler.
     * @param logger The logger instance
     * @param messageHandler The message handler to register with
     */
    constructor(logger, messageHandler) {
        super();
        this.logger = logger;
        // Register handlers for all file message types
        messageHandler.registerHandler(IMessage_1.MessageType.FILE_REQ, (connectionId, message) => this.handleFileRequestMessage(connectionId, message));
        messageHandler.registerHandler(IMessage_1.MessageType.FILE_CHUNK, (connectionId, message) => this.handleFileChunkMessage(connectionId, message));
        messageHandler.registerHandler(IMessage_1.MessageType.FILE_COMPLETE, (connectionId, message) => this.handleFileCompleteMessage(connectionId, message));
        this.logger.info('[FileMessageHandler] Registered handlers for FILE messages');
    }
    /**
     * Handles a file request message.
     * @param connectionId The ID of the connection that received the message
     * @param message The file request message to handle
     * @returns True if the message was handled successfully, false otherwise
     */
    handleFileRequestMessage(connectionId, message) {
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
    handleFileChunkMessage(connectionId, message) {
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
    handleFileCompleteMessage(connectionId, message) {
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
exports.FileMessageHandler = FileMessageHandler;
//# sourceMappingURL=FileMessageHandler.js.map