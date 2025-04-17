import { IUIStateManager } from './interfaces/IUIStateManager';
import { IWebviewProvider } from './interfaces/IWebviewProvider';

/**
 * Implementation of the IUIStateManager interface.
 * Manages UI state.
 */
export class UIStateManager implements IUIStateManager {
    private _webviewProvider: IWebviewProvider;
    private _connected: boolean = false;
    private _savedState: { connected: boolean } = { connected: false };
    
    /**
     * Creates a new UIStateManager.
     * @param webviewProvider The webview provider to use for state updates
     */
    constructor(webviewProvider: IWebviewProvider) {
        this._webviewProvider = webviewProvider;
    }
    
    /**
     * Updates the connection status in the UI.
     * @param connected Whether the connection is established
     */
    public updateConnectionStatus(connected: boolean): void {
        this._connected = connected;
        this._webviewProvider.updateConnectionStatus(connected);
    }
    
    /**
     * Gets the current connection status.
     * @returns Whether the connection is established
     */
    public isConnected(): boolean {
        return this._connected;
    }
    
    /**
     * Saves the current UI state.
     */
    public saveState(): void {
        this._savedState = {
            connected: this._connected
        };
    }
    
    /**
     * Restores the UI state from the saved state.
     */
    public restoreState(): void {
        this._connected = this._savedState.connected;
        this._webviewProvider.updateConnectionStatus(this._connected);
    }
}
