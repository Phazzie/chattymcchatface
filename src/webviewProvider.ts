import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Manages the webview panel for the chat interface
 */
export class WebviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'chattymcchatface.chatView';

    private _view?: vscode.WebviewView;
    private _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    /**
     * Create a new WebviewProvider
     * @param extensionUri URI of the extension directory
     */
    constructor(extensionUri: vscode.Uri) {
        this._extensionUri = extensionUri;
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
    public createChatPanel() {
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
        panel.webview.html = this._getHtmlForWebview(panel.webview);

        // Handle messages from the webview
        this._setWebviewMessageListener(panel.webview);

        return panel;
    }

    /**
     * Update connection status in the webview
     */
    public updateConnectionStatus(connected: boolean) {
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
    public sendMessage(text: string) {
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
    public sendSystemMessage(text: string) {
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
    public clearChat() {
        if (this._view) {
            this._view.webview.postMessage({ type: 'clearChat' });
        }
    }

    /**
     * Set up message listener for the webview
     */
    private _setWebviewMessageListener(webview: vscode.Webview) {
        webview.onDidReceiveMessage(
            (message: any) => {
                switch (message.type) {
                    case 'sendMessage':
                        // Log the message received from the webview
                        console.log(`WebviewProvider received message: ${message.text}`);

                        // Send to extension host (will be handled by extension.ts)
                        this._onDidReceiveMessage.fire({
                            type: 'sendMessage',
                            text: message.text
                        });
                        break;
                }
            },
            undefined,
            this._disposables
        );
    }

    /**
     * Event emitter for messages received from the webview
     */
    private _onDidReceiveMessage = new vscode.EventEmitter<any>();

    /**
     * Event that fires when a message is received from the webview
     */
    public readonly onDidReceiveMessage = this._onDidReceiveMessage.event;

    /**
     * Get the HTML content for the webview
     */
    private _getHtmlForWebview(webview: vscode.Webview): string {
        // Get path to resources
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'main.js')
        );

        const styleUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'style.css')
        );

        // Get the HTML content
        const htmlPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'index.html');
        let html = fs.readFileSync(htmlPath.fsPath, 'utf-8');

        // Use a nonce to only allow specific scripts to be run
        const nonce = getNonce();

        // Replace placeholder variables in the HTML
        html = html.replace('${styleUri}', styleUri.toString());
        html = html.replace('${scriptUri}', scriptUri.toString());
        html = html.replace(/\${nonce}/g, nonce);
        html = html.replace(/\${webview.cspSource}/g, webview.cspSource);

        return html;
    }

    /**
     * Dispose of resources
     */
    public dispose() {
        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}

/**
 * Generate a random nonce string
 */
function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return text;
}