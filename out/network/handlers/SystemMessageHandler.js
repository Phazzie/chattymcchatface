"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemMessageHandler = void 0;
const IMessage_1 = require("../interfaces/IMessage");
/**
 * Handles system messages.
 */
class SystemMessageHandler {
    /**
     * Creates a new SystemMessageHandler.
     * @param logger The logger instance
     * @param messageHandler The message handler to register with
     */
    constructor(logger, messageHandler) {
        this.logger = logger;
        messageHandler.registerHandler(IMessage_1.MessageType.SYSTEM, (connectionId, message) => this.handleSystemMessage(connectionId, message));
        this.logger.info('[SystemMessageHandler] Registered handler for SYSTEM messages');
    }
    /**
     * Handles a system message.
     * @param connectionId The ID of the connection that received the message
     * @param message The system message to handle
     * @returns True if the message was handled successfully, false otherwise
     */
    handleSystemMessage(connectionId, message) {
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
exports.SystemMessageHandler = SystemMessageHandler;
//# sourceMappingURL=SystemMessageHandler.js.map