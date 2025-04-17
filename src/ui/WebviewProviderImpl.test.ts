import * as vscode from 'vscode';
import { mock, instance, verify, when, anything, reset, capture } from 'ts-mockito';
import { WebviewProviderImpl } from './WebviewProviderImpl';
import { ILogger } from '../interfaces';

describe('WebviewProviderImpl', () => {
    // Mock dependencies
    let mockLogger: ILogger;
    let mockWebviewView: vscode.WebviewView;
    let mockWebview: vscode.Webview;
    let mockWebviewPanel: vscode.WebviewPanel;
    let mockEventEmitter: vscode.EventEmitter<any>;
    let mockEvent: vscode.Event<any>;
    let mockDisposable: vscode.Disposable;
    
    // System under test
    let webviewProvider: WebviewProviderImpl;
    
    // Test data
    const testExtensionUri = { fsPath: '/test/extension/path' } as vscode.Uri;
    const testMessage = 'Test message';
    
    beforeEach(() => {
        // Create mocks
        mockLogger = mock<ILogger>();
        mockWebviewView = mock<vscode.WebviewView>();
        mockWebview = mock<vscode.Webview>();
        mockWebviewPanel = mock<vscode.WebviewPanel>();
        mockEventEmitter = mock<vscode.EventEmitter<any>>();
        mockDisposable = mock<vscode.Disposable>();
        
        // Configure mocks
        when(mockWebviewView.webview).thenReturn(instance(mockWebview));
        when(mockWebviewPanel.webview).thenReturn(instance(mockWebview));
        when(mockEventEmitter.event).thenReturn(mockEvent);
        
        // Create system under test
        webviewProvider = new WebviewProviderImpl(testExtensionUri, instance(mockLogger));
    });
    
    afterEach(() => {
        reset(mockLogger);
        reset(mockWebviewView);
        reset(mockWebview);
        reset(mockWebviewPanel);
        reset(mockEventEmitter);
        reset(mockDisposable);
    });
    
    describe('resolveWebviewView', () => {
        it('should set up the webview view correctly', () => {
            // Arrange
            const mockContext = mock<vscode.WebviewViewResolveContext>();
            const mockToken = mock<vscode.CancellationToken>();
            
            // Act
            webviewProvider.resolveWebviewView(
                instance(mockWebviewView),
                instance(mockContext),
                instance(mockToken)
            );
            
            // Assert
            verify(mockWebviewView.webview.options = anything()).once();
            verify(mockWebviewView.webview.html = anything()).once();
            verify(mockWebviewView.onDidDispose(anything())).once();
        });
    });
    
    describe('createChatPanel', () => {
        it('should create and configure a webview panel', () => {
            // Arrange
            // Mock vscode.window.createWebviewPanel
            const originalCreateWebviewPanel = vscode.window.createWebviewPanel;
            vscode.window.createWebviewPanel = jest.fn().mockReturnValue(instance(mockWebviewPanel));
            
            // Act
            const result = webviewProvider.createChatPanel();
            
            // Assert
            expect(vscode.window.createWebviewPanel).toHaveBeenCalledWith(
                'chattymcchatface.chatPanel',
                'ChattyMcChatface',
                expect.anything(),
                expect.objectContaining({
                    enableScripts: true,
                    localResourceRoots: [testExtensionUri],
                    retainContextWhenHidden: true
                })
            );
            expect(result).toBe(instance(mockWebviewPanel));
            
            // Restore original
            vscode.window.createWebviewPanel = originalCreateWebviewPanel;
        });
    });
    
    describe('updateConnectionStatus', () => {
        it('should post connection status message to webview', () => {
            // Arrange
            webviewProvider['_view'] = instance(mockWebviewView);
            
            // Act
            webviewProvider.updateConnectionStatus(true);
            
            // Assert
            verify(mockWebview.postMessage(
                { type: 'connectionStatus', connected: true }
            )).once();
        });
        
        it('should not post message if view is undefined', () => {
            // Arrange
            webviewProvider['_view'] = undefined;
            
            // Act
            webviewProvider.updateConnectionStatus(true);
            
            // Assert
            verify(mockWebview.postMessage(anything())).never();
        });
    });
    
    describe('sendMessage', () => {
        it('should post message to webview', () => {
            // Arrange
            webviewProvider['_view'] = instance(mockWebviewView);
            
            // Act
            webviewProvider.sendMessage(testMessage);
            
            // Assert
            verify(mockWebview.postMessage(
                { type: 'receiveMessage', text: testMessage }
            )).once();
        });
        
        it('should not post message if view is undefined', () => {
            // Arrange
            webviewProvider['_view'] = undefined;
            
            // Act
            webviewProvider.sendMessage(testMessage);
            
            // Assert
            verify(mockWebview.postMessage(anything())).never();
        });
    });
    
    describe('sendSystemMessage', () => {
        it('should post system message to webview', () => {
            // Arrange
            webviewProvider['_view'] = instance(mockWebviewView);
            
            // Act
            webviewProvider.sendSystemMessage(testMessage);
            
            // Assert
            verify(mockWebview.postMessage(
                { type: 'systemMessage', text: testMessage }
            )).once();
        });
        
        it('should not post message if view is undefined', () => {
            // Arrange
            webviewProvider['_view'] = undefined;
            
            // Act
            webviewProvider.sendSystemMessage(testMessage);
            
            // Assert
            verify(mockWebview.postMessage(anything())).never();
        });
    });
    
    describe('clearChat', () => {
        it('should post clear chat message to webview', () => {
            // Arrange
            webviewProvider['_view'] = instance(mockWebviewView);
            
            // Act
            webviewProvider.clearChat();
            
            // Assert
            verify(mockWebview.postMessage({ type: 'clearChat' })).once();
        });
        
        it('should not post message if view is undefined', () => {
            // Arrange
            webviewProvider['_view'] = undefined;
            
            // Act
            webviewProvider.clearChat();
            
            // Assert
            verify(mockWebview.postMessage(anything())).never();
        });
    });
    
    describe('dispose', () => {
        it('should dispose all disposables', () => {
            // Arrange
            webviewProvider['_disposables'] = [instance(mockDisposable), instance(mockDisposable)];
            
            // Act
            webviewProvider.dispose();
            
            // Assert
            verify(mockDisposable.dispose()).times(2);
            expect(webviewProvider['_disposables'].length).toBe(0);
        });
    });
});
