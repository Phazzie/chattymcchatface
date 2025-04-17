/**
 * Interface for managing UI state.
 */
export interface IUIStateManager {
    /** Updates the connection status */
    updateConnectionStatus(connected: boolean): void;
    /** Gets the current connection status */
    isConnected(): boolean;
    /** Saves the current UI state */
    saveState(): void;
    /** Restores the UI state */
    restoreState(): void;
}
