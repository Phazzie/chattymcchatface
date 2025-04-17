"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BasicNetworkLifecycleManager = void 0;
/**
 * Manages the start and stop lifecycle of core network services (UDP Discovery, TCP Server).
 */
class BasicNetworkLifecycleManager {
    constructor(udpDiscovery, tcpServer, logger) {
        this.udpDiscovery = udpDiscovery;
        this.tcpServer = tcpServer;
        this.logger = logger;
    }
    start() {
        try {
            this.tcpServer.start(); // Start server first (might be needed for discovery info)
            this.udpDiscovery.start();
            this.logger.info('[LifecycleManager] Started discovery and server.');
        }
        catch (error) {
            this.logger.error(`[LifecycleManager] Error starting services: ${error?.message}`, error);
            this.stop(); // Attempt cleanup
            throw error;
        }
    }
    stop() {
        try {
            // Stop in reverse order or based on dependencies
            this.udpDiscovery.stop();
            this.tcpServer.stop();
            this.logger.info('[LifecycleManager] Stopped discovery and server.');
        }
        catch (error) {
            this.logger.error(`[LifecycleManager] Error stopping services: ${error?.message}`, error);
            // Log error but proceed if possible
        }
    }
}
exports.BasicNetworkLifecycleManager = BasicNetworkLifecycleManager;
//# sourceMappingURL=BasicNetworkLifecycleManager.js.map