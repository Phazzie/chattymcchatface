"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageRenderer = void 0;
/**
 * Implementation of the IMessageRenderer interface.
 * Renders different types of messages in the UI.
 */
class MessageRenderer {
    /**
     * Creates a new MessageRenderer.
     * @param webviewProvider The webview provider to use for rendering
     */
    constructor(webviewProvider) {
        this._webviewProvider = webviewProvider;
    }
    /**
     * Renders a user message in the UI.
     * @param text The text content of the message
     * @param isSelf Whether the message was sent by the local user
     */
    renderUserMessage(text, isSelf) {
        // For now, we don't differentiate between self and other messages in the rendering
        // This could be enhanced in the future
        this._webviewProvider.sendMessage(text);
    }
    /**
     * Renders a system message in the UI.
     * @param text The text content of the system message
     */
    renderSystemMessage(text) {
        this._webviewProvider.sendSystemMessage(text);
    }
    /**
     * Clears all messages from the UI.
     */
    clearMessages() {
        this._webviewProvider.clearChat();
    }
}
exports.MessageRenderer = MessageRenderer;
//# sourceMappingURL=MessageRenderer.js.map