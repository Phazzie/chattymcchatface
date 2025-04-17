import * as net from 'net';
import { IIncomingConnectionAcceptor } from '../interfaces/IIncomingConnectionAcceptor';
import { IActiveConnectionCoordinator } from '../interfaces/IActiveConnectionCoordinator';
import { ILogger } from '../../interfaces';

/**
 * Listens for incoming connections and passes them to the
 * ActiveConnectionCoordinator for potential handling.
 */
export class IncomingConnectionCoordinator {
    constructor(
        private readonly acceptor: IIncomingConnectionAcceptor,
        private readonly connectionCoordinator: IActiveConnectionCoordinator,
        private readonly logger: ILogger,
    ) { }

    start(): void {
        this.logger.info('[IncomingCoordinator] Starting.');
        this.acceptor.startListening();
        this.acceptor.on('incomingConnection', this.handleIncomingConnection);
    }

    stop(): void {
        this.logger.info('[IncomingCoordinator] Stopping.');
        this.acceptor.off('incomingConnection', this.handleIncomingConnection);
        this.acceptor.stopListening();
    }

    // Use arrow function to preserve 'this' context for the listener
    private handleIncomingConnection = (socket: net.Socket): void => {
        const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`;
        this.logger.debug(`[IncomingCoordinator] Noticed incoming connection from ${remoteAddress}`);

        // Delegate handling (including accept/reject logic) to the coordinator
        this.connectionCoordinator.registerIncomingConnection(socket);
    };
}
