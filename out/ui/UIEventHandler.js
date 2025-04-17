"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIEventHandler = void 0;
/**
 * Implementation of the IUIEventHandler interface.
 * Handles UI events.
 */
class UIEventHandler {
    /**
     * Creates a new UIEventHandler.
     * @param webviewProvider The webview provider to handle events for
     * @param networkManager The network manager to send messages through
     */
    constructor(webviewProvider, networkManager) {
        this._disposables = [];
        this._webviewProvider = webviewProvider;
        this._networkManager = networkManager;
        this._messageHandlers = new Map([
            ['sendMessage', (message) => this.handleSendMessage(message.text)],
            ['clearChat', () => this.handleClearChat()]
        ]);
    }
    /**
     * Initializes event listeners for the webview.
     */
    initializeEventListeners() {
        this._disposables.push(this._webviewProvider.onDidReceiveMessage(message => {
            const handler = this._messageHandlers.get(message.type);
            if (handler) {
                handler(message);
            }
        }));
    }
    /**
     * Handles a message send event.
     * @param text The text content of the message
     */
    handleSendMessage(text) {
        this._networkManager.sendMessage(text);
    }
    /**
     * Handles a clear chat event.
     */
    handleClearChat() {
        this._webviewProvider.clearChat();
    }
    /**
     * Disposes of resources.
     */
    dispose() {
        this._disposables.forEach(d => d.dispose());
        this._disposables = [];
    }
}
exports.UIEventHandler = UIEventHandler;
//# sourceMappingURL=UIEventHandler.js.map