import { IUIEventHandler } from './interfaces/IUIEventHandler';
import { IWebviewProvider } from './interfaces/IWebviewProvider';
import { INetworkManager } from '../network/interfaces/INetworkManager';
import * as vscode from 'vscode';

type MessageHandler = (message: any) => void;

/**
 * Implementation of the IUIEventHandler interface.
 * Handles UI events.
 */
export class UIEventHandler implements IUIEventHandler {
    private _webviewProvider: IWebviewProvider;
    private _networkManager: INetworkManager;
    private _disposables: vscode.Disposable[] = [];
    private _messageHandlers: Map<string, MessageHandler>;

    /**
     * Creates a new UIEventHandler.
     * @param webviewProvider The webview provider to handle events for
     * @param networkManager The network manager to send messages through
     */
    constructor(webviewProvider: IWebviewProvider, networkManager: INetworkManager) {
        this._webviewProvider = webviewProvider;
        this._networkManager = networkManager;
        this._messageHandlers = new Map([
            ['sendMessage', (message) => this.handleSendMessage(message.text)],
            ['clearChat', () => this.handleClearChat()]
        ]);
    }

    /**
     * Initializes event listeners for the webview.
     */
    public initializeEventListeners(): void {
        this._disposables.push(
            this._webviewProvider.onDidReceiveMessage(message => {
                const handler = this._messageHandlers.get(message.type);
                if (handler) {
                    handler(message);
                }
            })
        );
    }

    /**
     * Handles a message send event.
     * @param text The text content of the message
     */
    public handleSendMessage(text: string): void {
        this._networkManager.sendMessage(text);
    }

    /**
     * Handles a clear chat event.
     */
    public handleClearChat(): void {
        this._webviewProvider.clearChat();
    }

    /**
     * Disposes of resources.
     */
    public dispose(): void {
        this._disposables.forEach(d => d.dispose());
        this._disposables = [];
    }
}
