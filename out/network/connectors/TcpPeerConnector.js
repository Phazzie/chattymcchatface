"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TcpPeerConnector = void 0;
const events_1 = require("events");
/**
 * Uses an ITcpClient implementation to initiate outgoing TCP connections.
 * Emits results via events.
 */
class TcpPeerConnector extends events_1.EventEmitter {
    constructor(tcpClient, // Inject the specific client impl
    logger) {
        super();
        this.tcpClient = tcpClient;
        this.logger = logger;
        this.setupClientEventHandlers();
    }
    setupClientEventHandlers() {
        // Forward events from the underlying ITcpClient
        this.tcpClient.on('connectionEstablished', (socket, peer) => {
            this.logger.info(`[TcpConnector] Forwarding connectionEstablished for ${peer.ip}`);
            this.emit('connectionEstablished', socket, peer);
        });
        this.tcpClient.on('connectionFailed', (peer, error) => {
            this.logger.warn(`[TcpConnector] Forwarding connectionFailed for ${peer.ip}`);
            this.emit('connectionFailed', peer, error);
        });
    }
    connect(peer) {
        this.logger.info(`[TcpConnector] Requesting TCP client to connect to ${peer.ip}:${peer.port}`);
        // Delegate connection attempt to the injected ITcpClient
        this.tcpClient.connect(peer);
    }
    // Ensure cleanup if this class manages resources (listeners)
    dispose() {
        this.tcpClient.removeAllListeners('connectionEstablished');
        this.tcpClient.removeAllListeners('connectionFailed');
        this.logger.info('[TcpConnector] Disposed listeners.');
    }
}
exports.TcpPeerConnector = TcpPeerConnector;
//# sourceMappingURL=TcpPeerConnector.js.map