"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncomingConnectionCoordinator = void 0;
/**
 * Listens for incoming connections and passes them to the
 * ActiveConnectionCoordinator for potential handling.
 */
class IncomingConnectionCoordinator {
    constructor(acceptor, connectionCoordinator, logger) {
        this.acceptor = acceptor;
        this.connectionCoordinator = connectionCoordinator;
        this.logger = logger;
        // Use arrow function to preserve 'this' context for the listener
        this.handleIncomingConnection = (socket) => {
            const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`;
            this.logger.debug(`[IncomingCoordinator] Noticed incoming connection from ${remoteAddress}`);
            // Delegate handling (including accept/reject logic) to the coordinator
            this.connectionCoordinator.registerIncomingConnection(socket);
        };
    }
    start() {
        this.logger.info('[IncomingCoordinator] Starting.');
        this.acceptor.startListening();
        this.acceptor.on('incomingConnection', this.handleIncomingConnection);
    }
    stop() {
        this.logger.info('[IncomingCoordinator] Stopping.');
        this.acceptor.off('incomingConnection', this.handleIncomingConnection);
        this.acceptor.stopListening();
    }
}
exports.IncomingConnectionCoordinator = IncomingConnectionCoordinator;
//# sourceMappingURL=IncomingConnectionCoordinator.js.map