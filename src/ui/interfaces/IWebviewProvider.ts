import * as vscode from 'vscode';

/**
 * Interface for managing the webview panel lifecycle and communication.
 */
export interface IWebviewProvider {
    /** Creates and shows a new webview panel */
    createChatPanel(): vscode.WebviewPanel;
    /** Updates the connection status in the webview */
    updateConnectionStatus(connected: boolean): void;
    /** Sends a message to be displayed in the webview */
    sendMessage(text: string): void;
    /** Sends a system message to be displayed in the webview */
    sendSystemMessage(text: string): void;
    /** Clears the chat history */
    clearChat(): void;
    /** Event that fires when a message is received from the webview */
    readonly onDidReceiveMessage: vscode.Event<any>;
    /** Disposes of resources */
    dispose(): void;
}
