"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_mockito_1 = require("ts-mockito");
const UIEventHandler_1 = require("./UIEventHandler");
describe('UIEventHandler', () => {
    // Mock dependencies
    let mockWebviewProvider;
    let mockNetworkManager;
    let mockEventEmitter;
    let mockEvent;
    let messageHandler;
    // System under test
    let uiEventHandler;
    // Test data
    const testMessage = 'Test message';
    beforeEach(() => {
        // Create mocks
        mockWebviewProvider = (0, ts_mockito_1.mock)();
        mockNetworkManager = (0, ts_mockito_1.mock)();
        mockEventEmitter = (0, ts_mockito_1.mock)();
        // Configure mocks
        (0, ts_mockito_1.when)(mockEventEmitter.event).thenReturn(mockEvent);
        (0, ts_mockito_1.when)(mockWebviewProvider.onDidReceiveMessage).thenReturn(mockEvent);
        // Create a mock event handler that captures the handler function
        mockEvent = (handler) => {
            messageHandler = handler;
            return { dispose: () => { } };
        };
        // Create system under test
        uiEventHandler = new UIEventHandler_1.UIEventHandler((0, ts_mockito_1.instance)(mockWebviewProvider), (0, ts_mockito_1.instance)(mockNetworkManager));
    });
    afterEach(() => {
        (0, ts_mockito_1.reset)(mockWebviewProvider);
        (0, ts_mockito_1.reset)(mockNetworkManager);
        (0, ts_mockito_1.reset)(mockEventEmitter);
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
            (0, ts_mockito_1.verify)(mockNetworkManager.sendMessage(testMessage)).once();
        });
    });
    describe('handleClearChat', () => {
        it('should clear chat in webview provider', () => {
            // Act
            uiEventHandler.handleClearChat();
            // Assert
            (0, ts_mockito_1.verify)(mockWebviewProvider.clearChat()).once();
        });
    });
    describe('message event handling', () => {
        it('should handle sendMessage event from webview', () => {
            // Arrange
            uiEventHandler.initializeEventListeners();
            // Act
            messageHandler({ type: 'sendMessage', text: testMessage });
            // Assert
            (0, ts_mockito_1.verify)(mockNetworkManager.sendMessage(testMessage)).once();
        });
        it('should ignore unknown event types', () => {
            // Arrange
            uiEventHandler.initializeEventListeners();
            // Act
            messageHandler({ type: 'unknownType', text: testMessage });
            // Assert
            (0, ts_mockito_1.verify)(mockNetworkManager.sendMessage((0, ts_mockito_1.anything)())).never();
            (0, ts_mockito_1.verify)(mockWebviewProvider.clearChat()).never();
        });
    });
});
//# sourceMappingURL=UIEventHandler.test.js.map