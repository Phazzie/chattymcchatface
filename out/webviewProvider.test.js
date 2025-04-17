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
const vscode = __importStar(require("vscode"));
const ts_mockito_1 = require("ts-mockito");
const webviewProvider_1 = require("./webviewProvider");
describe('WebviewProvider', () => {
    let webviewProvider;
    let mockWebviewView;
    let mockWebviewPanel;
    let mockWebview;
    const testExtensionUri = { fsPath: '/test/extension/path' };
    beforeEach(() => {
        // Create mocks
        mockWebview = (0, ts_mockito_1.mock)();
        mockWebviewView = (0, ts_mockito_1.mock)();
        mockWebviewPanel = (0, ts_mockito_1.mock)();
        // Setup webview mock
        (0, ts_mockito_1.when)(mockWebview.postMessage((0, ts_mockito_1.anything)())).thenReturn(Promise.resolve(true));
        (0, ts_mockito_1.when)(mockWebview.html).thenReturn('');
        // Setup webview view mock to return our webview mock
        (0, ts_mockito_1.when)(mockWebviewView.webview).thenReturn((0, ts_mockito_1.instance)(mockWebview));
        (0, ts_mockito_1.when)(mockWebviewView.visible).thenReturn(true);
        // Setup webview panel mock
        (0, ts_mockito_1.when)(mockWebviewPanel.webview).thenReturn((0, ts_mockito_1.instance)(mockWebview));
        // Create the WebviewProvider instance
        webviewProvider = new webviewProvider_1.WebviewProvider(testExtensionUri);
        // Reset mocks before each test
        jest.clearAllMocks();
        (0, ts_mockito_1.reset)(mockWebview);
        (0, ts_mockito_1.reset)(mockWebviewView);
        (0, ts_mockito_1.reset)(mockWebviewPanel);
    });
    test('resolveWebviewView should initialize the webview', () => {
        // Stub createPanel method
        jest.spyOn(webviewProvider_1.WebviewProvider.prototype, 'createPanel').mockImplementation(() => { });
        // Act
        webviewProvider.resolveWebviewView((0, ts_mockito_1.instance)(mockWebviewView));
        // Assert
        (0, ts_mockito_1.verify)(mockWebviewView.webview.options).once();
        // Should set HTML content
        (0, ts_mockito_1.verify)(mockWebview.html = (0, ts_mockito_1.anything)()).once();
    });
    test('updateConnectionStatus should post status message to webview', () => {
        // Arrange
        webviewProvider.currentView = (0, ts_mockito_1.instance)(mockWebviewView);
        // Act
        webviewProvider.updateConnectionStatus(true);
        // Assert
        (0, ts_mockito_1.verify)(mockWebview.postMessage({
            type: 'updateStatus',
            connected: true
        })).once();
    });
    test('sendMessage should post message to webview', () => {
        // Arrange
        webviewProvider.currentView = (0, ts_mockito_1.instance)(mockWebviewView);
        const testMessage = 'Test message content';
        // Act
        webviewProvider.sendMessage(testMessage);
        // Assert
        (0, ts_mockito_1.verify)(mockWebview.postMessage({
            type: 'receiveMessage',
            isSelf: false,
            text: testMessage,
            timestamp: (0, ts_mockito_1.anything)()
        })).once();
    });
    test('sendSystemMessage should post system message to webview', () => {
        // Arrange
        webviewProvider.currentView = (0, ts_mockito_1.instance)(mockWebviewView);
        const testSystemMessage = 'Test system message';
        // Act
        webviewProvider.sendSystemMessage(testSystemMessage);
        // Assert
        (0, ts_mockito_1.verify)(mockWebview.postMessage({
            type: 'systemMessage',
            text: testSystemMessage,
            timestamp: (0, ts_mockito_1.anything)()
        })).once();
    });
    test('clearChat should post clear message to webview', () => {
        // Arrange
        webviewProvider.currentView = (0, ts_mockito_1.instance)(mockWebviewView);
        // Act
        webviewProvider.clearChat();
        // Assert
        (0, ts_mockito_1.verify)(mockWebview.postMessage({
            type: 'clearChat'
        })).once();
    });
    test('createChatPanel should create WebviewPanel if not exists', () => {
        // Stub VS Code API
        const createWebviewPanelSpy = jest.spyOn(vscode.window, 'createWebviewPanel')
            .mockReturnValue((0, ts_mockito_1.instance)(mockWebviewPanel));
        // Act
        webviewProvider.createChatPanel();
        // Assert
        expect(createWebviewPanelSpy).toHaveBeenCalledWith('chattymcchatface.chatPanel', 'ChattyMcChatface', vscode.ViewColumn.Active, expect.any(Object));
        // Should set HTML content
        (0, ts_mockito_1.verify)(mockWebview.html = (0, ts_mockito_1.anything)()).once();
    });
    test('createChatPanel should reveal existing panel if already exists', () => {
        // Arrange
        webviewProvider.panel = (0, ts_mockito_1.instance)(mockWebviewPanel);
        // Act
        webviewProvider.createChatPanel();
        // Assert
        (0, ts_mockito_1.verify)(mockWebviewPanel.reveal(vscode.ViewColumn.Active)).once();
    });
    test('should handle message from webview', () => {
        // Arrange
        const messageListener = jest.fn();
        webviewProvider.eventEmitter.on('message', messageListener);
        // Create a mock message handler
        const messageHandler = (0, ts_mockito_1.capture)(mockWebview.onDidReceiveMessage).last()[0];
        const testMessage = { type: 'sendMessage', text: 'Hello' };
        // Act
        messageHandler(testMessage);
        // Assert
        expect(messageListener).toHaveBeenCalledWith(testMessage);
    });
    test('dispose should dispose panel if it exists', () => {
        // Arrange
        webviewProvider.panel = (0, ts_mockito_1.instance)(mockWebviewPanel);
        // Act
        webviewProvider.dispose();
        // Assert
        (0, ts_mockito_1.verify)(mockWebviewPanel.dispose()).once();
    });
});
//# sourceMappingURL=webviewProvider.test.js.map