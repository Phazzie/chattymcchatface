import { EventEmitter } from 'events';
import * as net from 'net';
import { ILogger, IAuthService } from '../interfaces';
import { IConnection } from './interfaces/IConnection';
import { IConnectionManager } from './interfaces/IConnectionManager';
import { IMessage } from './interfaces/IMessage';
import { IMessageHandler } from './interfaces/IMessageHandler';
import { ConnectionHandler } from './ConnectionHandler';

/**
 * Manages multiple network connections.
 * Implements the IConnectionManager interface for SOLID compliance.
 */
export class ConnectionManager extends EventEmitter implements IConnectionManager {
    private readonly connections: Map<string, IConnection> = new Map();
    
    /**
     * Creates a new ConnectionManager.
     * @param logger The logger instance
     * @param authService The authentication service
     * @param messageHandler The message handler for processing messages
     */
    constructor(
        private readonly logger: ILogger,
        private readonly authService: IAuthService,
        private readonly messageHandler: IMessageHandler
    ) {
        super();
        this.logger.info('[ConnectionManager] Initialized');
    }
    
    /**
     * Creates a new connection from a socket.
     * @param socket The socket to create a connection from
     * @param isInitiator Whether this side initiated the connection
     * @returns The created connection
     */
    public createConnection(socket: net.Socket, isInitiator: boolean): IConnection {
        const connection = new ConnectionHandler(
            socket,
            this.logger,
            this.authService,
            this.messageHandler,
            isInitiator
        );
        
        // Set up event listeners for the connection
        this.setupConnectionEventListeners(connection);
        
        // Store the connection
        this.connections.set(connection.id, connection);
        
        // Emit event
        this.emit('connectionAdded', connection.id, connection.remoteAddress);
        
        return connection;
    }
    
    /**
     * Gets a connection by its ID.
     * @param connectionId The ID of the connection to get
     * @returns The connection, or undefined if not found
     */
    public getConnection(connectionId: string): IConnection | undefined {
        return this.connections.get(connectionId);
    }
    
    /**
     * Gets all active connections.
     * @returns An array of all active connections
     */
    public getAllConnections(): IConnection[] {
        return Array.from(this.connections.values());
    }
    
    /**
     * Removes a connection.
     * @param connectionId The ID of the connection to remove
     * @returns True if the connection was removed, false if it wasn't found
     */
    public removeConnection(connectionId: string): boolean {
        const connection = this.connections.get(connectionId);
        if (!connection) {
            return false;
        }
        
        // Close the connection without emitting an event (we'll handle it here)
        connection.close(false);
        
        // Remove from the map
        this.connections.delete(connectionId);
        
        // Emit event
        this.emit('connectionRemoved', connectionId);
        
        this.logger.info(`[ConnectionManager] Removed connection ${connectionId}`);
        return true;
    }
    
    /**
     * Broadcasts a message to all authenticated connections.
     * @param message The message to broadcast
     * @param excludeConnectionId Optional connection ID to exclude from the broadcast
     * @returns The number of connections the message was sent to
     */
    public broadcastMessage(message: IMessage, excludeConnectionId?: string): number {
        let sentCount = 0;
        
        for (const [id, connection] of this.connections.entries()) {
            if (excludeConnectionId && id === excludeConnectionId) {
                continue;
            }
            
            if (connection.isAuthenticated) {
                if (connection.sendMessage(message)) {
                    sentCount++;
                }
            }
        }
        
        if (sentCount > 0) {
            this.logger.info(`[ConnectionManager] Broadcast message of type ${message.type} to ${sentCount} connections`);
        }
        
        return sentCount;
    }
    
    /**
     * Closes all connections.
     */
    public closeAll(): void {
        for (const connection of this.connections.values()) {
            connection.close(false);
        }
        
        const count = this.connections.size;
        this.connections.clear();
        
        this.logger.info(`[ConnectionManager] Closed all connections (${count})`);
    }
    
    /**
     * Sets up event listeners for a connection.
     * @param connection The connection to set up listeners for
     */
    private setupConnectionEventListeners(connection: IConnection): void {
        // Handle authentication events
        connection.on('authenticated', (connectionId) => {
            this.emit('connectionAuthenticated', connectionId);
            this.logger.info(`[ConnectionManager] Connection ${connectionId} authenticated`);
        });
        
        // Handle disconnection events
        connection.on('disconnected', (connectionId, hadError) => {
            this.connections.delete(connectionId);
            this.emit('connectionRemoved', connectionId);
            this.logger.info(`[ConnectionManager] Connection ${connectionId} disconnected${hadError ? ' with error' : ''}`);
        });
        
        // Forward message events
        connection.on('messageReceived', (connectionId, message) => {
            this.emit('messageReceived', connectionId, message);
        });
    }
}
