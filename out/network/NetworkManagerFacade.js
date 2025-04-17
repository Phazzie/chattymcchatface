"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkManagerFacade = void 0;
const events_1 = require("events");
/**
 * Provides the public INetworkManager interface, orchestrating the underlying
 * network components and forwarding key events.
 */
class NetworkManagerFacade extends events_1.EventEmitter {
    constructor(logger, lifecycleManager, connectionCoordinator, 
    // Coordinators manage their own listeners internally
    discoveryCoordinator, incomingCoordinator) {
        super();
        this.logger = logger;
        this.lifecycleManager = lifecycleManager;
        this.connectionCoordinator = connectionCoordinator;
        this.discoveryCoordinator = discoveryCoordinator;
        this.incomingCoordinator = incomingCoordinator;
        this.forwardCoordinatorEvents();
    }
    forwardCoordinatorEvents() {
        // Forward events from the connection coordinator
        this.connectionCoordinator.on('connected', (peer) => this.emit('connected', peer));
        this.connectionCoordinator.on('disconnected', (reason) => this.emit('disconnected', reason));
        this.connectionCoordinator.on('messageReceived', (msg) => this.emit('messageReceived', msg));
        // Note: 'authFailed' is now likely part of the 'disconnected' reason.
        // Note: 'peerDiscovered' could be forwarded from discoveryEvents if needed publicly.
    }
    start() {
        this.logger.info('[NetworkFacade] Starting network services...');
        this.lifecycleManager.start(); // Start UDP/TCP services
        this.discoveryCoordinator.start(); // Start listening for peers
        this.incomingCoordinator.start(); // Start listening for connections
    }
    stop() {
        this.logger.info('[NetworkFacade] Stopping network services...');
        this.discoveryCoordinator.stop();
        this.incomingCoordinator.stop();
        this.connectionCoordinator.disconnect('Network manager stopping'); // Ensure cleanup
        this.lifecycleManager.stop();
    }
    sendMessage(message) {
        const handler = this.connectionCoordinator.getActiveHandler();
        if (handler?.isAuthenticated) {
            try {
                return handler.sendMessage(message);
            }
            catch (error) {
                this.logger.error(`[NetworkFacade] Error sending message: ${error?.message}`, error);
                return false;
            }
        }
        else {
            this.logger.warn('[NetworkFacade] Cannot send message: No active authenticated connection.');
            return false;
        }
    }
    // Optional: Expose state getters if needed by consumers
    isConnected() {
        return this.connectionCoordinator.isConnected();
    }
    getConnectedPeer() {
        return this.connectionCoordinator.getConnectedPeer();
    }
}
exports.NetworkManagerFacade = NetworkManagerFacade;
//# sourceMappingURL=NetworkManagerFacade.js.map