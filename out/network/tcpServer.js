"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TcpServer = void 0;
const net = __importStar(require("net"));
const events_1 = require("events");
const constants_1 = require("../constants");
/**
 * Handles the TCP server logic for accepting incoming peer connections.
 */
class TcpServer extends events_1.EventEmitter {
    /**
     * Creates an instance of TcpServer.
     * @param logger The logger instance.
     */
    constructor(logger) {
        super();
        this.tcpServer = null;
        this.logger = logger;
    }
    /**
     * Starts the TCP server and begins listening for connections.
     */
    start() {
        if (this.tcpServer) {
            this.logger.warn('[TcpServer] Server already running.');
            return;
        }
        try {
            this.tcpServer = net.createServer((socket) => {
                this.handleIncomingConnection(socket);
            });
            this.tcpServer.on('error', (err) => {
                this.logger.error('[TcpServer] TCP server error', err);
                this.stop(); // Attempt to clean up on error
                this.emit('error', err); // Forward the error event
            });
            this.tcpServer.on('close', () => {
                this.logger.info('[TcpServer] TCP server stopped.');
                this.tcpServer = null;
            });
            this.tcpServer.listen(constants_1.NETWORK.CHAT_PORT, () => {
                const address = this.tcpServer?.address();
                const port = typeof address === 'string' ? address : address?.port;
                this.logger.info(`[TcpServer] TCP server listening on port ${port || constants_1.NETWORK.CHAT_PORT}`);
            });
        }
        catch (err) {
            this.logger.error('[TcpServer] Failed to create TCP server', err);
            this.tcpServer = null;
            this.emit('error', err); // Emit error if creation fails
        }
    }
    /**
     * Stops the TCP server.
     */
    stop() {
        if (this.tcpServer) {
            this.tcpServer.close((err) => {
                if (err) {
                    this.logger.error('[TcpServer] Error closing TCP server', err);
                }
                // The 'close' event handler will set this.tcpServer to null
            });
        }
        else {
            // Optional: Log that stop was called but server wasn't running
            // this.logger.info('[TcpServer] Stop called but server was not running.');
        }
    }
    /**
     * Handles a new incoming connection.
     * @param socket The socket for the incoming connection.
     */
    handleIncomingConnection(socket) {
        const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`;
        this.logger.info(`[TcpServer] Incoming connection from ${remoteAddress}`);
        this.emit('incomingConnection', socket);
    }
}
exports.TcpServer = TcpServer;
//# sourceMappingURL=tcpServer.js.map