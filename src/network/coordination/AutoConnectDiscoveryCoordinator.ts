import { IDiscoveryEvents } from '../interfaces/IDiscoveryEvents';
import { IActiveConnectionCoordinator } from '../interfaces/IActiveConnectionCoordinator';
import { DiscoveredPeer, ILogger } from '../../interfaces';

/**
 * Listens for discovered peers and triggers connection attempts via the
 * ActiveConnectionCoordinator if appropriate (e.g., not already connected
 * and not the local instance).
 */
export class AutoConnectDiscoveryCoordinator {
    constructor(
        private readonly discoveryEvents: IDiscoveryEvents,
        private readonly connectionCoordinator: IActiveConnectionCoordinator,
        private readonly logger: ILogger,
        private readonly ownInstanceId: string // Needed to prevent self-connection
    ) { }

    start(): void {
        this.logger.info('[DiscoveryCoordinator] Starting.');
        this.discoveryEvents.startListening();
        this.discoveryEvents.on('peerDiscovered', this.handlePeerDiscovered);
    }

    stop(): void {
        this.logger.info('[DiscoveryCoordinator] Stopping.');
        this.discoveryEvents.off('peerDiscovered', this.handlePeerDiscovered);
        this.discoveryEvents.stopListening();
    }

    // Use arrow function to preserve 'this' context for the listener
    private handlePeerDiscovered = (peer: DiscoveredPeer): void => {
        this.logger.debug(`[DiscoveryCoordinator] Noticed peer: ${peer.instanceId}`);

        // Ignore self
        if (peer.instanceId === this.ownInstanceId) {
            this.logger.debug('[DiscoveryCoordinator] Ignoring self.');
            return;
        }

        // Delegate connection attempt to the coordinator
        // The coordinator itself checks if it's busy.
        this.connectionCoordinator.initiateConnection(peer);
    };
}
