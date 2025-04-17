"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIStateManager = void 0;
/**
 * Implementation of the IUIStateManager interface.
 * Manages UI state.
 */
class UIStateManager {
    /**
     * Creates a new UIStateManager.
     * @param webviewProvider The webview provider to use for state updates
     */
    constructor(webviewProvider) {
        this._connected = false;
        this._savedState = { connected: false };
        this._webviewProvider = webviewProvider;
    }
    /**
     * Updates the connection status in the UI.
     * @param connected Whether the connection is established
     */
    updateConnectionStatus(connected) {
        this._connected = connected;
        this._webviewProvider.updateConnectionStatus(connected);
    }
    /**
     * Gets the current connection status.
     * @returns Whether the connection is established
     */
    isConnected() {
        return this._connected;
    }
    /**
     * Saves the current UI state.
     */
    saveState() {
        this._savedState = {
            connected: this._connected
        };
    }
    /**
     * Restores the UI state from the saved state.
     */
    restoreState() {
        this._connected = this._savedState.connected;
        this._webviewProvider.updateConnectionStatus(this._connected);
    }
}
exports.UIStateManager = UIStateManager;
//# sourceMappingURL=UIStateManager.js.map