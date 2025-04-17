"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkManagerRefactored = void 0;
const events_1 = require("events");
const TextMessage_1 = require("./messages/TextMessage");
/**
 * Orchestrates the network components (discovery, server, client, connection handling).
 * Implements the INetworkManager interface for SOLID compliance.
 */
class NetworkManagerRefactored extends events_1.EventEmitter {
    /**
     * Creates a new NetworkManager.
     * @param logger The logger instance
     * @param udpDiscovery The UDP discovery service
     * @param tcpServer The TCP server
     * @param tcpClient The TCP client
     * @param authService The authentication service
     * @param connectionManager The connection manager
     * @param instanceId The unique identifier for this instance
     */
    constructor(logger, udpDiscovery, tcpServer, tcpClient, authService, connectionManager, instanceId) {
        super();
        this.logger = logger;
        this.udpDiscovery = udpDiscovery;
        this.tcpServer = tcpServer;
        this.tcpClient = tcpClient;
        this.authService = authService;
        this.connectionManager = connectionManager;
        this.instanceId = instanceId;
        this.isConnecting = false;
        this.connectedPeer = null;
        this.setupEventHandlers();
        this.logger.info(`[NetworkManager] Initialized with instance ID ${instanceId}`);
    }
    /**
     * Starts all network services (discovery, server).
     */
    start() {
        this.tcpServer.start();
        this.udpDiscovery.start();
        this.logger.info('[NetworkManager] Started network services');
    }
    /**
     * Stops all network services.
     */
    stop() {
        this.connectionManager.closeAll();
        this.tcpServer.stop();
        this.udpDiscovery.stop();
        this.connectedPeer = null;
        this.logger.info('[NetworkManager] Stopped network services');
    }
    /**
     * Sends a message to all connected peers.
     * @param message The message to send
     * @returns True if the message was sent to at least one peer, false otherwise
     */
    sendMessage(message) {
        const sentCount = this.connectionManager.broadcastMessage(message);
        return sentCount > 0;
    }
    /**
     * Sends a text message to all connected peers.
     * @param text The text to send
     * @returns True if the message was sent to at least one peer, false otherwise
     */
    sendTextMessage(text) {
        const textMessage = new TextMessage_1.TextMessage(text);
        return this.sendMessage(textMessage);
    }
    /**
     * Connects to a specific peer.
     * @param peer The peer to connect to
     */
    connectToPeer(peer) {
        if (this.isConnecting) {
            this.logger.warn('[NetworkManager] Already connecting to a peer');
            return;
        }
        this.isConnecting = true;
        this.connectedPeer = peer;
        this.tcpClient.connect(peer);
    }
    /**
     * Disconnects from all peers.
     */
    disconnectFromAllPeers() {
        this.connectionManager.closeAll();
        this.connectedPeer = null;
    }
    /**
     * Sets up event handlers for the network components.
     */
    setupEventHandlers() {
        // UDP Discovery events
        this.udpDiscovery.on('peerDiscovered', this.handlePeerDiscovered.bind(this));
        // TCP Server events
        this.tcpServer.on('incomingConnection', this.handleIncomingConnection.bind(this));
        // TCP Client events
        this.tcpClient.on('connectionEstablished', this.handleConnectionEstablished.bind(this));
        this.tcpClient.on('connectionFailed', this.handleConnectionFailed.bind(this));
        // Connection Manager events
        this.connectionManager.on('connectionAuthenticated', this.handleConnectionAuthenticated.bind(this));
        this.connectionManager.on('connectionRemoved', this.handleConnectionRemoved.bind(this));
        this.connectionManager.on('messageReceived', this.handleMessageReceived.bind(this));
    }
    /**
     * Handles a discovered peer event.
     * @param peer The discovered peer
     */
    handlePeerDiscovered(peer) {
        // Ignore our own broadcasts
        if (peer.instanceId === this.instanceId) {
            return;
        }
        this.emit('peerDiscovered', peer);
        // Automatically attempt to connect if not already connected/connecting
        if (!this.connectedPeer && !this.isConnecting) {
            this.connectToPeer(peer);
        }
    }
    /**
     * Handles an incoming connection event.
     * @param socket The incoming socket
     */
    handleIncomingConnection(socket) {
        const connection = this.connectionManager.createConnection(socket, false);
        connection.startAuthentication(false);
    }
    /**
     * Handles a connection established event.
     * @param socket The established socket
     * @param peer The peer that was connected to
     */
    handleConnectionEstablished(socket, peer) {
        this.isConnecting = false;
        this.connectedPeer = peer;
        const connection = this.connectionManager.createConnection(socket, true);
        connection.startAuthentication(true);
    }
    /**
     * Handles a connection failed event.
     * @param peer The peer that failed to connect
     * @param error The error that occurred
     */
    handleConnectionFailed(peer, error) {
        this.isConnecting = false;
        this.connectedPeer = null;
        this.logger.error(`[NetworkManager] Failed to connect to peer ${peer.instanceId} at ${peer.ip}:${peer.port}`, error);
    }
    /**
     * Handles a connection authenticated event.
     * @param connectionId The ID of the authenticated connection
     */
    handleConnectionAuthenticated(connectionId) {
        const connection = this.connectionManager.getConnection(connectionId);
        if (!connection) {
            return;
        }
        this.emit('authenticated', connectionId);
    }
    /**
     * Handles a connection removed event.
     * @param connectionId The ID of the removed connection
     */
    handleConnectionRemoved(connectionId) {
        this.emit('disconnected', connectionId);
    }
    /**
     * Handles a message received event.
     * @param connectionId The ID of the connection that received the message
     * @param message The received message
     */
    handleMessageReceived(connectionId, message) {
        this.emit('messageReceived', connectionId, message);
    }
}
exports.NetworkManagerRefactored = NetworkManagerRefactored;
//# sourceMappingURL=NetworkManagerRefactored.js.map