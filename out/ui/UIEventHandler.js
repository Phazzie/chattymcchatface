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
    }
    /**
     * Initializes event listeners for the webview.
     */
    initializeEventListeners() {
        // Listen for messages from the webview
        this._disposables.push(this._webviewProvider.onDidReceiveMessage(message => {
            switch (message.type) {
                case 'sendMessage':
                    this.handleSendMessage(message.text);
                    break;
                case 'clearChat':
                    this.handleClearChat();
                    break;
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
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}
exports.UIEventHandler = UIEventHandler;
//# sourceMappingURL=UIEventHandler.js.map