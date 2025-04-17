import * as vscode from 'vscode';
import { ILogger } from '../interfaces';
import { WebviewHtmlGenerator } from './WebviewHtmlGenerator';

/**
 * Responsible for managing webview content.
 */
export class WebviewContentProvider {
    private _extensionUri: vscode.Uri;
    private _htmlGenerator: WebviewHtmlGenerator;

    /**
     * Creates a new WebviewContentProvider.
     * @param extensionUri URI of the extension directory
     * @param logger Logger for logging messages
     */
    constructor(extensionUri: vscode.Uri, logger: ILogger) {
        this._extensionUri = extensionUri;
        this._htmlGenerator = new WebviewHtmlGenerator(extensionUri, logger);
    }

    /**
     * Get the resource roots for the webview
     * @returns Array of resource roots
     */
    public getResourceRoots(): vscode.Uri {
        return this._extensionUri;
    }

    /**
     * Get the HTML content for the webview
     * @param webview The webview to generate content for
     * @returns The HTML content
     */
    public getHtmlForWebview(webview: vscode.Webview): string {
        return this._htmlGenerator.generateHtml(webview);
    }
}
