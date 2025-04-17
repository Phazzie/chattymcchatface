import { mock, instance, verify, when, anything, reset } from 'ts-mockito';
import { MessageRenderer } from './MessageRenderer';
import { IWebviewProvider } from './interfaces/IWebviewProvider';

describe('MessageRenderer', () => {
    // Mock dependencies
    let mockWebviewProvider: IWebviewProvider;
    
    // System under test
    let messageRenderer: MessageRenderer;
    
    // Test data
    const testMessage = 'Test message';
    
    beforeEach(() => {
        // Create mocks
        mockWebviewProvider = mock<IWebviewProvider>();
        
        // Create system under test
        messageRenderer = new MessageRenderer(instance(mockWebviewProvider));
    });
    
    afterEach(() => {
        reset(mockWebviewProvider);
    });
    
    describe('renderUserMessage', () => {
        it('should send message to webview provider when isSelf is true', () => {
            // Act
            messageRenderer.renderUserMessage(testMessage, true);
            
            // Assert
            verify(mockWebviewProvider.sendMessage(testMessage)).once();
        });
        
        it('should send message to webview provider when isSelf is false', () => {
            // Act
            messageRenderer.renderUserMessage(testMessage, false);
            
            // Assert
            verify(mockWebviewProvider.sendMessage(testMessage)).once();
        });
    });
    
    describe('renderSystemMessage', () => {
        it('should send system message to webview provider', () => {
            // Act
            messageRenderer.renderSystemMessage(testMessage);
            
            // Assert
            verify(mockWebviewProvider.sendSystemMessage(testMessage)).once();
        });
    });
    
    describe('clearMessages', () => {
        it('should clear chat in webview provider', () => {
            // Act
            messageRenderer.clearMessages();
            
            // Assert
            verify(mockWebviewProvider.clearChat()).once();
        });
    });
});
