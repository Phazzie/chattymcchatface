"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileRequestMessageHandler = void 0;
const IMessage_1 = require("../interfaces/IMessage");
const events_1 = require("events");
/**
 * Handles file request messages.
 */
class FileRequestMessageHandler extends events_1.EventEmitter {
    /**
     * Creates a new FileRequestMessageHandler.
     * @param logger The logger instance
     * @param messageHandler The message handler to register with
     */
    constructor(logger, messageHandler) {
        super();
        this.logger = logger;
        messageHandler.registerHandler(IMessage_1.MessageType.FILE_REQ, (connectionId, message) => this.handleFileRequestMessage(connectionId, message));
        this.logger.info('[FileRequestMessageHandler] Registered handler for FILE_REQ messages');
    }
    /**
     * Handles a file request message.
     * @param connectionId The ID of the connection that received the message
     * @param message The file request message to handle
     * @returns True if the message was handled successfully, false otherwise
     */
    handleFileRequestMessage(connectionId, message) {
        if (!message.validate()) {
            this.logger.warn(`[FileRequestMessageHandler] Invalid FILE_REQ message from ${connectionId}`);
            return false;
        }
        this.logger.info(`[FileRequestMessageHandler] Received FILE_REQ message from ${connectionId}: ` +
            `${message.fileName} (${message.fileSize} bytes)`);
        // Emit an event for the file request
        this.emit('fileRequest', connectionId, message.transferId, message.fileName, message.fileSize);
        return true;
    }
}
exports.FileRequestMessageHandler = FileRequestMessageHandler;
//# sourceMappingURL=FileRequestMessageHandler.js.map