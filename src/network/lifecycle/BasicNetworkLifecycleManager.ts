import { INetworkLifecycleManager } from '../interfaces/INetworkLifecycleManager';
import { IUdpDiscovery, ITcpServer, ILogger } from '../../interfaces';

/**
 * Manages the start and stop lifecycle of core network services (UDP Discovery, TCP Server).
 */
export class BasicNetworkLifecycleManager implements INetworkLifecycleManager {
    constructor(
        private readonly udpDiscovery: IUdpDiscovery,
        private readonly tcpServer: ITcpServer,
        private readonly logger: ILogger,
    ) { }

    start(): void {
        try {
            this.tcpServer.start(); // Start server first (might be needed for discovery info)
            this.udpDiscovery.start();
            this.logger.info('[LifecycleManager] Started discovery and server.');
        } catch (error: any) {
            this.logger.error(`[LifecycleManager] Error starting services: ${error?.message}`, error);
            this.stop(); // Attempt cleanup
            throw error;
        }
    }

    stop(): void {
        try {
            // Stop in reverse order or based on dependencies
            this.udpDiscovery.stop();
            this.tcpServer.stop();
            this.logger.info('[LifecycleManager] Stopped discovery and server.');
        } catch (error: any) {
            this.logger.error(`[LifecycleManager] Error stopping services: ${error?.message}`, error);
            // Log error but proceed if possible
        }
    }
}
