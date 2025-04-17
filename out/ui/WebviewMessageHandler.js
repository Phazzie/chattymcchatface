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
exports.WebviewMessageHandler = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Handles message communication with webviews.
 */
class WebviewMessageHandler {
    /**
     * Creates a new WebviewMessageHandler.
     * @param logger Logger for logging messages
     */
    constructor(logger) {
        this._disposables = [];
        this._onDidReceiveMessage = new vscode.EventEmitter();
        /**
         * Event that fires when a message is received from the webview
         */
        this.onDidReceiveMessage = this._onDidReceiveMessage.event;
        this._logger = logger;
    }
    /**
     * Set up message listener for the webview
     * @param webview The webview to listen to
     */
    setWebviewMessageListener(webview) {
        webview.onDidReceiveMessage((message) => {
            this._logger.info(`WebviewProvider received message: ${JSON.stringify(message)}`);
            this._onDidReceiveMessage.fire(message);
        }, undefined, this._disposables);
    }
    /**
     * Send a message to the webview
     * @param webview The webview to send to
     * @param message The message to send
     */
    sendMessage(webview, message) {
        webview.postMessage(message);
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
        this._onDidReceiveMessage.dispose();
    }
}
exports.WebviewMessageHandler = WebviewMessageHandler;
//# sourceMappingURL=WebviewMessageHandler.js.map