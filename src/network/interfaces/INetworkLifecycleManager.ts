/**
 * Defines the contract for managing the overall network service lifecycle
 * (like discovery and listening servers).
 */
export interface INetworkLifecycleManager {
    /** Starts underlying network services. */
    start(): void;

    /** Stops underlying network services. */
    stop(): void;
}
