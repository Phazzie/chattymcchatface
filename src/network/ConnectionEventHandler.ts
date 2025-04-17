import * as net from 'net';
import { EventEmitter } from 'events';
import { ILogger, IAuthService } from '../interfaces';
import { IMessageHandler } from './interfaces/IMessageHandler';

/**
 * Handles events for a connection.
 */
export class ConnectionEventHandler {
  /**
   * Creates a new ConnectionEventHandler.
   * @param connectionId The ID of the connection
   * @param socket The network socket
   * @param logger The logger instance
   * @param authService The authentication service
   * @param messageHandler The message handler
   * @param eventEmitter The event emitter to use for events
   */
  constructor(
    private readonly connectionId: string,
    private readonly socket: net.Socket,
    private readonly logger: ILogger,
    private readonly authService: IAuthService,
    private readonly messageHandler: IMessageHandler,
    private readonly eventEmitter: EventEmitter
  ) {
    this.setupSocketEventHandlers();
    this.setupAuthEventHandlers();
    this.setupMessageHandlerEventListeners();
  }
  
  /**
   * Sets up socket event handlers.
   */
  private setupSocketEventHandlers(): void {
    this.socket.on('error', (err) => {
      this.logger.error(`[ConnectionEventHandler] ${this.connectionId}: Socket error`, err);
      if (this.authService.isAuthenticating(this.connectionId)) {
        const reason = err.message || 'Socket error';
        this.authService.cancelAuthentication(this.connectionId, reason);
        this.eventEmitter.emit('authFailed', this.connectionId, reason);
      }
    });
    
    this.socket.on('close', (hadError) => {
      this.logger.info(
        `[ConnectionEventHandler] ${this.connectionId}: ` +
        `Socket closed ${hadError ? 'with error' : ''}`
      );
      this.eventEmitter.emit('disconnected', this.connectionId, hadError);
    });
  }
  
  /**
   * Sets up auth event handlers.
   */
  private setupAuthEventHandlers(): void {
    this.authService.on('authSucceeded', (connectionId) => {
      if (connectionId !== this.connectionId) return;
      this.logger.info(`[ConnectionEventHandler] ${this.connectionId}: Authentication successful`);
      this.eventEmitter.emit('authenticated', this.connectionId);
    });
    
    this.authService.on('authFailed', (connectionId, reason) => {
      if (connectionId !== this.connectionId) return;
      this.logger.warn(
        `[ConnectionEventHandler] ${this.connectionId}: Authentication failed: ${reason}`
      );
      this.eventEmitter.emit('authFailed', this.connectionId, reason);
    });
  }
  
  /**
   * Sets up message handler event listeners.
   */
  private setupMessageHandlerEventListeners(): void {
    this.messageHandler.on('messageHandled', (connectionId, message, success) => {
      if (connectionId !== this.connectionId) return;
      
      if (success) {
        this.eventEmitter.emit('messageReceived', this.connectionId, message);
      } else {
        this.logger.warn(
          `[ConnectionEventHandler] ${this.connectionId}: ` +
          `Message handler failed to process message of type ${message.type}`
        );
      }
    });
  }
}
