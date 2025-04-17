"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UdpDiscoveryEvents = void 0;
const events_1 = require("events");
/**
 * Listens for peer discovery events on an IUdpDiscovery instance and emits them.
 */
class UdpDiscoveryEvents extends events_1.EventEmitter {
    constructor(udpDiscovery, // Inject the specific discovery impl
    logger) {
        super();
        this.udpDiscovery = udpDiscovery;
        this.logger = logger;
        this.boundHandler = this.handlePeerDiscovered.bind(this);
    }
    startListening() {
        this.logger.info('[DiscoveryEvents] Starting to listen for discovered peers.');
        this.udpDiscovery.on('peerDiscovered', this.boundHandler);
    }
    stopListening() {
        this.logger.info('[DiscoveryEvents] Stopping listening for discovered peers.');
        this.udpDiscovery.off('peerDiscovered', this.boundHandler);
    }
    handlePeerDiscovered(peer) {
        this.logger.debug(`[DiscoveryEvents] Forwarding discovered peer: ${peer.instanceId}`);
        this.emit('peerDiscovered', peer); // Emit the discovered peer info
    }
}
exports.UdpDiscoveryEvents = UdpDiscoveryEvents;
//# sourceMappingURL=UdpDiscoveryEvents.js.map