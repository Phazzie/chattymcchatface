import * as net from 'net';
import { IConnectionHandler, IAuthService, ILogger } from '../interfaces';
import { ConnectionHandlerImpl } from './ConnectionHandlerImpl';
import { IMessageHandler } from './interfaces/IMessageHandler';

/**
 * Factory function type for creating ConnectionHandler instances.
 */
export type ConnectionHandlerFactory = (
    socket: net.Socket,
    logger: ILogger,
    authService: IAuthService,
    messageHandler: IMessageHandler,
    isInitiator: boolean
) => IConnectionHandler;

/**
 * Creates ConnectionHandler instances.
 * @param socket The network socket for the connection
 * @param logger The logger instance
 * @param authService The authentication service
 * @param messageHandler The message handler for processing messages
 * @param isInitiator Whether this side initiated the connection
 * @returns A new ConnectionHandler instance
 */
export function createConnectionHandler(
    socket: net.Socket,
    logger: ILogger,
    authService: IAuthService,
    messageHandler: IMessageHandler,
    isInitiator: boolean
): IConnectionHandler {
    return new ConnectionHandlerImpl(socket, logger, authService, messageHandler, isInitiator);
}
