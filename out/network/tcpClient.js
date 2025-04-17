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
exports.TcpClient = void 0;
const net = __importStar(require("net"));
const events_1 = require("events");
const constants_1 = require("../constants");
/**
 * Handles TCP client logic for connecting to discovered peers.
 */
class TcpClient extends events_1.EventEmitter {
    /**
     * Creates an instance of TcpClient.
     * @param logger The logger instance.
     */
    constructor(logger) {
        super();
        this.socket = null;
        this.isConnecting = false;
        this.currentPeer = null;
        this.logger = logger;
    }
    /**
     * Connects to a discovered peer.
     * @param peer The peer to connect to.
     */
    connect(peer) {
        if (this.socket || this.isConnecting) {
            this.logger.warn(`[TcpClient] Already connecting to a peer, ignoring connection to ${peer.ip}:${peer.port}`);
            return;
        }
        this.isConnecting = true;
        this.currentPeer = peer;
        this.logger.info(`[TcpClient] Connecting to ${peer.ip}:${peer.port}...`);
        try {
            this.socket = new net.Socket();
            this.socket.setTimeout(constants_1.NETWORK.CONNECTION_TIMEOUT);
            this.setupSocketEventHandlers(peer);
            this.socket.connect(peer.port, peer.ip);
        }
        catch (err) {
            this.logger.error(`[TcpClient] Failed to create socket for connection to ${peer.ip}:${peer.port}`, err);
            this.cleanup();
            this.emit('connectionFailed', peer, err instanceof Error ? err : new Error(String(err)));
        }
    }
    /**
     * Disconnects from the current peer.
     */
    disconnect() {
        if (!this.socket) {
            this.logger.info('[TcpClient] Not connected to any peer');
            return;
        }
        this.logger.info('[TcpClient] Disconnecting from peer');
        this.socket.end();
        this.cleanup();
    }
    /**
     * Sets up event handlers for the socket.
     * @param peer The peer being connected to.
     */
    setupSocketEventHandlers(peer) {
        if (!this.socket)
            return;
        this.socket.on('connect', () => {
            this.isConnecting = false;
            this.logger.info(`[TcpClient] Connected to ${peer.ip}:${peer.port}`);
            this.emit('connectionEstablished', this.socket, peer);
        });
        this.socket.on('timeout', () => {
            this.logger.warn(`[TcpClient] Connection to ${peer.ip}:${peer.port} timed out`);
            this.socket?.destroy();
            this.cleanup();
            this.emit('connectionFailed', peer, new Error('Connection timed out'));
        });
        this.socket.on('error', (err) => {
            this.logger.error(`[TcpClient] Error connecting to ${peer.ip}:${peer.port}`, err);
            this.cleanup();
            this.emit('connectionFailed', peer, err);
        });
        this.socket.on('close', (hadError) => {
            this.logger.info(`[TcpClient] Connection closed ${hadError ? 'with error' : ''}`);
            this.cleanup();
        });
    }
    /**
     * Cleans up resources after a connection ends or fails.
     */
    cleanup() {
        this.socket = null;
        this.isConnecting = false;
        this.currentPeer = null;
    }
}
exports.TcpClient = TcpClient;
//# sourceMappingURL=tcpClient.js.map