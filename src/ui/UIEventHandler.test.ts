import { mock, instance, verify, when, anything, reset, capture } from 'ts-mockito';
import { UIEventHandler } from './UIEventHandler';
import { IWebviewProvider } from './interfaces/IWebviewProvider';
import { INetworkManager } from '../network/interfaces/INetworkManager';
import * as vscode from 'vscode';

describe('UIEventHandler', () => {
    // Mock dependencies
    let mockWebviewProvider: IWebviewProvider;
    let mockNetworkManager: INetworkManager;
    let mockEventEmitter: vscode.EventEmitter<any>;
    let mockEvent: vscode.Event<any>;
    let messageHandler: (message: any) => void;
    
    // System under test
    let uiEventHandler: UIEventHandler;
    
    // Test data
    const testMessage = 'Test message';
    
    beforeEach(() => {
        // Create mocks
        mockWebviewProvider = mock<IWebviewProvider>();
        mockNetworkManager = mock<INetworkManager>();
        mockEventEmitter = mock<vscode.EventEmitter<any>>();
        
        // Configure mocks
        when(mockEventEmitter.event).thenReturn(mockEvent);
        when(mockWebviewProvider.onDidReceiveMessage).thenReturn(mockEvent);
        
        // Create a mock event handler that captures the handler function
        mockEvent = (handler: (e: any) => any) => {
            messageHandler = handler;
            return { dispose: () => {} } as vscode.Disposable;
        };
        
        // Create system under test
        uiEventHandler = new UIEventHandler(instance(mockWebviewProvider), instance(mockNetworkManager));
    });
    
    afterEach(() => {
        reset(mockWebviewProvider);
        reset(mockNetworkManager);
        reset(mockEventEmitter);
    });
    
    describe('initializeEventListeners', () => {
        it('should register event listener for webview messages', () => {
            // Act
            uiEventHandler.initializeEventListeners();
            
            // Assert - This is a bit tricky to test directly, but we can verify the event was subscribed to
            expect(messageHandler).toBeDefined();
        });
    });
    
    describe('handleSendMessage', () => {
        it('should send message through network manager', () => {
            // Act
            uiEventHandler.handleSendMessage(testMessage);
            
            // Assert
            verify(mockNetworkManager.sendMessage(testMessage)).once();
        });
    });
    
    describe('handleClearChat', () => {
        it('should clear chat in webview provider', () => {
            // Act
            uiEventHandler.handleClearChat();
            
            // Assert
            verify(mockWebviewProvider.clearChat()).once();
        });
    });
    
    describe('message event handling', () => {
        it('should handle sendMessage event from webview', () => {
            // Arrange
            uiEventHandler.initializeEventListeners();
            
            // Act
            messageHandler({ type: 'sendMessage', text: testMessage });
            
            // Assert
            verify(mockNetworkManager.sendMessage(testMessage)).once();
        });
        
        it('should ignore unknown event types', () => {
            // Arrange
            uiEventHandler.initializeEventListeners();
            
            // Act
            messageHandler({ type: 'unknownType', text: testMessage });
            
            // Assert
            verify(mockNetworkManager.sendMessage(anything())).never();
            verify(mockWebviewProvider.clearChat()).never();
        });
    });
});
