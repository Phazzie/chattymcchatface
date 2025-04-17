import * as vscode from 'vscode';
import * as fs from 'fs';
import { ILogger } from '../interfaces';

/**
 * Generates HTML content for webviews.
 */
export class WebviewHtmlGenerator {
    private _extensionUri: vscode.Uri;
    private _logger: ILogger;
    
    /**
     * Creates a new WebviewHtmlGenerator.
     * @param extensionUri URI of the extension directory
     * @param logger Logger for logging messages
     */
    constructor(extensionUri: vscode.Uri, logger: ILogger) {
        this._extensionUri = extensionUri;
        this._logger = logger;
    }
    
    /**
     * Generate HTML content for the webview
     * @param webview The webview to generate content for
     * @returns The HTML content
     */
    public generateHtml(webview: vscode.Webview): string {
        try {
            // Get path to resources
            const scriptUri = webview.asWebviewUri(
                vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'main.js')
            );
            const styleUri = webview.asWebviewUri(
                vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'style.css')
            );

            // Get the HTML content
            const htmlPath = vscode.Uri.joinPath(
                this._extensionUri, 'src', 'webview', 'index.html'
            );
            let html = fs.readFileSync(htmlPath.fsPath, 'utf-8');

            // Use a nonce to only allow specific scripts to be run
            const nonce = this._generateNonce();

            // Replace placeholder variables in the HTML
            html = html.replace('${styleUri}', styleUri.toString());
            html = html.replace('${scriptUri}', scriptUri.toString());
            html = html.replace(/\${nonce}/g, nonce);
            html = html.replace(/\${webview.cspSource}/g, webview.cspSource);

            return html;
        } catch (error) {
            this._logger.error('Error generating webview HTML', error);
            return this._getErrorHtml();
        }
    }
    
    /**
     * Generate a random nonce string
     * @returns A random nonce string
     */
    private _generateNonce(): string {
        let text = '';
        const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
    
    /**
     * Get HTML content for error display
     * @returns Simple HTML for error display
     */
    private _getErrorHtml(): string {
        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Error</title>
            </head>
            <body>
                <h1>Error loading chat interface</h1>
                <p>Please check the extension logs for details.</p>
            </body>
            </html>`;
    }
}
