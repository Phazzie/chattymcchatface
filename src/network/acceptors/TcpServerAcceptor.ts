import * as net from 'net';
import { EventEmitter } from 'events';
import { IIncomingConnectionAcceptor } from '../interfaces/IIncomingConnectionAcceptor';
import { ITcpServer, ILogger } from '../../interfaces';

/**
 * Listens for incoming connections on an ITcpServer and emits an event.
 */
export class TcpServerAcceptor extends EventEmitter implements IIncomingConnectionAcceptor {
    // Store the bound handler function for correct removal
    private boundHandler: (socket: net.Socket) => void;

    constructor(
        private readonly tcpServer: ITcpServer, // Inject the specific server impl
        private readonly logger: ILogger,
    ) {
        super();
        // Bind the handler method to ensure 'this' context is correct
        this.boundHandler = this.handleIncomingConnection.bind(this);
    }

    startListening(): void {
        this.logger.info('[TcpAcceptor] Starting to listen for server connections.');
        this.tcpServer.on('incomingConnection', this.boundHandler);
    }

    stopListening(): void {
        this.logger.info('[TcpAcceptor] Stopping listening for server connections.');
        this.tcpServer.off('incomingConnection', this.boundHandler);
    }

    private handleIncomingConnection(socket: net.Socket): void {
        const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`;
        this.logger.info(`[TcpAcceptor] Forwarding incoming connection from ${remoteAddress}`);
        this.emit('incomingConnection', socket); // Emit the raw socket
    }
}
