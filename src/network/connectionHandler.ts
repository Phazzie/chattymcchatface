import * as net from 'net';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { ILogger, IAuthService } from '../interfaces';
import { IConnection } from './interfaces/IConnection';
import { IMessage } from './interfaces/IMessage';
import { IMessageHandler } from './interfaces/IMessageHandler';
import { MessageFactory } from './messages/MessageFactory';

/**
 * Handles a single network connection, managing message framing, authentication, and events.
 * Implements the IConnection interface for SOLID compliance.
 */
export class ConnectionHandler extends EventEmitter implements IConnection {
    public readonly id: string;
    private readonly socket: net.Socket;
    private readonly logger: ILogger;
    private readonly authService: IAuthService;
    private readonly messageHandler: IMessageHandler;
    private dataBuffer: string = '';
    private isAuthenticatedValue: boolean = false;

    /**
     * Creates a new connection handler.
     * @param socket The network socket for the connection
     * @param logger The logger instance
     * @param authService The authentication service
     * @param messageHandler The message handler for processing messages
     * @param isInitiator Whether this side initiated the connection
     */
    constructor(
        socket: net.Socket,
        logger: ILogger,
        authService: IAuthService,
        messageHandler: IMessageHandler,
        isInitiator: boolean
    ) {
        super();
        this.id = uuidv4();
        this.socket = socket;
        this.logger = logger;
        this.authService = authService;
        this.messageHandler = messageHandler;

        // Set up socket event listeners
        this.setupSocketEventHandlers();

        // Set up auth event listeners
        this.setupAuthEventHandlers();

        // Set up message handler event listeners
        this.setupMessageHandlerEventListeners();

        const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`;
        this.logger.info(`[ConnectionHandler] New connection handler ${this.id} created for ${remoteAddress}`);
    }

    public get isAuthenticated(): boolean {
        return this.isAuthenticatedValue;
    }

    public get remoteAddress(): string | undefined {
        return this.socket.remoteAddress;
    }

    /**
     * Starts the authentication process.
     */
    public startAuthentication(isInitiator: boolean): void {
        this.logger.info(`[ConnectionHandler] ${this.id}: Starting authentication as ${isInitiator ? 'initiator' : 'receiver'}`);
        this.authService.startAuthentication(
            this.id,
            isInitiator,
            (message: string) => this.socket.write(message)
        );
    }

    /**
     * Handles data received from the socket.
     */
    public handleData(data: Buffer): void {
        this.dataBuffer += data.toString();
        this.processDataBuffer();
    }

    /**
     * Sends a message over the connection.
     * @param message The message to send
     * @returns True if the message was sent successfully, false otherwise
     */
    public sendMessage(message: IMessage): boolean {
        try {
            const serializedMessage = message.serialize();
            const messageWithNewline = serializedMessage.endsWith('\n') ? serializedMessage : serializedMessage + '\n';
            this.socket.write(messageWithNewline);
            this.logger.info(`[ConnectionHandler] ${this.id}: Sent message of type ${message.type}`);
            return true;
        } catch (err) {
            this.logger.error(`[ConnectionHandler] ${this.id}: Error sending message`, err);
            return false;
        }
    }

    /**
     * Closes the connection.
     */
    public close(emitEvent: boolean = true): void {
        this.logger.info(`[ConnectionHandler] ${this.id}: Connection closed`);
        this.authService.cleanupConnection(this.id);
        this.socket.end();

        if (emitEvent) {
            this.emit('disconnected', this.id, false);
        }
    }

    private setupSocketEventHandlers(): void {
        this.socket.on('data', (data) => this.handleData(data));

        this.socket.on('error', (err) => {
            this.logger.error(`[ConnectionHandler] ${this.id}: Socket error`, err);
            if (this.authService.isAuthenticating(this.id)) {
                const reason = err.message || 'Socket error';
                this.authService.cancelAuthentication(this.id, reason);
                this.emit('authFailed', this.id, reason);
            }
        });

        this.socket.on('close', (hadError) => {
            this.logger.info(`[ConnectionHandler] ${this.id}: Socket closed ${hadError ? 'with error' : ''}`);
            this.emit('disconnected', this.id, hadError);
        });
    }

    private setupAuthEventHandlers(): void {
        this.authService.on('authSucceeded', (connectionId) => {
            if (connectionId !== this.id) return;
            this.isAuthenticatedValue = true;
            this.logger.info(`[ConnectionHandler] ${this.id}: Authentication successful`);
            this.emit('authenticated', this.id);
        });

        this.authService.on('authFailed', (connectionId, reason) => {
            if (connectionId !== this.id) return;
            this.isAuthenticatedValue = false;
            this.logger.warn(`[ConnectionHandler] ${this.id}: Authentication failed: ${reason}`);
            this.emit('authFailed', this.id, reason);
        });
    }

    /**
     * Sets up event listeners for the message handler.
     */
    private setupMessageHandlerEventListeners(): void {
        this.messageHandler.on('messageHandled', (connectionId, message, success) => {
            if (connectionId !== this.id) return;

            if (success) {
                this.emit('messageReceived', this.id, message);
            } else {
                this.logger.warn(`[ConnectionHandler] ${this.id}: Message handler failed to process message of type ${message.type}`);
            }
        });
    }

    private processDataBuffer(): void {
        const messages = this.dataBuffer.split('\n');
        this.dataBuffer = messages.pop() || '';

        for (const messageStr of messages) {
            if (!messageStr.trim()) continue;

            try {
                // Try to create a message object from the serialized data
                const message = MessageFactory.fromSerialized(messageStr);

                if (!message) {
                    // If not a valid message format, try handling it as a legacy auth message
                    try {
                        const parsedJson = JSON.parse(messageStr);
                        if (this.authService.handleMessage(this.id, parsedJson)) {
                            continue; // Auth service handled it
                        }
                    } catch (parseErr) {
                        this.logger.error(`[ConnectionHandler] ${this.id}: Error parsing message as JSON: ${messageStr}`, parseErr);
                        continue;
                    }

                    this.logger.warn(`[ConnectionHandler] ${this.id}: Received invalid message format: ${messageStr}`);
                    continue;
                }

                // Handle the message based on authentication state
                if (this.isAuthenticatedValue) {
                    // Use the message handler for authenticated messages
                    this.messageHandler.handleMessage(this.id, message);
                } else {
                    this.logger.warn(`[ConnectionHandler] ${this.id}: Received message of type ${message.type} while not authenticated`);
                }
            } catch (err) {
                this.logger.error(`[ConnectionHandler] ${this.id}: Error processing message: ${messageStr}`, err);
            }
        }
    }
}
