"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_mockito_1 = require("ts-mockito");
const MessageRenderer_1 = require("./MessageRenderer");
describe('MessageRenderer', () => {
    // Mock dependencies
    let mockWebviewProvider;
    // System under test
    let messageRenderer;
    // Test data
    const testMessage = 'Test message';
    beforeEach(() => {
        // Create mocks
        mockWebviewProvider = (0, ts_mockito_1.mock)();
        // Create system under test
        messageRenderer = new MessageRenderer_1.MessageRenderer((0, ts_mockito_1.instance)(mockWebviewProvider));
    });
    afterEach(() => {
        (0, ts_mockito_1.reset)(mockWebviewProvider);
    });
    describe('renderUserMessage', () => {
        it('should send message to webview provider when isSelf is true', () => {
            // Act
            messageRenderer.renderUserMessage(testMessage, true);
            // Assert
            (0, ts_mockito_1.verify)(mockWebviewProvider.sendMessage(testMessage)).once();
        });
        it('should send message to webview provider when isSelf is false', () => {
            // Act
            messageRenderer.renderUserMessage(testMessage, false);
            // Assert
            (0, ts_mockito_1.verify)(mockWebviewProvider.sendMessage(testMessage)).once();
        });
    });
    describe('renderSystemMessage', () => {
        it('should send system message to webview provider', () => {
            // Act
            messageRenderer.renderSystemMessage(testMessage);
            // Assert
            (0, ts_mockito_1.verify)(mockWebviewProvider.sendSystemMessage(testMessage)).once();
        });
    });
    describe('clearMessages', () => {
        it('should clear chat in webview provider', () => {
            // Act
            messageRenderer.clearMessages();
            // Assert
            (0, ts_mockito_1.verify)(mockWebviewProvider.clearChat()).once();
        });
    });
});
//# sourceMappingURL=MessageRenderer.test.js.map