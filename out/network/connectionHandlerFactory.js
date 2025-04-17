"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConnectionHandler = void 0;
const ConnectionHandlerImpl_1 = require("./ConnectionHandlerImpl");
/**
 * Creates ConnectionHandler instances.
 * @param socket The network socket for the connection
 * @param logger The logger instance
 * @param authService The authentication service
 * @param messageHandler The message handler for processing messages
 * @param isInitiator Whether this side initiated the connection
 * @returns A new ConnectionHandler instance
 */
function createConnectionHandler(socket, logger, authService, messageHandler, isInitiator) {
    return new ConnectionHandlerImpl_1.ConnectionHandlerImpl(socket, logger, authService, messageHandler, isInitiator);
}
exports.createConnectionHandler = createConnectionHandler;
//# sourceMappingURL=connectionHandlerFactory.js.map