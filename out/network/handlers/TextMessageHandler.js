"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextMessageHandler = void 0;
const IMessage_1 = require("../interfaces/IMessage");
/**
 * Handles text messages.
 */
class TextMessageHandler {
    /**
     * Creates a new TextMessageHandler.
     * @param logger The logger instance
     * @param messageHandler The message handler to register with
     */
    constructor(logger, messageHandler) {
        this.logger = logger;
        messageHandler.registerHandler(IMessage_1.MessageType.TEXT, (connectionId, message) => this.handleTextMessage(connectionId, message));
        this.logger.info('[TextMessageHandler] Registered handler for TEXT messages');
    }
    /**
     * Handles a text message.
     * @param connectionId The ID of the connection that received the message
     * @param message The text message to handle
     * @returns True if the message was handled successfully, false otherwise
     */
    handleTextMessage(connectionId, message) {
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
exports.TextMessageHandler = TextMessageHandler;
//# sourceMappingURL=TextMessageHandler.js.map