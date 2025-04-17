"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageHandler = void 0;
const events_1 = require("events");
/**
 * Handles messages based on their type.
 * Implements the Strategy pattern for message handling.
 */
class MessageHandler extends events_1.EventEmitter {
    /**
     * Creates a new MessageHandler.
     * @param logger The logger instance
     */
    constructor(logger) {
        super();
        this.logger = logger;
        this.handlers = new Map();
    }
    /**
     * Handles a message and returns whether it was successfully processed.
     * @param connectionId The ID of the connection that received the message
     * @param message The message to handle
     * @returns True if the message was handled, false otherwise
     */
    handleMessage(connectionId, message) {
        if (!message.validate()) {
            this.logger.warn(`[MessageHandler] Invalid message of type ${message.type} from ${connectionId}`);
            return false;
        }
        const handler = this.handlers.get(message.type);
        if (!handler) {
            this.logger.warn(`[MessageHandler] No handler registered for message type ${message.type}`);
            return false;
        }
        try {
            const result = handler(connectionId, message);
            this.emit('messageHandled', connectionId, message, result);
            return result;
        }
        catch (error) {
            this.logger.error(`[MessageHandler] Error handling message of type ${message.type}`, error);
            return false;
        }
    }
    /**
     * Registers a handler function for a specific message type.
     * @param messageType The type of message to handle
     * @param handler The handler function
     */
    registerHandler(messageType, handler) {
        this.handlers.set(messageType, handler);
        this.logger.info(`[MessageHandler] Registered handler for message type ${messageType}`);
    }
    /**
     * Unregisters a handler for a specific message type.
     * @param messageType The type of message to unregister the handler for
     */
    unregisterHandler(messageType) {
        const removed = this.handlers.delete(messageType);
        if (removed) {
            this.logger.info(`[MessageHandler] Unregistered handler for message type ${messageType}`);
        }
    }
}
exports.MessageHandler = MessageHandler;
//# sourceMappingURL=MessageHandler.js.map