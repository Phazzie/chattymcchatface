import * as net from 'net';
import { IConnectionHandler, IAuthService, ILogger } from '../interfaces';
import { ConnectionHandlerImpl } from './ConnectionHandlerImpl';
import { IMessageHandler } from './interfaces/IMessageHandler';
import { IConnectionHandlerFactory } from './interfaces/IConnectionHandlerFactory';

/**
 * Factory for creating connection handlers.
 */
export class ConnectionHandlerFactoryImpl implements IConnectionHandlerFactory {
  /**
   * Creates a new ConnectionHandlerFactoryImpl.
   * @param messageHandler The message handler to use for new connections
   */
  constructor(private readonly messageHandler: IMessageHandler) {}
  
  /**
   * Creates a new connection handler.
   * @param socket The network socket for the connection
   * @param logger The logger instance
   * @param authService The authentication service
   * @param isInitiator Whether this side initiated the connection
   * @returns A new connection handler
   */
  public create(
    socket: net.Socket,
    logger: ILogger,
    authService: IAuthService,
    isInitiator: boolean
  ): IConnectionHandler {
    return new ConnectionHandlerImpl(
      socket,
      logger,
      authService,
      this.messageHandler,
      isInitiator
    );
  }
}
