"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionHandlerImpl = void 0;
const events_1 = require("events");
const uuid_1 = require("uuid");
const ConnectionMessageProcessor_1 = require("./ConnectionMessageProcessor");
const ConnectionEventHandler_1 = require("./ConnectionEventHandler");
/**
 * Handles a single network connection, managing message framing, authentication, and events.
 * Implements the IConnectionHandler interface for SOLID compliance.
 */
class ConnectionHandlerImpl extends events_1.EventEmitter {
    /**
     * Creates a new connection handler.
     * @param socket The network socket for the connection
     * @param logger The logger instance
     * @param authService The authentication service
     * @param messageHandler The message handler for processing messages
     * @param isInitiator Whether this side initiated the connection
     */
    constructor(socket, logger, authService, messageHandler, isInitiator) {
        super();
        this.isAuthenticatedValue = false;
        this.id = (0, uuid_1.v4)();
        this.socket = socket;
        this.logger = logger;
        this.authService = authService;
        this.messageHandler = messageHandler;
        // Create the message processor
        this.messageProcessor = new ConnectionMessageProcessor_1.ConnectionMessageProcessor(this.id, logger, authService, messageHandler, () => this.isAuthenticated);
        // Create the event handler
        this.eventHandler = new ConnectionEventHandler_1.ConnectionEventHandler(this.id, socket, logger, authService, messageHandler, this);
        // Set up data event handler
        this.socket.on('data', (data) => this.messageProcessor.processData(data));
        const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`;
        this.logger.info(`[ConnectionHandler] New connection handler ${this.id} created for ${remoteAddress}`);
    }
    get isAuthenticated() {
        return this.isAuthenticatedValue;
    }
    get remoteAddress() {
        return this.socket.remoteAddress;
    }
    /**
     * Starts the authentication process.
     */
    startAuthentication(isInitiator) {
        this.logger.info(`[ConnectionHandler] ${this.id}: Starting authentication as ${isInitiator ? 'initiator' : 'receiver'}`);
        this.authService.startAuthentication(this.id, isInitiator, (message) => this.socket.write(message));
    }
    /**
     * Sends a message over the connection.
     * @param message The message to send
     * @returns True if the message was sent successfully, false otherwise
     */
    sendMessage(message) {
        try {
            const serializedMessage = message.serialize();
            const messageWithNewline = serializedMessage.endsWith('\n') ? serializedMessage : serializedMessage + '\n';
            this.socket.write(messageWithNewline);
            this.logger.info(`[ConnectionHandler] ${this.id}: Sent message of type ${message.type}`);
            return true;
        }
        catch (err) {
            this.logger.error(`[ConnectionHandler] ${this.id}: Error sending message`, err);
            return false;
        }
    }
    /**
     * Closes the connection.
     */
    close(emitEvent = true) {
        this.logger.info(`[ConnectionHandler] ${this.id}: Connection closed`);
        this.authService.cleanupConnection(this.id);
        this.socket.end();
        if (emitEvent) {
            this.emit('disconnected', this.id, false);
        }
    }
}
exports.ConnectionHandlerImpl = ConnectionHandlerImpl;
//# sourceMappingURL=ConnectionHandlerImpl.js.map