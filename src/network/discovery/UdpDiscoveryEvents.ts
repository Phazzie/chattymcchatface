import { EventEmitter } from 'events';
import { IDiscoveryEvents } from '../interfaces/IDiscoveryEvents';
import { IUdpDiscovery, DiscoveredPeer, ILogger } from '../../interfaces';

/**
 * Listens for peer discovery events on an IUdpDiscovery instance and emits them.
 */
export class UdpDiscoveryEvents extends EventEmitter implements IDiscoveryEvents {
    // Store the bound handler function for correct removal
    private boundHandler: (peer: DiscoveredPeer) => void;

    constructor(
        private readonly udpDiscovery: IUdpDiscovery, // Inject the specific discovery impl
        private readonly logger: ILogger,
    ) {
        super();
        this.boundHandler = this.handlePeerDiscovered.bind(this);
    }

    startListening(): void {
        this.logger.info('[DiscoveryEvents] Starting to listen for discovered peers.');
        this.udpDiscovery.on('peerDiscovered', this.boundHandler);
    }

    stopListening(): void {
        this.logger.info('[DiscoveryEvents] Stopping listening for discovered peers.');
        this.udpDiscovery.off('peerDiscovered', this.boundHandler);
    }

    private handlePeerDiscovered(peer: DiscoveredPeer): void {
        this.logger.debug(`[DiscoveryEvents] Forwarding discovered peer: ${peer.instanceId}`);
        this.emit('peerDiscovered', peer); // Emit the discovered peer info
    }
}
