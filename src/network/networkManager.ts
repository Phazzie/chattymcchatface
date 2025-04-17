import { EventEmitter } from 'events';
import * as net from 'net';
import {
    ILogger,
    INetworkManager,
    IUdpDiscovery,
    ITcpServer,
    ITcpClient,
    IAuthService,
    IConnectionHandler,
    DiscoveredPeer
} from '../interfaces';
import { ConnectionHandler } from './connectionHandler';

/**
 * Type for a factory function that creates connection handlers.
 */
type ConnectionHandlerFactory = (
    socket: net.Socket,
    logger: ILogger,
    authService: IAuthService,
    isInitiator: boolean
) => IConnectionHandler;

/**
 * Orchestrates the network components (discovery, server, client, connection handling).
 */
export class NetworkManager extends EventEmitter implements INetworkManager {
    private readonly logger: ILogger;
    private readonly udpDiscovery: IUdpDiscovery;
    private readonly tcpServer: ITcpServer;
    private readonly tcpClient: ITcpClient;
    private readonly authService: IAuthService;
    private readonly instanceId: string;
    private readonly connectionHandlerFactory: ConnectionHandlerFactory;

    private connectionHandler: IConnectionHandler | null = null;
    private connectedPeer: DiscoveredPeer | null = null;
    private isConnecting = false;

    constructor(
        logger: ILogger,
        udpDiscovery: IUdpDiscovery,
        tcpServer: ITcpServer,
        tcpClient: ITcpClient,
        authService: IAuthService,
        instanceId: string,
        connectionHandlerFactory?: ConnectionHandlerFactory
    ) {
        super();
        this.logger = logger;
        this.udpDiscovery = udpDiscovery;
        this.tcpServer = tcpServer;
        this.tcpClient = tcpClient;
        this.authService = authService;
        this.instanceId = instanceId;

        // Use provided factory or default implementation
        this.connectionHandlerFactory = connectionHandlerFactory ||
            ((socket, logger, authService, isInitiator) =>
                new ConnectionHandler(socket, logger, authService, isInitiator));

        this.setupEventHandlers();
    }

    /**
     * Starts the network discovery and server.
     */
    public start(): void {
        this.tcpServer.start();
        this.udpDiscovery.start();
        this.logger.info('[NetworkManager] Started network services');
    }

    /**
     * Stops all network activity.
     */
    public stop(): void {
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
    public sendMessage(message: string): boolean {
        if (!this.connectionHandler || !this.connectionHandler.isAuthenticated) {
            this.logger.warn('[NetworkManager] Cannot send message: Not connected or not authenticated');
            return false;
        }

        return this.connectionHandler.sendMessage(message);
    }

    private setupEventHandlers(): void {
        // UDP Discovery events
        this.udpDiscovery.on('peerDiscovered', this.handlePeerDiscovered.bind(this));

        // TCP Server events
        this.tcpServer.on('incomingConnection', this.handleIncomingConnection.bind(this));

        // TCP Client events
        this.tcpClient.on('connectionEstablished', this.handleConnectionEstablished.bind(this));
        this.tcpClient.on('connectionFailed', this.handleConnectionFailed.bind(this));
    }

    private handlePeerDiscovered(peer: DiscoveredPeer): void {
        this.emit('peerDiscovered', peer);

        // Automatically attempt to connect if not already connected/connecting
        if (!this.connectionHandler && !this.isConnecting) {
            this.connectToPeer(peer);
        }
    }

    private connectToPeer(peer: DiscoveredPeer): void {
        this.isConnecting = true;
        this.connectedPeer = peer;
        this.tcpClient.connect(peer);
    }

    private handleIncomingConnection(socket: net.Socket): void {
        if (this.connectionHandler) {
            this.logger.warn('[NetworkManager] Rejecting incoming connection: Already connected');
            socket.end();
            return;
        }

        this.setupConnection(socket, false);
    }

    private handleConnectionEstablished(socket: net.Socket, peer: DiscoveredPeer): void {
        this.isConnecting = false;
        this.connectedPeer = peer;
        this.setupConnection(socket, true);
    }

    private handleConnectionFailed(peer: DiscoveredPeer, error: Error): void {
        this.logger.warn(`[NetworkManager] Connection to ${peer.ip}:${peer.port} failed: ${error.message}`);
        this.isConnecting = false;
        this.connectedPeer = null;
    }

    private setupConnection(socket: net.Socket, isInitiator: boolean): void {
        this.connectionHandler = this.connectionHandlerFactory(
            socket,
            this.logger,
            this.authService,
            isInitiator
        );

        this.connectionHandler.on('authenticated', this.handleConnectionAuthenticated.bind(this));
        this.connectionHandler.on('authFailed', this.handleConnectionAuthFailed.bind(this));
        this.connectionHandler.on('disconnected', this.handleConnectionDisconnected.bind(this));
        this.connectionHandler.on('messageReceived', this.handleMessageReceived.bind(this));

        // Start authentication
        this.connectionHandler.startAuthentication(isInitiator);
    }

    private handleConnectionAuthenticated(connectionId: string): void {
        this.logger.info('[NetworkManager] Connection authenticated');
        if (this.connectedPeer) {
            this.emit('connected', this.connectedPeer);
        }
    }

    private handleConnectionAuthFailed(connectionId: string, reason: string): void {
        this.logger.warn(`[NetworkManager] Authentication failed: ${reason}`);
        this.emit('authFailed', reason);

        // Clean up the failed connection
        this.connectionHandler = null;
        this.connectedPeer = null;
    }

    private handleConnectionDisconnected(connectionId: string, hadError: boolean): void {
        this.logger.info(`[NetworkManager] Connection disconnected${hadError ? ' with error' : ''}`);
        this.connectionHandler = null;
        this.connectedPeer = null;
        this.emit('disconnected', hadError ? 'Connection error' : undefined);
    }

    private handleMessageReceived(connectionId: string, message: any): void {
        this.emit('messageReceived', message);
    }
}