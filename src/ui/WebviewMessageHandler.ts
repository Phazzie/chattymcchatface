import * as vscode from 'vscode';
import { ILogger } from '../interfaces';

/**
 * Handles message communication with webviews.
 */
export class WebviewMessageHandler {
    private _disposables: vscode.Disposable[] = [];
    private _onDidReceiveMessage = new vscode.EventEmitter<any>();
    private _logger: ILogger;
    
    /**
     * Creates a new WebviewMessageHandler.
     * @param logger Logger for logging messages
     */
    constructor(logger: ILogger) {
        this._logger = logger;
    }
    
    /**
     * Set up message listener for the webview
     * @param webview The webview to listen to
     */
    public setWebviewMessageListener(webview: vscode.Webview): void {
        webview.onDidReceiveMessage(
            (message: any) => {
                this._logger.info(`WebviewProvider received message: ${JSON.stringify(message)}`);
                this._onDidReceiveMessage.fire(message);
            },
            undefined,
            this._disposables
        );
    }
    
    /**
     * Send a message to the webview
     * @param webview The webview to send to
     * @param message The message to send
     */
    public sendMessage(webview: vscode.Webview, message: any): void {
        webview.postMessage(message);
    }
    
    /**
     * Event that fires when a message is received from the webview
     */
    public readonly onDidReceiveMessage = this._onDidReceiveMessage.event;
    
    /**
     * Dispose of resources
     */
    public dispose(): void {
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
        this._onDidReceiveMessage.dispose();
    }
}
