import * as net from 'net';
import { ILogger, IAuthService, IConnectionHandler } from '../../interfaces';

/**
 * Defines the contract for creating connection handler instances.
 * This abstracts the instantiation of connection handlers.
 */
export interface IConnectionHandlerFactory {
    create(
        socket: net.Socket,
        logger: ILogger,
        authService: IAuthService,
        isInitiator: boolean
    ): IConnectionHandler;
}
