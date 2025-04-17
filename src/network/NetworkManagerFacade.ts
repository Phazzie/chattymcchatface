import { EventEmitter } from 'events';
import { INetworkManager, DiscoveredPeer, ILogger } from '../interfaces';
import { INetworkLifecycleManager } from './interfaces/INetworkLifecycleManager';
import { IActiveConnectionCoordinator } from './interfaces/IActiveConnectionCoordinator';
import { AutoConnectDiscoveryCoordinator } from './coordination/AutoConnectDiscoveryCoordinator';
import { IncomingConnectionCoordinator } from './coordination/IncomingConnectionCoordinator';

/**
 * Provides the public INetworkManager interface, orchestrating the underlying
 * network components and forwarding key events.
 */
export class NetworkManagerFacade extends EventEmitter implements INetworkManager {
    constructor(
        private readonly logger: ILogger,
        private readonly lifecycleManager: INetworkLifecycleManager,
        private readonly connectionCoordinator: IActiveConnectionCoordinator,
        // Coordinators manage their own listeners internally
        private readonly discoveryCoordinator: AutoConnectDiscoveryCoordinator,
        private readonly incomingCoordinator: IncomingConnectionCoordinator,
    ) {
        super();
        this.forwardCoordinatorEvents();
    }

    private forwardCoordinatorEvents(): void {
        // Forward events from the connection coordinator
        this.connectionCoordinator.on('connected', (peer) => this.emit('connected', peer));
        this.connectionCoordinator.on('disconnected', (reason) => this.emit('disconnected', reason));
        this.connectionCoordinator.on('messageReceived', (msg) => this.emit('messageReceived', msg));
        // Note: 'authFailed' is now likely part of the 'disconnected' reason.
        // Note: 'peerDiscovered' could be forwarded from discoveryEvents if needed publicly.
    }

    start(): void {
        this.logger.info('[NetworkFacade] Starting network services...');
        this.lifecycleManager.start(); // Start UDP/TCP services
        this.discoveryCoordinator.start(); // Start listening for peers
        this.incomingCoordinator.start(); // Start listening for connections
    }

    stop(): void {
        this.logger.info('[NetworkFacade] Stopping network services...');
        this.discoveryCoordinator.stop();
        this.incomingCoordinator.stop();
        this.connectionCoordinator.disconnect('Network manager stopping'); // Ensure cleanup
        this.lifecycleManager.stop();
    }

    sendMessage(message: string): boolean {
        const handler = this.connectionCoordinator.getActiveHandler();
        if (handler?.isAuthenticated) {
            try {
                return handler.sendMessage(message);
            } catch (error: any) {
                this.logger.error(`[NetworkFacade] Error sending message: ${error?.message}`, error);
                return false;
            }
        } else {
            this.logger.warn('[NetworkFacade] Cannot send message: No active authenticated connection.');
            return false;
        }
    }

    // Optional: Expose state getters if needed by consumers
    isConnected(): boolean {
        return this.connectionCoordinator.isConnected();
    }

    getConnectedPeer(): DiscoveredPeer | null {
        return this.connectionCoordinator.getConnectedPeer();
    }
}
