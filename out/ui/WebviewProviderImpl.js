"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebviewProviderImpl = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
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
        this._disposables = [];
        this._onDidReceiveMessage = new vscode.EventEmitter();
        /**
         * Event that fires when a message is received from the webview
         */
        this.onDidReceiveMessage = this._onDidReceiveMessage.event;
        this._extensionUri = extensionUri;
        this._logger = logger;
    }
    /**
     * Called when the view is first created
     */
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        // Set options for the webview
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };
        // Set the webview's initial html content
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        // Handle messages from the webview
        this._setWebviewMessageListener(webviewView.webview);
        // Reset when the current view is closed
        webviewView.onDidDispose(() => {
            this._view = undefined;
        });
    }
    /**
     * Create and show a new webview panel
     */
    createChatPanel() {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        // Create and show panel
        const panel = vscode.window.createWebviewPanel('chattymcchatface.chatPanel', 'ChattyMcChatface', column || vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
            retainContextWhenHidden: true
        });
        // Set the webview's initial html content
        panel.webview.html = this._getHtmlForWebview(panel.webview);
        // Handle messages from the webview
        this._setWebviewMessageListener(panel.webview);
        return panel;
    }
    /**
     * Update connection status in the webview
     */
    updateConnectionStatus(connected) {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'connectionStatus',
                connected
            });
        }
    }
    /**
     * Send a message to be displayed in the webview
     */
    sendMessage(text) {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'receiveMessage',
                text
            });
        }
    }
    /**
     * Send a system message to be displayed in the webview
     */
    sendSystemMessage(text) {
        if (this._view) {
            this._view.webview.postMessage({
                type: 'systemMessage',
                text
            });
        }
    }
    /**
     * Clear the chat history
     */
    clearChat() {
        if (this._view) {
            this._view.webview.postMessage({ type: 'clearChat' });
        }
    }
    /**
     * Set up message listener for the webview
     */
    _setWebviewMessageListener(webview) {
        webview.onDidReceiveMessage((message) => {
            this._logger.info(`WebviewProvider received message: ${JSON.stringify(message)}`);
            this._onDidReceiveMessage.fire(message);
        }, undefined, this._disposables);
    }
    /**
     * Get the HTML content for the webview
     */
    _getHtmlForWebview(webview) {
        // Get path to resources
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'main.js'));
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'style.css'));
        // Get the HTML content
        const htmlPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'index.html');
        let html = fs.readFileSync(htmlPath.fsPath, 'utf-8');
        // Use a nonce to only allow specific scripts to be run
        const nonce = this._getNonce();
        // Replace placeholder variables in the HTML
        html = html.replace('${styleUri}', styleUri.toString());
        html = html.replace('${scriptUri}', scriptUri.toString());
        html = html.replace(/\${nonce}/g, nonce);
        html = html.replace(/\${webview.cspSource}/g, webview.cspSource);
        return html;
    }
    /**
     * Generate a random nonce string
     */
    _getNonce() {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
    /**
     * Dispose of resources
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
exports.WebviewProviderImpl = WebviewProviderImpl;
WebviewProviderImpl.viewType = 'chattymcchatface.chatView';
//# sourceMappingURL=WebviewProviderImpl.js.map