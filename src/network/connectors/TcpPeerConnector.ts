import * as net from 'net';
import { EventEmitter } from 'events';
import { IPeerConnector } from '../interfaces/IPeerConnector';
import { ITcpClient, DiscoveredPeer, ILogger } from '../../interfaces';

/**
 * Uses an ITcpClient implementation to initiate outgoing TCP connections.
 * Emits results via events.
 */
export class TcpPeerConnector extends EventEmitter implements IPeerConnector {
    constructor(
        private readonly tcpClient: ITcpClient, // Inject the specific client impl
        private readonly logger: ILogger,
    ) {
        super();
        this.setupClientEventHandlers();
    }

    private setupClientEventHandlers(): void {
        // Forward events from the underlying ITcpClient
        this.tcpClient.on('connectionEstablished',
            (socket: net.Socket, peer: DiscoveredPeer) => {
                this.logger.info(`[TcpConnector] Forwarding connectionEstablished for ${peer.ip}`);
                this.emit('connectionEstablished', socket, peer);
            });

        this.tcpClient.on('connectionFailed',
            (peer: DiscoveredPeer, error: Error) => {
                this.logger.warn(`[TcpConnector] Forwarding connectionFailed for ${peer.ip}`);
                this.emit('connectionFailed', peer, error);
            });
    }

    connect(peer: DiscoveredPeer): void {
        this.logger.info(`[TcpConnector] Requesting TCP client to connect to ${peer.ip}:${peer.port}`);
        // Delegate connection attempt to the injected ITcpClient
        this.tcpClient.connect(peer);
    }

    // Ensure cleanup if this class manages resources (listeners)
    dispose(): void {
        this.tcpClient.removeAllListeners('connectionEstablished');
        this.tcpClient.removeAllListeners('connectionFailed');
        this.logger.info('[TcpConnector] Disposed listeners.');
    }
}
