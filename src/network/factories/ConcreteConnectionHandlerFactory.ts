import * as net from 'net';
import { IConnectionHandlerFactory } from '../interfaces/IConnectionHandlerFactory';
import { ILogger, IAuthService, IConnectionHandler } from '../../interfaces';
import { ConnectionHandler } from '../../connectionHandler'; // The CONCRETE implementation

/**
 * Default factory for creating ConnectionHandler instances.
 */
export class ConcreteConnectionHandlerFactory implements IConnectionHandlerFactory {
    create(
        socket: net.Socket,
        logger: ILogger,
        authService: IAuthService,
        isInitiator: boolean
    ): IConnectionHandler {
        // Directly instantiates the known concrete ConnectionHandler
        return new ConnectionHandler(socket, logger, authService, isInitiator);
    }
}
