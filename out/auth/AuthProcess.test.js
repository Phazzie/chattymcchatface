"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AuthProcess_1 = require("./AuthProcess");
const constants_1 = require("../constants");
describe('AuthProcess', () => {
    // Mock dependencies
    let mockTimer;
    let mockLogger;
    let mockSendMessage;
    let mockTimeoutHandle;
    // System under test
    let authProcess;
    // Test data
    const testConnectionId = 'test-connection-id';
    const testIsInitiator = true;
    beforeEach(() => {
        // Create mocks
        mockTimeoutHandle = {};
        mockTimer = {
            set: jest.fn().mockReturnValue(mockTimeoutHandle),
            clear: jest.fn()
        };
        mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn()
        };
        mockSendMessage = jest.fn().mockReturnValue(true);
        // Create system under test
        authProcess = new AuthProcess_1.AuthProcess(testConnectionId, testIsInitiator, mockSendMessage, mockTimer, mockLogger);
    });
    describe('start', () => {
        it('should set a timeout', () => {
            // Act
            authProcess.start();
            // Assert
            expect(mockTimer.set).toHaveBeenCalledWith(expect.any(Function), constants_1.AUTH.TIMEOUT);
        });
        it('should send an auth request if initiator', () => {
            // Act
            authProcess.start();
            // Assert
            expect(mockSendMessage).toHaveBeenCalledWith(expect.stringContaining(constants_1.AUTH.MESSAGE_TYPES.AUTH_REQ));
            expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Starting'));
        });
        it('should not send an auth request if not initiator', () => {
            // Arrange
            authProcess = new AuthProcess_1.AuthProcess(testConnectionId, false, // not initiator
            mockSendMessage, mockTimer, mockLogger);
            // Act
            authProcess.start();
            // Assert
            expect(mockSendMessage).not.toHaveBeenCalled();
            expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Starting'));
        });
        it('should do nothing if already started', () => {
            // Arrange
            authProcess.start(); // Start once
            mockSendMessage.mockClear();
            mockLogger.info.mockClear();
            // Act
            authProcess.start(); // Start again
            // Assert
            expect(mockSendMessage).not.toHaveBeenCalled();
            expect(mockLogger.info).not.toHaveBeenCalled();
        });
    });
    describe('handleMessage', () => {
        beforeEach(() => {
            // Start the auth process
            authProcess.start();
            mockSendMessage.mockClear();
        });
        it('should handle AUTH_REQ message when in AWAITING_REQ state', () => {
            // Arrange
            authProcess = new AuthProcess_1.AuthProcess(testConnectionId, false, // not initiator
            mockSendMessage, mockTimer, mockLogger);
            authProcess.start(); // Sets state to AWAITING_REQ
            mockSendMessage.mockClear();
            // Act
            authProcess.handleMessage({ type: constants_1.AUTH.MESSAGE_TYPES.AUTH_REQ });
            // Assert
            expect(mockSendMessage).toHaveBeenCalledWith(expect.stringContaining(constants_1.AUTH.MESSAGE_TYPES.AUTH_RESP));
        });
        it('should fail if AUTH_REQ received in wrong state', () => {
            // Act - initiator starts in AWAITING_RESP state
            authProcess.handleMessage({ type: constants_1.AUTH.MESSAGE_TYPES.AUTH_REQ });
            // Assert
            expect(mockSendMessage).toHaveBeenCalledWith(expect.stringContaining(constants_1.AUTH.MESSAGE_TYPES.AUTH_FAIL));
            expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Aborting'));
        });
        it('should handle AUTH_RESP message when in AWAITING_RESP state', () => {
            // Act
            authProcess.handleMessage({ type: constants_1.AUTH.MESSAGE_TYPES.AUTH_RESP });
            // Assert
            expect(mockSendMessage).toHaveBeenCalledWith(expect.stringContaining(constants_1.AUTH.MESSAGE_TYPES.AUTH_SUCCESS));
            // Should emit authenticated event
            const spy = jest.fn();
            authProcess.on('authenticated', spy);
            authProcess.emit('authenticated', testConnectionId);
            expect(spy).toHaveBeenCalledWith(testConnectionId);
        });
        it('should fail if AUTH_RESP received in wrong state', () => {
            // Arrange
            authProcess = new AuthProcess_1.AuthProcess(testConnectionId, false, // not initiator
            mockSendMessage, mockTimer, mockLogger);
            authProcess.start(); // Sets state to AWAITING_REQ
            mockSendMessage.mockClear();
            // Act
            authProcess.handleMessage({ type: constants_1.AUTH.MESSAGE_TYPES.AUTH_RESP });
            // Assert
            expect(mockSendMessage).toHaveBeenCalledWith(expect.stringContaining(constants_1.AUTH.MESSAGE_TYPES.AUTH_FAIL));
        });
        it('should handle AUTH_SUCCESS message when in AWAITING_SUCCESS state', () => {
            // Arrange
            authProcess = new AuthProcess_1.AuthProcess(testConnectionId, false, // not initiator
            mockSendMessage, mockTimer, mockLogger);
            authProcess.start(); // Sets state to AWAITING_REQ
            authProcess.handleMessage({ type: constants_1.AUTH.MESSAGE_TYPES.AUTH_REQ }); // Sets state to AWAITING_SUCCESS
            mockSendMessage.mockClear();
            // Act
            authProcess.handleMessage({ type: constants_1.AUTH.MESSAGE_TYPES.AUTH_SUCCESS });
            // Assert
            // Should emit authenticated event
            const spy = jest.fn();
            authProcess.on('authenticated', spy);
            authProcess.emit('authenticated', testConnectionId);
            expect(spy).toHaveBeenCalledWith(testConnectionId);
        });
        it('should fail if AUTH_SUCCESS received in wrong state', () => {
            // Act - initiator starts in AWAITING_RESP state
            authProcess.handleMessage({ type: constants_1.AUTH.MESSAGE_TYPES.AUTH_SUCCESS });
            // Assert
            expect(mockSendMessage).toHaveBeenCalledWith(expect.stringContaining(constants_1.AUTH.MESSAGE_TYPES.AUTH_FAIL));
        });
        it('should handle AUTH_FAIL message in any state', () => {
            // Act
            authProcess.handleMessage({
                type: constants_1.AUTH.MESSAGE_TYPES.AUTH_FAIL,
                payload: { reason: 'Test failure' }
            });
            // Assert
            // Should emit failed event
            const spy = jest.fn();
            authProcess.on('failed', spy);
            authProcess.emit('failed', testConnectionId, 'Test failure');
            expect(spy).toHaveBeenCalledWith(testConnectionId, 'Test failure');
        });
        it('should reset timeout on any message', () => {
            // Arrange
            mockTimer.set.mockClear();
            // Act
            authProcess.handleMessage({ type: constants_1.AUTH.MESSAGE_TYPES.AUTH_RESP });
            // Assert
            expect(mockTimer.clear).toHaveBeenCalledWith(mockTimeoutHandle);
            expect(mockTimer.set).toHaveBeenCalledWith(expect.any(Function), constants_1.AUTH.TIMEOUT);
        });
        it('should ignore messages if already done', () => {
            // Arrange
            authProcess.handleMessage({ type: constants_1.AUTH.MESSAGE_TYPES.AUTH_RESP }); // Completes auth
            mockSendMessage.mockClear();
            // Act
            authProcess.handleMessage({ type: constants_1.AUTH.MESSAGE_TYPES.AUTH_REQ });
            // Assert
            expect(mockSendMessage).not.toHaveBeenCalled();
        });
    });
    describe('abort', () => {
        it('should clear timeout and emit failed event', () => {
            // Arrange
            authProcess.start();
            const spy = jest.fn();
            authProcess.on('failed', spy);
            // Act
            authProcess.abort('Test abort reason');
            // Assert
            expect(mockTimer.clear).toHaveBeenCalledWith(mockTimeoutHandle);
            expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('Aborting'));
            expect(spy).toHaveBeenCalledWith(testConnectionId, 'Test abort reason');
        });
        it('should not send fail message when aborted', () => {
            // Arrange
            authProcess.start();
            mockSendMessage.mockClear();
            // Act
            authProcess.abort('Test abort reason');
            // Assert
            expect(mockSendMessage).not.toHaveBeenCalled();
        });
    });
    describe('timeout handling', () => {
        it('should fail authentication on timeout', () => {
            // Arrange
            authProcess.start();
            const spy = jest.fn();
            authProcess.on('failed', spy);
            // Act - simulate timeout callback
            const timeoutCallback = mockTimer.set.mock.calls[0][0];
            timeoutCallback();
            // Assert
            expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('failed'));
            expect(mockSendMessage).toHaveBeenCalledWith(expect.stringContaining(constants_1.AUTH.MESSAGE_TYPES.AUTH_FAIL));
            expect(spy).toHaveBeenCalledWith(testConnectionId, expect.stringContaining('timed out'));
        });
    });
    describe('getConnectionId', () => {
        it('should return the connection ID', () => {
            // Act & Assert
            expect(authProcess.getConnectionId()).toBe(testConnectionId);
        });
    });
});
//# sourceMappingURL=AuthProcess.test.js.map