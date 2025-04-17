import * as net from 'net';
import { EventEmitter } from 'events';
import { ILogger, ITcpClient, DiscoveredPeer } from '../interfaces';
import { NETWORK } from '../constants';

/**
 * Handles TCP client logic for connecting to discovered peers.
 */
export class TcpClient extends EventEmitter implements ITcpClient {
    private readonly logger: ILogger;
    private socket: net.Socket | null = null;
    private isConnecting = false;
    private currentPeer: DiscoveredPeer | null = null;

    /**
     * Creates an instance of TcpClient.
     * @param logger The logger instance.
     */
    constructor(logger: ILogger) {
        super();
        this.logger = logger;
    }

    /**
     * Connects to a discovered peer.
     * @param peer The peer to connect to.
     */
    public connect(peer: DiscoveredPeer): void {
        if (this.socket || this.isConnecting) {
            this.logger.warn(`[TcpClient] Already connecting to a peer, ignoring connection to ${peer.ip}:${peer.port}`);
            return;
        }

        this.isConnecting = true;
        this.currentPeer = peer;
        this.logger.info(`[TcpClient] Connecting to ${peer.ip}:${peer.port}...`);

        try {
            this.socket = new net.Socket();
            this.socket.setTimeout(NETWORK.CONNECTION_TIMEOUT);

            this.setupSocketEventHandlers(peer);
            this.socket.connect(peer.port, peer.ip);
        } catch (err) {
            this.logger.error(`[TcpClient] Failed to create socket for connection to ${peer.ip}:${peer.port}`, err);
            this.cleanup();
            this.emit('connectionFailed', peer, err instanceof Error ? err : new Error(String(err)));
        }
    }

    /**
     * Disconnects from the current peer.
     */
    public disconnect(): void {
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
    private setupSocketEventHandlers(peer: DiscoveredPeer): void {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            this.isConnecting = false;
            this.logger.info(`[TcpClient] Connected to ${peer.ip}:${peer.port}`);
            this.emit('connectionEstablished', this.socket!, peer);
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
    private cleanup(): void {
        this.socket = null;
        this.isConnecting = false;
        this.currentPeer = null;
    }
}