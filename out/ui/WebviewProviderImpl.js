"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebviewProviderImpl = void 0;
const WebviewContentProvider_1 = require("./WebviewContentProvider");
const WebviewMessageHandler_1 = require("./WebviewMessageHandler");
const WebviewPanelFactory_1 = require("./WebviewPanelFactory");
const WebviewMessageSender_1 = require("./WebviewMessageSender");
/**
 * Implementation of the IWebviewProvider interface.
 * Manages the webview panel lifecycle and communication.
 */
class WebviewProviderImpl {
    /**
     * Creates a new WebviewProviderImpl.
     * @param extensionUri URI of the extension directory
     * @param logger Logger for logging messages
     */
    constructor(extensionUri, logger) {
        /**
         * Event that fires when a message is received from the webview
         */
        this.onDidReceiveMessage = this._messageHandler.onDidReceiveMessage;
        this._contentProvider = new WebviewContentProvider_1.WebviewContentProvider(extensionUri, logger);
        this._messageHandler = new WebviewMessageHandler_1.WebviewMessageHandler(logger);
        this._messageSender = new WebviewMessageSender_1.WebviewMessageSender(this._messageHandler);
        this._panelFactory = new WebviewPanelFactory_1.WebviewPanelFactory(extensionUri, this._contentProvider, this._messageHandler);
    }
    /**
     * Called when the view is first created
     */
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        // Set options for the webview
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._contentProvider.getResourceRoots()]
        };
        // Set the webview's initial html content
        webviewView.webview.html = this._contentProvider.getHtmlForWebview(webviewView.webview);
        // Handle messages from the webview
        this._messageHandler.setWebviewMessageListener(webviewView.webview);
        // Reset when the current view is closed
        webviewView.onDidDispose(() => {
            this._view = undefined;
        });
    }
    /**
     * Create and show a new webview panel
     */
    createChatPanel() {
        return this._panelFactory.createChatPanel();
    }
    /**
     * Update connection status in the webview
     */
    updateConnectionStatus(connected) {
        if (this._view) {
            this._messageSender.updateConnectionStatus(this._view.webview, connected);
        }
    }
    /**
     * Send a message to be displayed in the webview
     */
    sendMessage(text) {
        if (this._view) {
            this._messageSender.sendMessage(this._view.webview, text);
        }
    }
    /**
     * Send a system message to be displayed in the webview
     */
    sendSystemMessage(text) {
        if (this._view) {
            this._messageSender.sendSystemMessage(this._view.webview, text);
        }
    }
    /**
     * Clear the chat history
     */
    clearChat() {
        if (this._view) {
            this._messageSender.clearChat(this._view.webview);
        }
    }
    /**
     * Dispose of resources
     */
    dispose() {
        this._messageHandler.dispose();
    }
}
exports.WebviewProviderImpl = WebviewProviderImpl;
WebviewProviderImpl.viewType = 'chattymcchatface.chatView';
//# sourceMappingURL=WebviewProviderImpl.js.map