"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConnectionHandler = void 0;
const connectionHandler_1 = require("../network/connectionHandler");
/**
 * Creates ConnectionHandler instances.
 * @param socket The network socket for the connection
 * @param logger The logger instance
 * @param authService The authentication service
 * @param isInitiator Whether this side initiated the connection
 * @returns A new ConnectionHandler instance
 */
function createConnectionHandler(socket, logger, authService, isInitiator) {
    return new connectionHandler_1.ConnectionHandler(socket, logger, authService, isInitiator);
}
exports.createConnectionHandler = createConnectionHandler;
//# sourceMappingURL=connectionHandlerFactory.js.map