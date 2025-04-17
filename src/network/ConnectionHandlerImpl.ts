import * as net from 'net';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { ILogger, IAuthService } from '../interfaces';
import { IConnectionHandler } from './interfaces/IConnectionHandler';
import { IMessage } from './interfaces/IMessage';
import { IMessageHandler } from './interfaces/IMessageHandler';
import { ConnectionMessageProcessor } from './ConnectionMessageProcessor';
import { ConnectionEventHandler } from './ConnectionEventHandler';

/**
 * Handles a single network connection, managing message framing, authentication, and events.
 * Implements the IConnectionHandler interface for SOLID compliance.
 */
export class ConnectionHandlerImpl extends EventEmitter implements IConnectionHandler {
    public readonly id: string;
    private readonly socket: net.Socket;
    private readonly logger: ILogger;
    private readonly authService: IAuthService;
    private readonly messageHandler: IMessageHandler;
    private readonly messageProcessor: ConnectionMessageProcessor;
    private readonly eventHandler: ConnectionEventHandler;
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

        // Create the message processor
        this.messageProcessor = new ConnectionMessageProcessor(
            this.id,
            logger,
            authService,
            messageHandler,
            () => this.isAuthenticated
        );

        // Create the event handler
        this.eventHandler = new ConnectionEventHandler(
            this.id,
            socket,
            logger,
            authService,
            messageHandler,
            this
        );

        // Set up data event handler
        this.socket.on('data', (data) => this.messageProcessor.processData(data));

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

    // Event handlers are now managed by ConnectionEventHandler
    // Message processing is now managed by ConnectionMessageProcessor
}
