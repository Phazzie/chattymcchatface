"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebviewMessageSender = void 0;
/**
 * Handles sending messages to webviews.
 */
class WebviewMessageSender {
    /**
     * Creates a new WebviewMessageSender.
     * @param messageHandler The message handler to use
     */
    constructor(messageHandler) {
        this._messageHandler = messageHandler;
    }
    /**
     * Update connection status in the webview
     * @param webview The webview to update
     * @param connected Whether the connection is established
     */
    updateConnectionStatus(webview, connected) {
        this._messageHandler.sendMessage(webview, {
            type: 'connectionStatus',
            connected
        });
    }
    /**
     * Send a message to be displayed in the webview
     * @param webview The webview to send to
     * @param text The text content of the message
     */
    sendMessage(webview, text) {
        this._messageHandler.sendMessage(webview, {
            type: 'receiveMessage',
            text
        });
    }
    /**
     * Send a system message to be displayed in the webview
     * @param webview The webview to send to
     * @param text The text content of the system message
     */
    sendSystemMessage(webview, text) {
        this._messageHandler.sendMessage(webview, {
            type: 'systemMessage',
            text
        });
    }
    /**
     * Clear the chat history
     * @param webview The webview to clear
     */
    clearChat(webview) {
        this._messageHandler.sendMessage(webview, { type: 'clearChat' });
    }
}
exports.WebviewMessageSender = WebviewMessageSender;
//# sourceMappingURL=WebviewMessageSender.js.map