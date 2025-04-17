import * as vscode from 'vscode';
import { WebviewContentProvider } from './WebviewContentProvider';
import { WebviewMessageHandler } from './WebviewMessageHandler';

/**
 * Factory for creating webview panels.
 */
export class WebviewPanelFactory {
    private _extensionUri: vscode.Uri;
    private _contentProvider: WebviewContentProvider;
    private _messageHandler: WebviewMessageHandler;
    
    /**
     * Creates a new WebviewPanelFactory.
     * @param extensionUri URI of the extension directory
     * @param contentProvider Provider for webview content
     * @param messageHandler Handler for webview messages
     */
    constructor(
        extensionUri: vscode.Uri,
        contentProvider: WebviewContentProvider,
        messageHandler: WebviewMessageHandler
    ) {
        this._extensionUri = extensionUri;
        this._contentProvider = contentProvider;
        this._messageHandler = messageHandler;
    }
    
    /**
     * Create and show a new webview panel
     * @returns The created webview panel
     */
    public createChatPanel(): vscode.WebviewPanel {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // Create and show panel
        const panel = vscode.window.createWebviewPanel(
            'chattymcchatface.chatPanel',
            'ChattyMcChatface',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [this._extensionUri],
                retainContextWhenHidden: true
            }
        );

        // Set the webview's initial html content
        panel.webview.html = this._contentProvider.getHtmlForWebview(panel.webview);

        // Handle messages from the webview
        this._messageHandler.setWebviewMessageListener(panel.webview);

        return panel;
    }
}
