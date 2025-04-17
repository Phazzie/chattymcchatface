"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoConnectDiscoveryCoordinator = void 0;
/**
 * Listens for discovered peers and triggers connection attempts via the
 * ActiveConnectionCoordinator if appropriate (e.g., not already connected
 * and not the local instance).
 */
class AutoConnectDiscoveryCoordinator {
    constructor(discoveryEvents, connectionCoordinator, logger, ownInstanceId // Needed to prevent self-connection
    ) {
        this.discoveryEvents = discoveryEvents;
        this.connectionCoordinator = connectionCoordinator;
        this.logger = logger;
        this.ownInstanceId = ownInstanceId;
        // Use arrow function to preserve 'this' context for the listener
        this.handlePeerDiscovered = (peer) => {
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
    start() {
        this.logger.info('[DiscoveryCoordinator] Starting.');
        this.discoveryEvents.startListening();
        this.discoveryEvents.on('peerDiscovered', this.handlePeerDiscovered);
    }
    stop() {
        this.logger.info('[DiscoveryCoordinator] Stopping.');
        this.discoveryEvents.off('peerDiscovered', this.handlePeerDiscovered);
        this.discoveryEvents.stopListening();
    }
}
exports.AutoConnectDiscoveryCoordinator = AutoConnectDiscoveryCoordinator;
//# sourceMappingURL=AutoConnectDiscoveryCoordinator.js.map