import * as vscode from 'vscode';
import { IWebviewProvider } from './interfaces/IWebviewProvider';
import { ILogger } from '../interfaces';
import { WebviewContentProvider } from './WebviewContentProvider';
import { WebviewMessageHandler } from './WebviewMessageHandler';
import { WebviewPanelFactory } from './WebviewPanelFactory';
import { WebviewMessageSender } from './WebviewMessageSender';

/**
 * Implementation of the IWebviewProvider interface.
 * Manages the webview panel lifecycle and communication.
 */
export class WebviewProviderImpl implements IWebviewProvider, vscode.WebviewViewProvider {
    public static readonly viewType = 'chattymcchatface.chatView';

    private _view?: vscode.WebviewView;
    private _contentProvider: WebviewContentProvider;
    private _messageHandler: WebviewMessageHandler;
    private _messageSender: WebviewMessageSender;
    private _panelFactory: WebviewPanelFactory;

    /**
     * Creates a new WebviewProviderImpl.
     * @param extensionUri URI of the extension directory
     * @param logger Logger for logging messages
     */
    constructor(extensionUri: vscode.Uri, logger: ILogger) {
        this._contentProvider = new WebviewContentProvider(extensionUri, logger);
        this._messageHandler = new WebviewMessageHandler(logger);
        this._messageSender = new WebviewMessageSender(this._messageHandler);
        this._panelFactory = new WebviewPanelFactory(
            extensionUri,
            this._contentProvider,
            this._messageHandler
        );
    }

    /**
     * Called when the view is first created
     */
    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
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
    public createChatPanel() {
        return this._panelFactory.createChatPanel();
    }

    /**
     * Update connection status in the webview
     */
    public updateConnectionStatus(connected: boolean) {
        if (this._view) {
            this._messageSender.updateConnectionStatus(this._view.webview, connected);
        }
    }

    /**
     * Send a message to be displayed in the webview
     */
    public sendMessage(text: string) {
        if (this._view) {
            this._messageSender.sendMessage(this._view.webview, text);
        }
    }

    /**
     * Send a system message to be displayed in the webview
     */
    public sendSystemMessage(text: string) {
        if (this._view) {
            this._messageSender.sendSystemMessage(this._view.webview, text);
        }
    }

    /**
     * Clear the chat history
     */
    public clearChat() {
        if (this._view) {
            this._messageSender.clearChat(this._view.webview);
        }
    }

    /**
     * Event that fires when a message is received from the webview
     */
    public readonly onDidReceiveMessage = this._messageHandler.onDidReceiveMessage;

    /**
     * Dispose of resources
     */
    public dispose() {
        this._messageHandler.dispose();
    }
}
