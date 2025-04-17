"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileChunkMessageHandler = void 0;
const IMessage_1 = require("../interfaces/IMessage");
const events_1 = require("events");
/**
 * Handles file chunk messages.
 */
class FileChunkMessageHandler extends events_1.EventEmitter {
    /**
     * Creates a new FileChunkMessageHandler.
     * @param logger The logger instance
     * @param messageHandler The message handler to register with
     */
    constructor(logger, messageHandler) {
        super();
        this.logger = logger;
        messageHandler.registerHandler(IMessage_1.MessageType.FILE_CHUNK, (connectionId, message) => this.handleFileChunkMessage(connectionId, message));
        this.logger.info('[FileChunkMessageHandler] Registered handler for FILE_CHUNK messages');
    }
    /**
     * Handles a file chunk message.
     * @param connectionId The ID of the connection that received the message
     * @param message The file chunk message to handle
     * @returns True if the message was handled successfully, false otherwise
     */
    handleFileChunkMessage(connectionId, message) {
        if (!message.validate()) {
            this.logger.warn(`[FileChunkMessageHandler] Invalid FILE_CHUNK message from ${connectionId}`);
            return false;
        }
        this.logger.info(`[FileChunkMessageHandler] Received FILE_CHUNK message from ${connectionId}: ` +
            `chunk ${message.chunkIndex + 1}/${message.totalChunks}`);
        // Emit an event for the file chunk
        this.emit('fileChunk', connectionId, message.transferId, message.chunkIndex, message.totalChunks, message.data);
        return true;
    }
}
exports.FileChunkMessageHandler = FileChunkMessageHandler;
//# sourceMappingURL=FileChunkMessageHandler.js.map