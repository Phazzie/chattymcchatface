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
exports.WebviewHtmlGenerator = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
/**
 * Generates HTML content for webviews.
 */
class WebviewHtmlGenerator {
    /**
     * Creates a new WebviewHtmlGenerator.
     * @param extensionUri URI of the extension directory
     * @param logger Logger for logging messages
     */
    constructor(extensionUri, logger) {
        this._extensionUri = extensionUri;
        this._logger = logger;
    }
    /**
     * Generate HTML content for the webview
     * @param webview The webview to generate content for
     * @returns The HTML content
     */
    generateHtml(webview) {
        try {
            // Get path to resources
            const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'main.js'));
            const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'style.css'));
            // Get the HTML content
            const htmlPath = vscode.Uri.joinPath(this._extensionUri, 'src', 'webview', 'index.html');
            let html = fs.readFileSync(htmlPath.fsPath, 'utf-8');
            // Use a nonce to only allow specific scripts to be run
            const nonce = this._generateNonce();
            // Replace placeholder variables in the HTML
            html = html.replace('${styleUri}', styleUri.toString());
            html = html.replace('${scriptUri}', scriptUri.toString());
            html = html.replace(/\${nonce}/g, nonce);
            html = html.replace(/\${webview.cspSource}/g, webview.cspSource);
            return html;
        }
        catch (error) {
            this._logger.error('Error generating webview HTML', error);
            return this._getErrorHtml();
        }
    }
    /**
     * Generate a random nonce string
     * @returns A random nonce string
     */
    _generateNonce() {
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
    _getErrorHtml() {
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
exports.WebviewHtmlGenerator = WebviewHtmlGenerator;
//# sourceMappingURL=WebviewHtmlGenerator.js.map