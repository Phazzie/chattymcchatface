import * as net from 'net';
import { EventEmitter } from 'events';
import { ILogger, ITcpServer } from '../interfaces';
import { NETWORK } from '../constants';

/**
 * Handles the TCP server logic for accepting incoming peer connections.
 */
export class TcpServer extends EventEmitter implements ITcpServer {
    private readonly logger: ILogger;
    private tcpServer: net.Server | null = null;

    /**
     * Creates an instance of TcpServer.
     * @param logger The logger instance.
     */
    constructor(logger: ILogger) {
        super();
        this.logger = logger;
    }

    /**
     * Starts the TCP server and begins listening for connections.
     */
    public start(): void {
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

            this.tcpServer.listen(NETWORK.CHAT_PORT, () => {
                const address = this.tcpServer?.address();
                const port = typeof address === 'string' ? address : address?.port;
                this.logger.info(`[TcpServer] TCP server listening on port ${port || NETWORK.CHAT_PORT}`);
            });

        } catch (err) {
            this.logger.error('[TcpServer] Failed to create TCP server', err);
            this.tcpServer = null;
            this.emit('error', err); // Emit error if creation fails
        }
    }

    /**
     * Stops the TCP server.
     */
    public stop(): void {
        if (this.tcpServer) {
            this.tcpServer.close((err) => {
                if (err) {
                    this.logger.error('[TcpServer] Error closing TCP server', err);
                }
                // The 'close' event handler will set this.tcpServer to null
            });
        } else {
            // Optional: Log that stop was called but server wasn't running
            // this.logger.info('[TcpServer] Stop called but server was not running.');
        }
    }

    /**
     * Handles a new incoming connection.
     * @param socket The socket for the incoming connection.
     */
    private handleIncomingConnection(socket: net.Socket): void {
        const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`;
        this.logger.info(`[TcpServer] Incoming connection from ${remoteAddress}`);
        this.emit('incomingConnection', socket);
    }
}
