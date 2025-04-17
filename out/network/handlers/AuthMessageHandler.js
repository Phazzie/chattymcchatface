"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthMessageHandler = void 0;
const IMessage_1 = require("../interfaces/IMessage");
/**
 * Handles authentication-related messages.
 */
class AuthMessageHandler {
    /**
     * Creates a new AuthMessageHandler.
     * @param logger The logger instance
     * @param authService The authentication service
     * @param messageHandler The message handler to register with
     */
    constructor(logger, authService, messageHandler) {
        this.logger = logger;
        this.authService = authService;
        // Register handlers for all auth message types
        messageHandler.registerHandler(IMessage_1.MessageType.AUTH_REQ, (connectionId, message) => this.handleAuthMessage(connectionId, message));
        messageHandler.registerHandler(IMessage_1.MessageType.AUTH_RESP, (connectionId, message) => this.handleAuthMessage(connectionId, message));
        messageHandler.registerHandler(IMessage_1.MessageType.AUTH_SUCCESS, (connectionId, message) => this.handleAuthMessage(connectionId, message));
        messageHandler.registerHandler(IMessage_1.MessageType.AUTH_FAIL, (connectionId, message) => this.handleAuthMessage(connectionId, message));
        this.logger.info('[AuthMessageHandler] Registered handlers for AUTH messages');
    }
    /**
     * Handles an authentication message.
     * @param connectionId The ID of the connection that received the message
     * @param message The auth message to handle
     * @returns True if the message was handled successfully, false otherwise
     */
    handleAuthMessage(connectionId, message) {
        if (!message.validate()) {
            this.logger.warn(`[AuthMessageHandler] Invalid AUTH message of type ${message.type} from ${connectionId}`);
            return false;
        }
        this.logger.info(`[AuthMessageHandler] Received AUTH message of type ${message.type} from ${connectionId}`);
        // Delegate to the auth service
        return this.authService.handleMessage(connectionId, message);
    }
}
exports.AuthMessageHandler = AuthMessageHandler;
//# sourceMappingURL=AuthMessageHandler.js.map