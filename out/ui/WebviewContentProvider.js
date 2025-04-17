"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebviewContentProvider = void 0;
const WebviewHtmlGenerator_1 = require("./WebviewHtmlGenerator");
/**
 * Responsible for managing webview content.
 */
class WebviewContentProvider {
    /**
     * Creates a new WebviewContentProvider.
     * @param extensionUri URI of the extension directory
     * @param logger Logger for logging messages
     */
    constructor(extensionUri, logger) {
        this._extensionUri = extensionUri;
        this._htmlGenerator = new WebviewHtmlGenerator_1.WebviewHtmlGenerator(extensionUri, logger);
    }
    /**
     * Get the resource roots for the webview
     * @returns Array of resource roots
     */
    getResourceRoots() {
        return this._extensionUri;
    }
    /**
     * Get the HTML content for the webview
     * @param webview The webview to generate content for
     * @returns The HTML content
     */
    getHtmlForWebview(webview) {
        return this._htmlGenerator.generateHtml(webview);
    }
}
exports.WebviewContentProvider = WebviewContentProvider;
//# sourceMappingURL=WebviewContentProvider.js.map