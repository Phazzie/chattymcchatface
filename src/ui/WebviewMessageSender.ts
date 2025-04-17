import * as vscode from 'vscode';
import { WebviewMessageHandler } from './WebviewMessageHandler';

/**
 * Handles sending messages to webviews.
 */
export class WebviewMessageSender {
    private _messageHandler: WebviewMessageHandler;
    
    /**
     * Creates a new WebviewMessageSender.
     * @param messageHandler The message handler to use
     */
    constructor(messageHandler: WebviewMessageHandler) {
        this._messageHandler = messageHandler;
    }
    
    /**
     * Update connection status in the webview
     * @param webview The webview to update
     * @param connected Whether the connection is established
     */
    public updateConnectionStatus(webview: vscode.Webview, connected: boolean): void {
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
    public sendMessage(webview: vscode.Webview, text: string): void {
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
    public sendSystemMessage(webview: vscode.Webview, text: string): void {
        this._messageHandler.sendMessage(webview, {
            type: 'systemMessage',
            text
        });
    }
    
    /**
     * Clear the chat history
     * @param webview The webview to clear
     */
    public clearChat(webview: vscode.Webview): void {
        this._messageHandler.sendMessage(webview, { type: 'clearChat' });
    }
}
