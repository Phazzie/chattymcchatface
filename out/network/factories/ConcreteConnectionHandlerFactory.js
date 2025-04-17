"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConcreteConnectionHandlerFactory = void 0;
const connectionHandler_1 = require("../../connectionHandler"); // The CONCRETE implementation
/**
 * Default factory for creating ConnectionHandler instances.
 */
class ConcreteConnectionHandlerFactory {
    create(socket, logger, authService, isInitiator) {
        // Directly instantiates the known concrete ConnectionHandler
        return new connectionHandler_1.ConnectionHandler(socket, logger, authService, isInitiator);
    }
}
exports.ConcreteConnectionHandlerFactory = ConcreteConnectionHandlerFactory;
//# sourceMappingURL=ConcreteConnectionHandlerFactory.js.map