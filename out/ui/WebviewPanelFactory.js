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
exports.WebviewPanelFactory = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Factory for creating webview panels.
 */
class WebviewPanelFactory {
    /**
     * Creates a new WebviewPanelFactory.
     * @param extensionUri URI of the extension directory
     * @param contentProvider Provider for webview content
     * @param messageHandler Handler for webview messages
     */
    constructor(extensionUri, contentProvider, messageHandler) {
        this._extensionUri = extensionUri;
        this._contentProvider = contentProvider;
        this._messageHandler = messageHandler;
    }
    /**
     * Create and show a new webview panel
     * @returns The created webview panel
     */
    createChatPanel() {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        // Create and show panel
        const panel = vscode.window.createWebviewPanel('chattymcchatface.chatPanel', 'ChattyMcChatface', column || vscode.ViewColumn.One, {
            enableScripts: true,
            localResourceRoots: [this._extensionUri],
            retainContextWhenHidden: true
        });
        // Set the webview's initial html content
        panel.webview.html = this._contentProvider.getHtmlForWebview(panel.webview);
        // Handle messages from the webview
        this._messageHandler.setWebviewMessageListener(panel.webview);
        return panel;
    }
}
exports.WebviewPanelFactory = WebviewPanelFactory;
//# sourceMappingURL=WebviewPanelFactory.js.map