import { IMessageRenderer } from './interfaces/IMessageRenderer';
import { IWebviewProvider } from './interfaces/IWebviewProvider';

/**
 * Implementation of the IMessageRenderer interface.
 * Renders different types of messages in the UI.
 */
export class MessageRenderer implements IMessageRenderer {
    private _webviewProvider: IWebviewProvider;
    
    /**
     * Creates a new MessageRenderer.
     * @param webviewProvider The webview provider to use for rendering
     */
    constructor(webviewProvider: IWebviewProvider) {
        this._webviewProvider = webviewProvider;
    }
    
    /**
     * Renders a user message in the UI.
     * @param text The text content of the message
     * @param isSelf Whether the message was sent by the local user
     */
    public renderUserMessage(text: string, isSelf: boolean): void {
        // For now, we don't differentiate between self and other messages in the rendering
        // This could be enhanced in the future
        this._webviewProvider.sendMessage(text);
    }
    
    /**
     * Renders a system message in the UI.
     * @param text The text content of the system message
     */
    public renderSystemMessage(text: string): void {
        this._webviewProvider.sendSystemMessage(text);
    }
    
    /**
     * Clears all messages from the UI.
     */
    public clearMessages(): void {
        this._webviewProvider.clearChat();
    }
}
