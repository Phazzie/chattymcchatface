import * as dgram from 'dgram';
import * as net from 'net';
import * as os from 'os';
import { EventEmitter } from 'events';
import * as vscode from 'vscode';
import { NETWORK, DiscoveryMessage, PROTOCOL_VERSION, AUTH, AuthMessage } from './constants';
import { AuthHandler } from './authHandler';

/**
 * Describes a discovered peer
 */
export interface DiscoveredPeer {
  /** IP address of the peer */
  ip: string;
  /** TCP port the peer is listening on */
  port: number;
  /** Unique ID of the peer */
  instanceId: string;
}

/**
 * Manages peer-to-peer network communication for ChattyMcChatface
 * Handles UDP discovery broadcasts and TCP connections
 */
export class NetworkManager extends EventEmitter {
  /** UDP socket for broadcasts */
  private udpSocket: dgram.Socket | null = null;

  /** TCP server for incoming connections */
  private tcpServer: net.Server | null = null;

  /** Active TCP socket connection to peer */
  private peerConnection: net.Socket | null = null;

  /** Interval ID for periodic broadcasts */
  private broadcastIntervalId: NodeJS.Timeout | null = null;

  /** Unique identifier for this instance */
  private readonly instanceId: string;

  /** Connected peer information */
  private connectedPeer: DiscoveredPeer | null = null;

  /** Output channel for logging */
  private outputChannel: vscode.OutputChannel;

  /** Whether this instance is currently connecting to a peer */
  private isConnecting = false;

  /** Authentication handler for the current connection */
  private authHandler: AuthHandler | null = null;

  /** Whether the current connection is authenticated */
  private isAuthenticated = false;

  /** Buffer for received data that might be partial messages */
  private dataBuffer = '';

  /**
   * Create a new NetworkManager
   */
  constructor() {
    super();
    // Generate a random instance ID
    this.instanceId = Math.random().toString(36).substring(2, 15);
    this.outputChannel = vscode.window.createOutputChannel('ChattyMcChatface Network');
    this.log('NetworkManager initialized with ID: ' + this.instanceId);
  }

  /**
   * Log a message to the output channel
   */
  private log(message: string): void {
    const timestamp = new Date().toISOString();
    this.outputChannel.appendLine(`[${timestamp}] ${message}`);
  }

