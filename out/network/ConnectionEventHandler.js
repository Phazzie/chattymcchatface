"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionEventHandler = void 0;
/**
 * Handles events for a connection.
 */
class ConnectionEventHandler {
    /**
     * Creates a new ConnectionEventHandler.
     * @param connectionId The ID of the connection
     * @param socket The network socket
     * @param logger The logger instance
     * @param authService The authentication service
     * @param messageHandler The message handler
     * @param eventEmitter The event emitter to use for events
     */
    constructor(connectionId, socket, logger, authService, messageHandler, eventEmitter) {
        this.connectionId = connectionId;
        this.socket = socket;
        this.logger = logger;
        this.authService = authService;
        this.messageHandler = messageHandler;
        this.eventEmitter = eventEmitter;
        this.setupSocketEventHandlers();
        this.setupAuthEventHandlers();
        this.setupMessageHandlerEventListeners();
    }
    /**
     * Sets up socket event handlers.
     */
    setupSocketEventHandlers() {
        this.socket.on('error', (err) => {
            this.logger.error(`[ConnectionEventHandler] ${this.connectionId}: Socket error`, err);
            if (this.authService.isAuthenticating(this.connectionId)) {
                const reason = err.message || 'Socket error';
                this.authService.cancelAuthentication(this.connectionId, reason);
                this.eventEmitter.emit('authFailed', this.connectionId, reason);
            }
        });
        this.socket.on('close', (hadError) => {
            this.logger.info(`[ConnectionEventHandler] ${this.connectionId}: ` +
                `Socket closed ${hadError ? 'with error' : ''}`);
            this.eventEmitter.emit('disconnected', this.connectionId, hadError);
        });
    }
    /**
     * Sets up auth event handlers.
     */
    setupAuthEventHandlers() {
        this.authService.on('authSucceeded', (connectionId) => {
            if (connectionId !== this.connectionId)
                return;
            this.logger.info(`[ConnectionEventHandler] ${this.connectionId}: Authentication successful`);
            this.eventEmitter.emit('authenticated', this.connectionId);
        });
        this.authService.on('authFailed', (connectionId, reason) => {
            if (connectionId !== this.connectionId)
                return;
            this.logger.warn(`[ConnectionEventHandler] ${this.connectionId}: Authentication failed: ${reason}`);
            this.eventEmitter.emit('authFailed', this.connectionId, reason);
        });
    }
    /**
     * Sets up message handler event listeners.
     */
    setupMessageHandlerEventListeners() {
        this.messageHandler.on('messageHandled', (connectionId, message, success) => {
            if (connectionId !== this.connectionId)
                return;
            if (success) {
                this.eventEmitter.emit('messageReceived', this.connectionId, message);
            }
            else {
                this.logger.warn(`[ConnectionEventHandler] ${this.connectionId}: ` +
                    `Message handler failed to process message of type ${message.type}`);
            }
        });
    }
}
exports.ConnectionEventHandler = ConnectionEventHandler;
//# sourceMappingURL=ConnectionEventHandler.js.map