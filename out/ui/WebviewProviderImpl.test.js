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
const WebviewProviderImpl_1 = require("./WebviewProviderImpl");
describe('WebviewProviderImpl', () => {
    // Mock dependencies
    let mockLogger;
    let mockWebviewView;
    let mockWebview;
    let mockWebviewPanel;
    let mockEventEmitter;
    let mockEvent;
    let mockDisposable;
    // System under test
    let webviewProvider;
    // Test data
    const testExtensionUri = { fsPath: '/test/extension/path' };
    const testMessage = 'Test message';
    beforeEach(() => {
        // Create mocks
        mockLogger = (0, ts_mockito_1.mock)();
        mockWebviewView = (0, ts_mockito_1.mock)();
        mockWebview = (0, ts_mockito_1.mock)();
        mockWebviewPanel = (0, ts_mockito_1.mock)();
        mockEventEmitter = (0, ts_mockito_1.mock)();
        mockDisposable = (0, ts_mockito_1.mock)();
        // Configure mocks
        (0, ts_mockito_1.when)(mockWebviewView.webview).thenReturn((0, ts_mockito_1.instance)(mockWebview));
        (0, ts_mockito_1.when)(mockWebviewPanel.webview).thenReturn((0, ts_mockito_1.instance)(mockWebview));
        (0, ts_mockito_1.when)(mockEventEmitter.event).thenReturn(mockEvent);
        // Create system under test
        webviewProvider = new WebviewProviderImpl_1.WebviewProviderImpl(testExtensionUri, (0, ts_mockito_1.instance)(mockLogger));
    });
    afterEach(() => {
        (0, ts_mockito_1.reset)(mockLogger);
        (0, ts_mockito_1.reset)(mockWebviewView);
        (0, ts_mockito_1.reset)(mockWebview);
        (0, ts_mockito_1.reset)(mockWebviewPanel);
        (0, ts_mockito_1.reset)(mockEventEmitter);
        (0, ts_mockito_1.reset)(mockDisposable);
    });
    describe('resolveWebviewView', () => {
        it('should set up the webview view correctly', () => {
            // Arrange
            const mockContext = (0, ts_mockito_1.mock)();
            const mockToken = (0, ts_mockito_1.mock)();
            // Act
            webviewProvider.resolveWebviewView((0, ts_mockito_1.instance)(mockWebviewView), (0, ts_mockito_1.instance)(mockContext), (0, ts_mockito_1.instance)(mockToken));
            // Assert
            (0, ts_mockito_1.verify)(mockWebviewView.webview.options = (0, ts_mockito_1.anything)()).once();
            (0, ts_mockito_1.verify)(mockWebviewView.webview.html = (0, ts_mockito_1.anything)()).once();
            (0, ts_mockito_1.verify)(mockWebviewView.onDidDispose((0, ts_mockito_1.anything)())).once();
        });
    });
    describe('createChatPanel', () => {
        it('should create and configure a webview panel', () => {
            // Arrange
            // Mock vscode.window.createWebviewPanel
            const originalCreateWebviewPanel = vscode.window.createWebviewPanel;
            vscode.window.createWebviewPanel = jest.fn().mockReturnValue((0, ts_mockito_1.instance)(mockWebviewPanel));
            // Act
            const result = webviewProvider.createChatPanel();
            // Assert
            expect(vscode.window.createWebviewPanel).toHaveBeenCalledWith('chattymcchatface.chatPanel', 'ChattyMcChatface', expect.anything(), expect.objectContaining({
                enableScripts: true,
                localResourceRoots: [testExtensionUri],
                retainContextWhenHidden: true
            }));
            expect(result).toBe((0, ts_mockito_1.instance)(mockWebviewPanel));
            // Restore original
            vscode.window.createWebviewPanel = originalCreateWebviewPanel;
        });
    });
    describe('updateConnectionStatus', () => {
        it('should post connection status message to webview', () => {
            // Arrange
            webviewProvider['_view'] = (0, ts_mockito_1.instance)(mockWebviewView);
            // Act
            webviewProvider.updateConnectionStatus(true);
            // Assert
            (0, ts_mockito_1.verify)(mockWebview.postMessage({ type: 'connectionStatus', connected: true })).once();
        });
        it('should not post message if view is undefined', () => {
            // Arrange
            webviewProvider['_view'] = undefined;
            // Act
            webviewProvider.updateConnectionStatus(true);
            // Assert
            (0, ts_mockito_1.verify)(mockWebview.postMessage((0, ts_mockito_1.anything)())).never();
        });
    });
    describe('sendMessage', () => {
        it('should post message to webview', () => {
            // Arrange
            webviewProvider['_view'] = (0, ts_mockito_1.instance)(mockWebviewView);
            // Act
            webviewProvider.sendMessage(testMessage);
            // Assert
            (0, ts_mockito_1.verify)(mockWebview.postMessage({ type: 'receiveMessage', text: testMessage })).once();
        });
        it('should not post message if view is undefined', () => {
            // Arrange
            webviewProvider['_view'] = undefined;
            // Act
            webviewProvider.sendMessage(testMessage);
            // Assert
            (0, ts_mockito_1.verify)(mockWebview.postMessage((0, ts_mockito_1.anything)())).never();
        });
    });
    describe('sendSystemMessage', () => {
        it('should post system message to webview', () => {
            // Arrange
            webviewProvider['_view'] = (0, ts_mockito_1.instance)(mockWebviewView);
            // Act
            webviewProvider.sendSystemMessage(testMessage);
            // Assert
            (0, ts_mockito_1.verify)(mockWebview.postMessage({ type: 'systemMessage', text: testMessage })).once();
        });
        it('should not post message if view is undefined', () => {
            // Arrange
            webviewProvider['_view'] = undefined;
            // Act
            webviewProvider.sendSystemMessage(testMessage);
            // Assert
            (0, ts_mockito_1.verify)(mockWebview.postMessage((0, ts_mockito_1.anything)())).never();
        });
    });
    describe('clearChat', () => {
        it('should post clear chat message to webview', () => {
            // Arrange
            webviewProvider['_view'] = (0, ts_mockito_1.instance)(mockWebviewView);
            // Act
            webviewProvider.clearChat();
            // Assert
            (0, ts_mockito_1.verify)(mockWebview.postMessage({ type: 'clearChat' })).once();
        });
        it('should not post message if view is undefined', () => {
            // Arrange
            webviewProvider['_view'] = undefined;
            // Act
            webviewProvider.clearChat();
            // Assert
            (0, ts_mockito_1.verify)(mockWebview.postMessage((0, ts_mockito_1.anything)())).never();
        });
    });
    describe('dispose', () => {
        it('should dispose all disposables', () => {
            // Arrange
            webviewProvider['_disposables'] = [(0, ts_mockito_1.instance)(mockDisposable), (0, ts_mockito_1.instance)(mockDisposable)];
            // Act
            webviewProvider.dispose();
            // Assert
            (0, ts_mockito_1.verify)(mockDisposable.dispose()).times(2);
            expect(webviewProvider['_disposables'].length).toBe(0);
        });
    });
});
//# sourceMappingURL=WebviewProviderImpl.test.js.map