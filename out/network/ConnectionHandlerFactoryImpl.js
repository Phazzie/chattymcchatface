"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionHandlerFactoryImpl = void 0;
const ConnectionHandlerImpl_1 = require("./ConnectionHandlerImpl");
/**
 * Factory for creating connection handlers.
 */
class ConnectionHandlerFactoryImpl {
    /**
     * Creates a new ConnectionHandlerFactoryImpl.
     * @param messageHandler The message handler to use for new connections
     */
    constructor(messageHandler) {
        this.messageHandler = messageHandler;
    }
    /**
     * Creates a new connection handler.
     * @param socket The network socket for the connection
     * @param logger The logger instance
     * @param authService The authentication service
     * @param isInitiator Whether this side initiated the connection
     * @returns A new connection handler
     */
    create(socket, logger, authService, isInitiator) {
        return new ConnectionHandlerImpl_1.ConnectionHandlerImpl(socket, logger, authService, this.messageHandler, isInitiator);
    }
}
exports.ConnectionHandlerFactoryImpl = ConnectionHandlerFactoryImpl;
//# sourceMappingURL=ConnectionHandlerFactoryImpl.js.map