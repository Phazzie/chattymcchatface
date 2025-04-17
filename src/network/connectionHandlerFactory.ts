import * as net from 'net';
import { IConnectionHandler, IAuthService, ILogger } from '../interfaces';
import { ConnectionHandler } from '../network/connectionHandler';

/**
 * Factory function type for creating ConnectionHandler instances.
 */
export type ConnectionHandlerFactory = (
    socket: net.Socket,
    logger: ILogger,
    authService: IAuthService,
    isInitiator: boolean
) => IConnectionHandler;

/**
 * Creates ConnectionHandler instances.
 * @param socket The network socket for the connection
 * @param logger The logger instance
 * @param authService The authentication service
 * @param isInitiator Whether this side initiated the connection
 * @returns A new ConnectionHandler instance
 */
export function createConnectionHandler(
    socket: net.Socket,
    logger: ILogger,
    authService: IAuthService,
    isInitiator: boolean
): IConnectionHandler {
    return new ConnectionHandler(socket, logger, authService, isInitiator);
}