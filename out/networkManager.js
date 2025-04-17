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
exports.NetworkManager = void 0;
const dgram = __importStar(require("dgram"));
const net = __importStar(require("net"));
const events_1 = require("events");
const vscode = __importStar(require("vscode"));
const constants_1 = require("./constants");
const authHandler_1 = require("./authHandler");
/**
 * Manages peer-to-peer network communication for ChattyMcChatface
 * Handles UDP discovery broadcasts and TCP connections
 */
class NetworkManager extends events_1.EventEmitter {
    /**
     * Create a new NetworkManager
     */
    constructor() {
        super();
        /** UDP socket for broadcasts */
        this.udpSocket = null;
        /** TCP server for incoming connections */
        this.tcpServer = null;
        /** Active TCP socket connection to peer */
        this.peerConnection = null;
        /** Interval ID for periodic broadcasts */
        this.broadcastIntervalId = null;
        /** Connected peer information */
        this.connectedPeer = null;
        /** Whether this instance is currently connecting to a peer */
        this.isConnecting = false;
        /** Authentication handler for the current connection */
        this.authHandler = null;
        /** Whether the current connection is authenticated */
        this.isAuthenticated = false;
        /** Buffer for received data that might be partial messages */
        this.dataBuffer = '';
        // Generate a random instance ID
        this.instanceId = Math.random().toString(36).substring(2, 15);
        this.outputChannel = vscode.window.createOutputChannel('ChattyMcChatface Network');
        this.log('NetworkManager initialized with ID: ' + this.instanceId);
    }
    /**
     * Log a message to the output channel
     */
    log(message) {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[${timestamp}] ${message}`);
    }
    /**
     * Start UDP broadcasting and listening
     */
    startDiscovery() {
        if (this.udpSocket) {
            this.log('Discovery already running');
            return;
        }
        try {
            // Create UDP socket
            this.udpSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
            // Set up error handler
            this.udpSocket.on('error', (err) => {
                this.log(`UDP socket error: ${err.message}`);
                this.stopDiscovery();
            });
            // Set up message handler
            this.udpSocket.on('message', (msg, rinfo) => {
                try {
                    this.handleDiscoveryMessage(msg, rinfo);
                }
                catch (err) {
                    this.log(`Error handling discovery message: ${err}`);
                }
            });
            // Bind socket and start broadcasting
            this.udpSocket.bind(constants_1.NETWORK.DISCOVERY_PORT, () => {
                if (!this.udpSocket)
                    return;
                // Enable broadcasting
                this.udpSocket.setBroadcast(true);
                this.log(`UDP discovery listening on port ${constants_1.NETWORK.DISCOVERY_PORT}`);
                // Start periodic broadcasts
                this.broadcastIntervalId = setInterval(() => {
                    this.sendDiscoveryBroadcast();
                }, constants_1.NETWORK.BROADCAST_INTERVAL);
                // Send initial broadcast
                this.sendDiscoveryBroadcast();
            });
        }
        catch (err) {
            this.log(`Failed to start discovery: ${err}`);
        }
    }
    /**
     * Send a UDP discovery broadcast
     */
    sendDiscoveryBroadcast() {
        if (!this.udpSocket)
            return;
        try {
            // Create discovery message
            const message = {
                type: constants_1.NETWORK.BROADCAST_TYPES.DISCOVER,
                version: constants_1.PROTOCOL_VERSION,
                port: constants_1.NETWORK.CHAT_PORT,
                instanceId: this.instanceId
            };
            // Convert to JSON and send as buffer
            const messageBuffer = Buffer.from(JSON.stringify(message));
            this.udpSocket.send(messageBuffer, 0, messageBuffer.length, constants_1.NETWORK.DISCOVERY_PORT, constants_1.NETWORK.BROADCAST_ADDRESS, (err) => {
                if (err) {
                    this.log(`Error sending discovery broadcast: ${err.message}`);
                }
                else {
                    this.log('Sent discovery broadcast');
                }
            });
        }
        catch (err) {
            this.log(`Failed to send discovery broadcast: ${err}`);
        }
    }
    /**
     * Handle an incoming discovery message
     */
    handleDiscoveryMessage(message, rinfo) {
        // Ignore our own broadcasts (same instance ID)
        try {
            const parsedMessage = JSON.parse(message.toString());
            if (parsedMessage.instanceId === this.instanceId) {
                // This is our own broadcast, ignore it
                return;
            }
            // Log the received message
            this.log(`Received discovery message from ${rinfo.address}:${rinfo.port} - ${message.toString()}`);
            if (parsedMessage.type === constants_1.NETWORK.BROADCAST_TYPES.DISCOVER) {
                // Respond to discovery request
                this.sendAnnouncementTo(rinfo.address);
            }
            else if (parsedMessage.type === constants_1.NETWORK.BROADCAST_TYPES.ANNOUNCE) {
                // Process peer announcement
                const peer = {
                    ip: rinfo.address,
                    port: parsedMessage.port,
                    instanceId: parsedMessage.instanceId
                };
                // Emit peer discovered event
                this.emit('peerDiscovered', peer);
                // Attempt to connect if not already connected or connecting
                if (!this.peerConnection && !this.isConnecting) {
                    this.connectToPeer(peer);
                }
            }
        }
        catch (err) {
            this.log(`Error parsing discovery message: ${err}`);
        }
    }
    /**
     * Send an announcement directly to a specific IP
     */
    sendAnnouncementTo(ip) {
        if (!this.udpSocket)
            return;
        try {
            // Create announcement message
            const message = {
                type: constants_1.NETWORK.BROADCAST_TYPES.ANNOUNCE,
                version: constants_1.PROTOCOL_VERSION,
                port: constants_1.NETWORK.CHAT_PORT,
                instanceId: this.instanceId
            };
            // Convert to JSON and send as buffer
            const messageBuffer = Buffer.from(JSON.stringify(message));
            this.udpSocket.send(messageBuffer, 0, messageBuffer.length, constants_1.NETWORK.DISCOVERY_PORT, ip, (err) => {
                if (err) {
                    this.log(`Error sending announcement to ${ip}: ${err.message}`);
                }
                else {
                    this.log(`Sent announcement to ${ip}`);
                }
            });
        }
        catch (err) {
            this.log(`Failed to send announcement: ${err}`);
        }
    }
    /**
     * Stop UDP broadcasting and listening
     */
    stopDiscovery() {
        // Clear the broadcast interval
        if (this.broadcastIntervalId) {
            clearInterval(this.broadcastIntervalId);
            this.broadcastIntervalId = null;
        }
        // Close the UDP socket
        if (this.udpSocket) {
            this.udpSocket.close();
            this.udpSocket = null;
            this.log('UDP discovery stopped');
        }
    }
    /**
     * Start TCP server to listen for incoming connections
     */
    startTcpServer() {
        if (this.tcpServer) {
            this.log('TCP server already running');
            return;
        }
        try {
            // Create TCP server
            this.tcpServer = net.createServer((socket) => {
                this.handleIncomingConnection(socket);
            });
            // Handle server errors
            this.tcpServer.on('error', (err) => {
                this.log(`TCP server error: ${err.message}`);
                this.stopTcpServer();
            });
            // Start listening
            this.tcpServer.listen(constants_1.NETWORK.CHAT_PORT, () => {
                this.log(`TCP server listening on port ${constants_1.NETWORK.CHAT_PORT}`);
            });
        }
        catch (err) {
            this.log(`Failed to start TCP server: ${err}`);
        }
    }
    /**
     * Handle an incoming TCP connection
     */
    handleIncomingConnection(socket) {
        const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`;
        // If we already have a connection, reject this one
        if (this.peerConnection) {
            this.log(`Rejecting connection from ${remoteAddress} as we already have a connection`);
            socket.end();
            return;
        }
        this.log(`Accepted connection from ${remoteAddress}`);
        // Set up socket event handlers
        this.setupSocketEventHandlers(socket);
        // Store the connection
        this.peerConnection = socket;
        // Create auth handler as server (not initiator)
        this.setupAuthHandler(socket, false);
        // Emit connection event (raw connection, not yet authenticated)
        this.emit('rawConnected', { ip: socket.remoteAddress, port: socket.remotePort });
    }
    /**
     * Stop the TCP server
     */
    stopTcpServer() {
        if (this.tcpServer) {
            this.tcpServer.close();
            this.tcpServer = null;
            this.log('TCP server stopped');
        }
    }
    /**
     * Connect to a discovered peer
     */
    connectToPeer(peer) {
        if (this.peerConnection || this.isConnecting) {
            this.log(`Already connected or connecting to a peer, ignoring connection to ${peer.ip}:${peer.port}`);
            return;
        }
        this.log(`Connecting to peer at ${peer.ip}:${peer.port}`);
        this.isConnecting = true;
        try {
            // Create socket
            const socket = new net.Socket();
            // Set timeout (5 seconds)
            socket.setTimeout(5000);
            // Handle timeout
            socket.on('timeout', () => {
                this.log(`Connection to ${peer.ip}:${peer.port} timed out`);
                socket.destroy();
                this.isConnecting = false;
            });
            // Handle connection
            socket.on('connect', () => {
                this.log(`Connected to peer at ${peer.ip}:${peer.port}`);
                this.isConnecting = false;
                this.peerConnection = socket;
                this.connectedPeer = peer;
                // Create auth handler as client (initiator)
                this.setupAuthHandler(socket, true);
                // Emit raw connection event (not yet authenticated)
                this.emit('rawConnected', peer);
            });
            // Handle errors
            socket.on('error', (err) => {
                this.log(`Error connecting to peer at ${peer.ip}:${peer.port}: ${err.message}`);
                this.isConnecting = false;
            });
            // Set up other event handlers
            this.setupSocketEventHandlers(socket);
            // Connect to peer
            socket.connect(peer.port, peer.ip);
        }
        catch (err) {
            this.log(`Failed to connect to peer at ${peer.ip}:${peer.port}: ${err}`);
            this.isConnecting = false;
        }
    }
    /**
     * Setup authentication handler for a new connection
     */
    setupAuthHandler(socket, isInitiator) {
        // Clear existing authentication state
        this.isAuthenticated = false;
        // Create new auth handler
        this.authHandler = new authHandler_1.AuthHandler((message) => this.sendRawMessage(message), this.outputChannel, isInitiator);
        // Set up auth event handlers
        this.authHandler.on('authSucceeded', () => {
            this.isAuthenticated = true;
            this.log('Authentication successful');
            // Now emit the fully connected event since we're authenticated
            if (this.connectedPeer) {
                this.emit('connected', this.connectedPeer);
            }
            else if (socket.remoteAddress) {
                this.emit('connected', {
                    ip: socket.remoteAddress,
                    port: socket.remotePort,
                    instanceId: 'unknown' // We don't know the instance ID for incoming connections
                });
            }
        });
        this.authHandler.on('authFailed', (reason) => {
            this.log(`Authentication failed: ${reason}`);
            this.emit('authFailed', reason);
            // Close the connection on auth failure
            if (this.peerConnection === socket) {
                this.log('Closing connection due to authentication failure');
                socket.end();
                this.peerConnection = null;
                this.connectedPeer = null;
            }
        });
        // Start the authentication process
        this.authHandler.startAuthentication();
    }
    /**
     * Send a raw message to the connected peer without checking authentication
     */
    sendRawMessage(message) {
        if (!this.peerConnection) {
            this.log('Cannot send raw message: Not connected to a peer');
            return false;
        }
        try {
            this.peerConnection.write(message);
            this.log(`Sent raw message to peer: ${message}`);
            return true;
        }
        catch (err) {
            this.log(`Error sending raw message: ${err}`);
            return false;
        }
    }
    /**
     * Set up event handlers for a socket
     */
    setupSocketEventHandlers(socket) {
        // Handle data received
        socket.on('data', (data) => {
            const dataStr = data.toString();
            this.log(`Received data from peer: ${dataStr}`);
            // Add to buffer
            this.dataBuffer += dataStr;
            // Process complete messages
            this.processDataBuffer();
        });
        // Handle connection closed
        socket.on('close', (hadError) => {
            const wasConnected = this.peerConnection === socket;
            this.log(`Connection closed${hadError ? ' with error' : ''}`);
            if (wasConnected) {
                // Clean up
                this.peerConnection = null;
                this.connectedPeer = null;
                this.isAuthenticated = false;
                this.dataBuffer = '';
                // Cancel authentication if in progress
                if (this.authHandler && this.authHandler.isAuthenticating()) {
                    this.authHandler.cancelAuthentication();
                }
                this.authHandler = null;
                // Emit disconnected event
                this.emit('disconnected', hadError);
            }
        });
        // Handle errors
        socket.on('error', (err) => {
            this.log(`Socket error: ${err.message}`);
        });
    }
    /**
     * Process the data buffer to extract complete messages
     */
    processDataBuffer() {
        // Simple approach: look for complete JSON objects
        // This assumes each message is a complete JSON and separated by newlines
        // A more robust approach would use a proper message framing protocol
        const messages = this.dataBuffer.split('\n');
        // Keep the last (potentially incomplete) message in the buffer
        this.dataBuffer = messages.pop() || '';
        // Process complete messages
        for (const message of messages) {
            if (!message.trim()) {
                continue; // Skip empty messages
            }
            this.handleMessage(message);
        }
    }
    /**
     * Handle a complete message
     */
    handleMessage(message) {
        // First, try to handle it as an auth message
        if (this.authHandler && this.authHandler.handleMessage(message)) {
            // Message was handled by auth handler
            return;
        }
        // If we're not authenticated, drop the message
        if (!this.isAuthenticated) {
            this.log('Dropping message: Not authenticated');
            return;
        }
        // Message is for the main application
        this.emit('data', message);
    }
    /**
     * Send a message to the connected peer
     * Only works if authenticated
     */
    sendMessage(message) {
        if (!this.peerConnection) {
            this.log('Cannot send message: Not connected to a peer');
            return false;
        }
        if (!this.isAuthenticated) {
            this.log('Cannot send message: Not authenticated');
            return false;
        }
        try {
            // Ensure message ends with newline for message framing
            if (!message.endsWith('\n')) {
                message += '\n';
            }
            this.peerConnection.write(message);
            this.log(`Sent message to peer: ${message}`);
            return true;
        }
        catch (err) {
            this.log(`Error sending message: ${err}`);
            return false;
        }
    }
    /**
     * Stop all network activity
     */
    stop() {
        // Stop discovery
        this.stopDiscovery();
        // Stop TCP server
        this.stopTcpServer();
        // Close peer connection
        if (this.peerConnection) {
            this.peerConnection.end();
            this.peerConnection = null;
        }
        // Clean up auth handler
        if (this.authHandler) {
            this.authHandler.cancelAuthentication();
            this.authHandler = null;
        }
        this.isAuthenticated = false;
        this.dataBuffer = '';
        this.log('Network manager stopped');
    }
    /**
     * Start all network activity
     */
    start() {
        this.startTcpServer();
        this.startDiscovery();
        this.log('Network manager started');
    }
}
exports.NetworkManager = NetworkManager;
//# sourceMappingURL=networkManager.js.map