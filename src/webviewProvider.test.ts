import * as vscode from 'vscode';
import { mock, instance, verify, when, anything, reset, capture } from 'ts-mockito';
import { WebviewProvider } from './webviewProvider';
import { IWebviewProvider } from './interfaces';

describe('WebviewProvider', () => {
    let webviewProvider: IWebviewProvider;
    let mockWebviewView: vscode.WebviewView;
    let mockWebviewPanel: vscode.WebviewPanel;
    let mockWebview: vscode.Webview;
    const testExtensionUri = { fsPath: '/test/extension/path' } as vscode.Uri;

    beforeEach(() => {
        // Create mocks
        mockWebview = mock<vscode.Webview>();
        mockWebviewView = mock<vscode.WebviewView>();
        mockWebviewPanel = mock<vscode.WebviewPanel>();

        // Setup webview mock
        when(mockWebview.postMessage(anything())).thenReturn(Promise.resolve(true));
        when(mockWebview.html).thenReturn('');

        // Setup webview view mock to return our webview mock
        when(mockWebviewView.webview).thenReturn(instance(mockWebview));
        when(mockWebviewView.visible).thenReturn(true);

        // Setup webview panel mock
        when(mockWebviewPanel.webview).thenReturn(instance(mockWebview));

        // Create the WebviewProvider instance
        webviewProvider = new WebviewProvider(testExtensionUri);

        // Reset mocks before each test
        jest.clearAllMocks();
        reset(mockWebview);
        reset(mockWebviewView);
        reset(mockWebviewPanel);
    });

    test('resolveWebviewView should initialize the webview', () => {
        // Stub createPanel method
        jest.spyOn(WebviewProvider.prototype as any, 'createPanel').mockImplementation(() => { });

        // Act
        (webviewProvider as any).resolveWebviewView(instance(mockWebviewView));

        // Assert
        verify(mockWebviewView.webview.options).once();
        // Should set HTML content
        verify(mockWebview.html = anything()).once();
    });

    test('updateConnectionStatus should post status message to webview', () => {
        // Arrange
        (webviewProvider as any).currentView = instance(mockWebviewView);

        // Act
        webviewProvider.updateConnectionStatus(true);

        // Assert
        verify(mockWebview.postMessage({
            type: 'updateStatus',
            connected: true
        })).once();
    });

    test('sendMessage should post message to webview', () => {
        // Arrange
        (webviewProvider as any).currentView = instance(mockWebviewView);
        const testMessage = 'Test message content';

        // Act
        webviewProvider.sendMessage(testMessage);

        // Assert
        verify(mockWebview.postMessage({
            type: 'receiveMessage',
            isSelf: false,
            text: testMessage,
            timestamp: anything()
        })).once();
    });

    test('sendSystemMessage should post system message to webview', () => {
        // Arrange
        (webviewProvider as any).currentView = instance(mockWebviewView);
        const testSystemMessage = 'Test system message';

        // Act
        webviewProvider.sendSystemMessage(testSystemMessage);

        // Assert
        verify(mockWebview.postMessage({
            type: 'systemMessage',
            text: testSystemMessage,
            timestamp: anything()
        })).once();
    });

    test('clearChat should post clear message to webview', () => {
        // Arrange
        (webviewProvider as any).currentView = instance(mockWebviewView);

        // Act
        webviewProvider.clearChat();

        // Assert
        verify(mockWebview.postMessage({
            type: 'clearChat'
        })).once();
    });

    test('createChatPanel should create WebviewPanel if not exists', () => {
        // Stub VS Code API
        const createWebviewPanelSpy = jest.spyOn(vscode.window, 'createWebviewPanel')
            .mockReturnValue(instance(mockWebviewPanel));

        // Act
        webviewProvider.createChatPanel();

        // Assert
        expect(createWebviewPanelSpy).toHaveBeenCalledWith(
            'chattymcchatface.chatPanel',
            'ChattyMcChatface',
            vscode.ViewColumn.Active,
            expect.any(Object)
        );
        // Should set HTML content
        verify(mockWebview.html = anything()).once();
    });

    test('createChatPanel should reveal existing panel if already exists', () => {
        // Arrange
        (webviewProvider as any).panel = instance(mockWebviewPanel);

        // Act
        webviewProvider.createChatPanel();

        // Assert
        verify(mockWebviewPanel.reveal(vscode.ViewColumn.Active)).once();
    });

    test('should handle message from webview', () => {
        // Arrange
        const messageListener = jest.fn();
        (webviewProvider as any).eventEmitter.on('message', messageListener);

        // Create a mock message handler
        const messageHandler = capture(mockWebview.onDidReceiveMessage).last()[0];
        const testMessage = { type: 'sendMessage', text: 'Hello' };

        // Act
        messageHandler(testMessage);

        // Assert
        expect(messageListener).toHaveBeenCalledWith(testMessage);
    });

    test('dispose should dispose panel if it exists', () => {
        // Arrange
        (webviewProvider as any).panel = instance(mockWebviewPanel);

        // Act
        webviewProvider.dispose();

        // Assert
        verify(mockWebviewPanel.dispose()).once();
    });
});