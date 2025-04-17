"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkManager = void 0;
const events_1 = require("events");
const connectionHandler_1 = require("./connectionHandler");
/**
 * Orchestrates the network components (discovery, server, client, connection handling).
 */
class NetworkManager extends events_1.EventEmitter {
    constructor(logger, udpDiscovery, tcpServer, tcpClient, authService, instanceId, connectionHandlerFactory) {
        super();
        this.connectionHandler = null;
        this.connectedPeer = null;
        this.isConnecting = false;
        this.logger = logger;
        this.udpDiscovery = udpDiscovery;
        this.tcpServer = tcpServer;
        this.tcpClient = tcpClient;
        this.authService = authService;
        this.instanceId = instanceId;
        // Use provided factory or default implementation
        this.connectionHandlerFactory = connectionHandlerFactory ||
            ((socket, logger, authService, isInitiator) => new connectionHandler_1.ConnectionHandler(socket, logger, authService, isInitiator));
        this.setupEventHandlers();
    }
    /**
     * Starts the network discovery and server.
     */
    start() {
        this.tcpServer.start();
        this.udpDiscovery.start();
        this.logger.info('[NetworkManager] Started network services');
    }
    /**
     * Stops all network activity.
     */
    stop() {
        if (this.connectionHandler) {
            this.connectionHandler.close();
            this.connectionHandler = null;
            this.connectedPeer = null;
        }
        this.tcpServer.stop();
        this.udpDiscovery.stop();
        this.logger.info('[NetworkManager] Stopped network services');
    }
    /**
     * Sends a message to the connected peer.
     */
    sendMessage(message) {
        if (!this.connectionHandler || !this.connectionHandler.isAuthenticated) {
            this.logger.warn('[NetworkManager] Cannot send message: Not connected or not authenticated');
            return false;
        }
        return this.connectionHandler.sendMessage(message);
    }
    setupEventHandlers() {
        // UDP Discovery events
        this.udpDiscovery.on('peerDiscovered', this.handlePeerDiscovered.bind(this));
        // TCP Server events
        this.tcpServer.on('incomingConnection', this.handleIncomingConnection.bind(this));
        // TCP Client events
        this.tcpClient.on('connectionEstablished', this.handleConnectionEstablished.bind(this));
        this.tcpClient.on('connectionFailed', this.handleConnectionFailed.bind(this));
    }
    handlePeerDiscovered(peer) {
        this.emit('peerDiscovered', peer);
        // Automatically attempt to connect if not already connected/connecting
        if (!this.connectionHandler && !this.isConnecting) {
            this.connectToPeer(peer);
        }
    }
    connectToPeer(peer) {
        this.isConnecting = true;
        this.connectedPeer = peer;
        this.tcpClient.connect(peer);
    }
    handleIncomingConnection(socket) {
        if (this.connectionHandler) {
            this.logger.warn('[NetworkManager] Rejecting incoming connection: Already connected');
            socket.end();
            return;
        }
        this.setupConnection(socket, false);
    }
    handleConnectionEstablished(socket, peer) {
        this.isConnecting = false;
        this.connectedPeer = peer;
        this.setupConnection(socket, true);
    }
    handleConnectionFailed(peer, error) {
        this.logger.warn(`[NetworkManager] Connection to ${peer.ip}:${peer.port} failed: ${error.message}`);
        this.isConnecting = false;
        this.connectedPeer = null;
    }
    setupConnection(socket, isInitiator) {
        this.connectionHandler = this.connectionHandlerFactory(socket, this.logger, this.authService, isInitiator);
        this.connectionHandler.on('authenticated', this.handleConnectionAuthenticated.bind(this));
        this.connectionHandler.on('authFailed', this.handleConnectionAuthFailed.bind(this));
        this.connectionHandler.on('disconnected', this.handleConnectionDisconnected.bind(this));
        this.connectionHandler.on('messageReceived', this.handleMessageReceived.bind(this));
        // Start authentication
        this.connectionHandler.startAuthentication(isInitiator);
    }
    handleConnectionAuthenticated(connectionId) {
        this.logger.info('[NetworkManager] Connection authenticated');
        if (this.connectedPeer) {
            this.emit('connected', this.connectedPeer);
        }
    }
    handleConnectionAuthFailed(connectionId, reason) {
        this.logger.warn(`[NetworkManager] Authentication failed: ${reason}`);
        this.emit('authFailed', reason);
        // Clean up the failed connection
        this.connectionHandler = null;
        this.connectedPeer = null;
    }
    handleConnectionDisconnected(connectionId, hadError) {
        this.logger.info(`[NetworkManager] Connection disconnected${hadError ? ' with error' : ''}`);
        this.connectionHandler = null;
        this.connectedPeer = null;
        this.emit('disconnected', hadError ? 'Connection error' : undefined);
    }
    handleMessageReceived(connectionId, message) {
        this.emit('messageReceived', message);
    }
}
exports.NetworkManager = NetworkManager;
//# sourceMappingURL=networkManager.js.map