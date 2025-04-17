"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActiveConnectionCoordinator = void 0;
const events_1 = require("events");
/**
 * Coordinates the establishment, state, and events of the single active connection.
 * Decides whether to accept incoming or initiate outgoing connections.
 * Emits high-level connection status events.
 */
class ActiveConnectionCoordinator extends events_1.EventEmitter {
    constructor(connectionHandlerFactory, authService, logger) {
        super();
        this.connectionHandlerFactory = connectionHandlerFactory;
        this.authService = authService;
        this.logger = logger;
        this.activeHandler = null;
        this.connectedPeer = null;
        this.isConnecting = false;
        this.pendingPeer = null;
    }
    initiateConnection(peer) {
        if (this.isConnected()) {
            this.logger.info(`[ConnectionCoordinator] Already connected, ignoring connection request to ${peer.ip}`);
            return;
        }
        if (this.isConnecting) {
            this.logger.info(`[ConnectionCoordinator] Connection already in progress, ignoring request to ${peer.ip}`);
            return;
        }
        this.logger.info(`[ConnectionCoordinator] Initiating connection to ${peer.ip}:${peer.port}`);
        this.isConnecting = true;
        this.pendingPeer = peer;
        // Emit event for the peer connector to handle
        this.emit('connectRequest', peer);
    }
    registerOutgoingConnection(socket, peer) {
        if (!this.isConnecting) {
            this.logger.warn(`[ConnectionCoordinator] Received outgoing connection but not expecting one`);
            socket.destroy();
            return;
        }
        if (!this.pendingPeer || this.pendingPeer.instanceId !== peer.instanceId) {
            this.logger.warn(`[ConnectionCoordinator] Received connection for peer ${peer.instanceId} but does not match pending peer`);
            socket.destroy();
            return;
        }
        this.logger.info(`[ConnectionCoordinator] Registering outgoing connection to ${peer.ip}:${peer.port}`);
        // Create a connection handler for this socket
        const handler = this.connectionHandlerFactory.create(socket, this.logger, this.authService, true // isInitiator for outgoing connections
        );
        this.setupConnectionHandler(handler, peer);
        // Reset connection state
        this.isConnecting = false;
        this.pendingPeer = null;
    }
    registerIncomingConnection(socket) {
        const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`;
        if (this.isConnected() || this.isConnecting) {
            this.logger.info(`[ConnectionCoordinator] Rejecting incoming connection from ${remoteAddress} (already ${this.isConnected() ? 'connected' : 'connecting'})`);
            socket.destroy();
            return;
        }
        this.logger.info(`[ConnectionCoordinator] Registering incoming connection from ${remoteAddress}`);
        // Create a connection handler for this socket
        const handler = this.connectionHandlerFactory.create(socket, this.logger, this.authService, false // Not initiator for incoming connections
        );
        // For incoming connections, we don't know the peer details yet
        // We'll get them during authentication
        this.setupConnectionHandler(handler, null);
    }
    handleConnectionFailure(peer, error) {
        if (!this.isConnecting) {
            this.logger.warn(`[ConnectionCoordinator] Received connection failure but not expecting one`);
            return;
        }
        if (!this.pendingPeer || this.pendingPeer.instanceId !== peer.instanceId) {
            this.logger.warn(`[ConnectionCoordinator] Received failure for peer ${peer.instanceId} but does not match pending peer`);
            return;
        }
        this.logger.warn(`[ConnectionCoordinator] Connection to ${peer.ip}:${peer.port} failed: ${error.message}`);
        // Reset connection state
        this.isConnecting = false;
        this.pendingPeer = null;
        // Emit failure event
        this.emit('connectionFailed', peer, error);
    }
    disconnect(reason) {
        if (!this.activeHandler) {
            this.logger.info(`[ConnectionCoordinator] No active connection to disconnect`);
            return;
        }
        this.logger.info(`[ConnectionCoordinator] Disconnecting active connection: ${reason || 'No reason provided'}`);
        this.activeHandler.disconnect(reason);
        this.cleanupConnection();
    }
    getActiveHandler() {
        return this.activeHandler;
    }
    getConnectedPeer() {
        return this.connectedPeer;
    }
    isConnected() {
        return !!this.activeHandler && this.activeHandler.isAuthenticated;
    }
    setupConnectionHandler(handler, peer) {
        // Store the handler and peer
        this.activeHandler = handler;
        this.connectedPeer = peer;
        // Set up event handlers
        handler.on('authenticated', () => this.handleAuthenticated());
        handler.on('message', (message) => this.emit('messageReceived', message));
        handler.on('disconnected', (reason) => this.handleDisconnected(reason));
        handler.on('error', (error) => this.handleError(error));
    }
    handleAuthenticated() {
        if (!this.activeHandler || !this.connectedPeer) {
            this.logger.warn(`[ConnectionCoordinator] Received authenticated event but no active connection`);
            return;
        }
        this.logger.info(`[ConnectionCoordinator] Connection authenticated to ${this.connectedPeer.ip}`);
        this.emit('connected', this.connectedPeer);
    }
    handleDisconnected(reason) {
        this.logger.info(`[ConnectionCoordinator] Connection disconnected: ${reason || 'No reason provided'}`);
        this.emit('disconnected', reason);
        this.cleanupConnection();
    }
    handleError(error) {
        this.logger.error(`[ConnectionCoordinator] Connection error: ${error.message}`, error);
        if (this.activeHandler) {
            this.activeHandler.disconnect(`Error: ${error.message}`);
        }
        this.emit('disconnected', `Connection error: ${error.message}`);
        this.cleanupConnection();
    }
    cleanupConnection() {
        if (this.activeHandler) {
            this.activeHandler.removeAllListeners();
            this.activeHandler = null;
        }
        this.connectedPeer = null;
    }
}
exports.ActiveConnectionCoordinator = ActiveConnectionCoordinator;
//# sourceMappingURL=ActiveConnectionCoordinator.js.map