  /**
   * Start UDP broadcasting and listening
   */
  public startDiscovery(): void {
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
        } catch (err) {
          this.log(`Error handling discovery message: ${err}`);
        }
      });

      // Bind socket and start broadcasting
      this.udpSocket.bind(NETWORK.DISCOVERY_PORT, () => {
        if (!this.udpSocket) return;

        // Enable broadcasting
        this.udpSocket.setBroadcast(true);
        this.log(`UDP discovery listening on port ${NETWORK.DISCOVERY_PORT}`);

        // Start periodic broadcasts
        this.broadcastIntervalId = setInterval(() => {
          this.sendDiscoveryBroadcast();
        }, NETWORK.BROADCAST_INTERVAL);

        // Send initial broadcast
        this.sendDiscoveryBroadcast();
      });
    } catch (err) {
      this.log(`Failed to start discovery: ${err}`);
    }
  }

  /**
   * Send a UDP discovery broadcast
   */
  private sendDiscoveryBroadcast(): void {
    if (!this.udpSocket) return;

    try {
      // Create discovery message
      const message: DiscoveryMessage = {
        type: NETWORK.BROADCAST_TYPES.DISCOVER,
        version: PROTOCOL_VERSION,
        port: NETWORK.CHAT_PORT,
        instanceId: this.instanceId
      };

      // Convert to JSON and send as buffer
      const messageBuffer = Buffer.from(JSON.stringify(message));

      this.udpSocket.send(
        messageBuffer,
        0,
        messageBuffer.length,
        NETWORK.DISCOVERY_PORT,
        NETWORK.BROADCAST_ADDRESS,
        (err) => {
          if (err) {
            this.log(`Error sending discovery broadcast: ${err.message}`);
          } else {
            this.log('Sent discovery broadcast');
          }
        }
      );
    } catch (err) {
      this.log(`Failed to send discovery broadcast: ${err}`);
    }
  }

  /**
   * Handle an incoming discovery message
   */
  private handleDiscoveryMessage(message: Buffer, rinfo: dgram.RemoteInfo): void {
    // Ignore our own broadcasts (same instance ID)
    try {
      const parsedMessage = JSON.parse(message.toString()) as DiscoveryMessage;

      if (parsedMessage.instanceId === this.instanceId) {
        // This is our own broadcast, ignore it
        return;
      }

      // Log the received message
      this.log(`Received discovery message from ${rinfo.address}:${rinfo.port} - ${message.toString()}`);

      if (parsedMessage.type === NETWORK.BROADCAST_TYPES.DISCOVER) {
        // Respond to discovery request
        this.sendAnnouncementTo(rinfo.address);
      } else if (parsedMessage.type === NETWORK.BROADCAST_TYPES.ANNOUNCE) {
        // Process peer announcement
        const peer: DiscoveredPeer = {
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
    } catch (err) {
      this.log(`Error parsing discovery message: ${err}`);
    }
  }

  /**
   * Send an announcement directly to a specific IP
   */
  private sendAnnouncementTo(ip: string): void {
    if (!this.udpSocket) return;

    try {
      // Create announcement message
      const message: DiscoveryMessage = {
        type: NETWORK.BROADCAST_TYPES.ANNOUNCE,
        version: PROTOCOL_VERSION,
        port: NETWORK.CHAT_PORT,
        instanceId: this.instanceId
      };

      // Convert to JSON and send as buffer
      const messageBuffer = Buffer.from(JSON.stringify(message));

      this.udpSocket.send(
        messageBuffer,
        0,
        messageBuffer.length,
        NETWORK.DISCOVERY_PORT,
        ip,
        (err) => {
          if (err) {
            this.log(`Error sending announcement to ${ip}: ${err.message}`);
          } else {
            this.log(`Sent announcement to ${ip}`);
          }
        }
      );
    } catch (err) {
      this.log(`Failed to send announcement: ${err}`);
    }
  }

  /**
   * Stop UDP broadcasting and listening
   */
  public stopDiscovery(): void {
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
  public startTcpServer(): void {
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
      this.tcpServer.listen(NETWORK.CHAT_PORT, () => {
        this.log(`TCP server listening on port ${NETWORK.CHAT_PORT}`);
      });
    } catch (err) {
      this.log(`Failed to start TCP server: ${err}`);
    }
  }

  /**
   * Handle an incoming TCP connection
   */
  private handleIncomingConnection(socket: net.Socket): void {
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
  public stopTcpServer(): void {
    if (this.tcpServer) {
      this.tcpServer.close();
      this.tcpServer = null;
      this.log('TCP server stopped');
    }
  }

  /**
   * Connect to a discovered peer
   */
  public connectToPeer(peer: DiscoveredPeer): void {
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
    } catch (err) {
      this.log(`Failed to connect to peer at ${peer.ip}:${peer.port}: ${err}`);
      this.isConnecting = false;
    }
  }

  /**
   * Setup authentication handler for a new connection
   */
  private setupAuthHandler(socket: net.Socket, isInitiator: boolean): void {
    // Clear existing authentication state
    this.isAuthenticated = false;

    // Create new auth handler
    this.authHandler = new AuthHandler(
      (message) => this.sendRawMessage(message),
      this.outputChannel,
      isInitiator
    );

    // Set up auth event handlers
    this.authHandler.on('authSucceeded', () => {
      this.isAuthenticated = true;
      this.log('Authentication successful');

      // Now emit the fully connected event since we're authenticated
      if (this.connectedPeer) {
        this.emit('connected', this.connectedPeer);
      } else if (socket.remoteAddress) {
        this.emit('connected', {
          ip: socket.remoteAddress,
          port: socket.remotePort,
          instanceId: 'unknown'  // We don't know the instance ID for incoming connections
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
  private sendRawMessage(message: string): boolean {
    if (!this.peerConnection) {
      this.log('Cannot send raw message: Not connected to a peer');
      return false;
    }

    try {
      this.peerConnection.write(message);
      this.log(`Sent raw message to peer: ${message}`);
      return true;
    } catch (err) {
      this.log(`Error sending raw message: ${err}`);
      return false;
    }
  }

  /**
   * Set up event handlers for a socket
   */
  private setupSocketEventHandlers(socket: net.Socket): void {
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
  private processDataBuffer(): void {
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
  private handleMessage(message: string): void {
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
  public sendMessage(message: string): boolean {
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
    } catch (err) {
      this.log(`Error sending message: ${err}`);
      return false;
    }
  }

  /**
   * Stop all network activity
   */
  public stop(): void {
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
  public start(): void {
    this.startTcpServer();
    this.startDiscovery();
    this.log('Network manager started');
  }
}