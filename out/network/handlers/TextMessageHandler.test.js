"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TextMessageHandler_1 = require("./TextMessageHandler");
const IMessage_1 = require("../interfaces/IMessage");
const TextMessage_1 = require("../messages/TextMessage");
describe('TextMessageHandler', () => {
    let mockLogger;
    let mockMessageHandler;
    let textMessageHandler;
    let registeredHandler;
    beforeEach(() => {
        mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };
        mockMessageHandler = {
            registerHandler: jest.fn((type, handler) => {
                if (type === IMessage_1.MessageType.TEXT) {
                    registeredHandler = handler;
                }
            }),
            handleMessage: jest.fn(),
            unregisterHandler: jest.fn(),
            on: jest.fn(),
            once: jest.fn(),
            emit: jest.fn()
        };
        textMessageHandler = new TextMessageHandler_1.TextMessageHandler(mockLogger, mockMessageHandler);
    });
    it('should register a handler for TEXT messages', () => {
        expect(mockMessageHandler.registerHandler).toHaveBeenCalledWith(IMessage_1.MessageType.TEXT, expect.any(Function));
    });
    it('should handle valid TEXT messages', () => {
        const connectionId = 'test-connection';
        const message = new TextMessage_1.TextMessage('Hello, world!');
        const result = registeredHandler(connectionId, message);
        expect(result).toBe(true);
        expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining(`Received TEXT message from ${connectionId}`));
    });
    it('should reject invalid TEXT messages', () => {
        const connectionId = 'test-connection';
        const message = new TextMessage_1.TextMessage('');
        const result = registeredHandler(connectionId, message);
        expect(result).toBe(false);
        expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining(`Invalid TEXT message from ${connectionId}`));
    });
});
//# sourceMappingURL=TextMessageHandler.test.js.map