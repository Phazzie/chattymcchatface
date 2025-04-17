"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TcpServerAcceptor = void 0;
const events_1 = require("events");
/**
 * Listens for incoming connections on an ITcpServer and emits an event.
 */
class TcpServerAcceptor extends events_1.EventEmitter {
    constructor(tcpServer, // Inject the specific server impl
    logger) {
        super();
        this.tcpServer = tcpServer;
        this.logger = logger;
        // Bind the handler method to ensure 'this' context is correct
        this.boundHandler = this.handleIncomingConnection.bind(this);
    }
    startListening() {
        this.logger.info('[TcpAcceptor] Starting to listen for server connections.');
        this.tcpServer.on('incomingConnection', this.boundHandler);
    }
    stopListening() {
        this.logger.info('[TcpAcceptor] Stopping listening for server connections.');
        this.tcpServer.off('incomingConnection', this.boundHandler);
    }
    handleIncomingConnection(socket) {
        const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`;
        this.logger.info(`[TcpAcceptor] Forwarding incoming connection from ${remoteAddress}`);
        this.emit('incomingConnection', socket); // Emit the raw socket
    }
}
exports.TcpServerAcceptor = TcpServerAcceptor;
//# sourceMappingURL=TcpServerAcceptor.js.map