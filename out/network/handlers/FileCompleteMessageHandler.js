"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileCompleteMessageHandler = void 0;
const IMessage_1 = require("../interfaces/IMessage");
const events_1 = require("events");
/**
 * Handles file complete messages.
 */
class FileCompleteMessageHandler extends events_1.EventEmitter {
    /**
     * Creates a new FileCompleteMessageHandler.
     * @param logger The logger instance
     * @param messageHandler The message handler to register with
     */
    constructor(logger, messageHandler) {
        super();
        this.logger = logger;
        messageHandler.registerHandler(IMessage_1.MessageType.FILE_COMPLETE, (connectionId, message) => this.handleFileCompleteMessage(connectionId, message));
        this.logger.info('[FileCompleteMessageHandler] Registered handler for FILE_COMPLETE messages');
    }
    /**
     * Handles a file complete message.
     * @param connectionId The ID of the connection that received the message
     * @param message The file complete message to handle
     * @returns True if the message was handled successfully, false otherwise
     */
    handleFileCompleteMessage(connectionId, message) {
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
exports.FileCompleteMessageHandler = FileCompleteMessageHandler;
//# sourceMappingURL=FileCompleteMessageHandler.js.map