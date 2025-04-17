"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_mockito_1 = require("ts-mockito");
const events_1 = require("events");
const authService_1 = require("./authService");
const constants_1 = require("../constants");
// Mock EventEmitter methods for IAuthService
class MockAuthService extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this.startAuthentication = jest.fn();
        this.handleMessage = jest.fn();
        this.isAuthenticating = jest.fn();
        this.isAuthenticated = jest.fn();
        this.cancelAuthentication = jest.fn();
        this.cleanupConnection = jest.fn();
    }
}
describe('AuthService', () => {
    let authService;
    let mockLogger;
    let mockSendMessageCallback;
    const connectionId = 'test-conn-123';
    const validAnimalNames = ['Lion', 'Tiger', 'Bear'];
    const invalidAnimalNames = ['Cat', 'Dog', 'Mouse'];
    beforeEach(() => {
        mockLogger = (0, ts_mockito_1.mock)();
        mockSendMessageCallback = jest.fn();
        authService = new authService_1.AuthService((0, ts_mockito_1.instance)(mockLogger));
        // Mock timers
        jest.useFakeTimers();
    });
    afterEach(() => {
        // Restore timers
        jest.useRealTimers();
        (0, ts_mockito_1.reset)(mockLogger);
    });
    // Helper function to simulate receiving a message
    const simulateMessage = (type, payload) => {
        const message = { type, payload };
        return authService.handleMessage(connectionId, message);
    };
    // --- Test Cases ---
    test('should initialize in IDLE state', () => {
        expect(authService.isAuthenticating(connectionId)).toBe(false);
        expect(authService.isAuthenticated(connectionId)).toBe(false);
    });
    // --- Initiator (Client) Flow ---
    test('[Client] startAuthentication should transition to WAITING_FOR_AUTH_REQ and set timeout', () => {
        authService.startAuthentication(connectionId, true, mockSendMessageCallback);
        expect(authService['states'].get(connectionId)?.state).toBe('WAITING_FOR_AUTH_REQ');
        expect(authService.isAuthenticating(connectionId)).toBe(true);
        expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), constants_1.AUTH.TIMEOUT);
        (0, ts_mockito_1.verify)(mockLogger.info((0, ts_mockito_1.anything)())).once(); // Log start
    });
    test('[Client] should handle AUTH_REQ, emit promptForUserInput, and transition state', (done) => {
        authService.startAuthentication(connectionId, true, mockSendMessageCallback);
        authService.on('promptForUserInput', (connId, prompt, isValidation) => {
            expect(connId).toBe(connectionId);
            expect(prompt).toContain('Enter animal name');
            expect(isValidation).toBe(false);
            expect(authService['states'].get(connectionId)?.state).toBe('WAITING_FOR_USER_INPUT');
            done();
        });
        const handled = simulateMessage(constants_1.AUTH.MESSAGE_TYPES.AUTH_REQ);
        expect(handled).toBe(true);
        (0, ts_mockito_1.verify)(mockLogger.info((0, ts_mockito_1.anything)())).twice(); // Start + Received AUTH_REQ
    });
    test('[Client] should handle user input, send AUTH_RESP, and transition state', () => {
        authService.startAuthentication(connectionId, true, mockSendMessageCallback);
        simulateMessage(constants_1.AUTH.MESSAGE_TYPES.AUTH_REQ); // Trigger prompt state
        authService.provideUserInput(connectionId, validAnimalNames);
        expect(mockSendMessageCallback).toHaveBeenCalledTimes(1);
        const sentMessage = JSON.parse(mockSendMessageCallback.mock.calls[0][0]);
        expect(sentMessage.type).toBe(constants_1.AUTH.MESSAGE_TYPES.AUTH_RESP);
        expect(sentMessage.payload).toEqual(validAnimalNames);
        expect(authService['states'].get(connectionId)?.state).toBe('WAITING_FOR_AUTH_SUCCESS_FAIL');
        (0, ts_mockito_1.verify)(mockLogger.info((0, ts_mockito_1.anything)())).thrice(); // Start + Received AUTH_REQ + Sent AUTH_RESP
    });
    test('[Client] should handle AUTH_SUCCESS, emit authSucceeded, and transition state', (done) => {
        authService.startAuthentication(connectionId, true, mockSendMessageCallback);
        simulateMessage(constants_1.AUTH.MESSAGE_TYPES.AUTH_REQ);
        authService.provideUserInput(connectionId, validAnimalNames);
        authService.on('authSucceeded', (connId) => {
            expect(connId).toBe(connectionId);
            expect(authService.isAuthenticated(connectionId)).toBe(true);
            expect(authService.isAuthenticating(connectionId)).toBe(false);
            expect(clearTimeout).toHaveBeenCalledTimes(1);
            done();
        });
        const handled = simulateMessage(constants_1.AUTH.MESSAGE_TYPES.AUTH_SUCCESS);
        expect(handled).toBe(true);
        (0, ts_mockito_1.verify)(mockLogger.info((0, ts_mockito_1.anything)())).times(4); // Start + Recv REQ + Sent RESP + Recv SUCCESS
    });
    test('[Client] should handle AUTH_FAIL, emit authFailed, and transition state', (done) => {
        authService.startAuthentication(connectionId, true, mockSendMessageCallback);
        simulateMessage(constants_1.AUTH.MESSAGE_TYPES.AUTH_REQ);
        authService.provideUserInput(connectionId, validAnimalNames);
        authService.on('authFailed', (connId, reason) => {
            expect(connId).toBe(connectionId);
            expect(reason).toContain('rejected by peer');
            expect(authService.isAuthenticated(connectionId)).toBe(false);
            expect(authService.isAuthenticating(connectionId)).toBe(false);
            expect(authService['states'].get(connectionId)?.state).toBe('FAILED');
            expect(clearTimeout).toHaveBeenCalledTimes(1);
            done();
        });
        const handled = simulateMessage(constants_1.AUTH.MESSAGE_TYPES.AUTH_FAIL);
        expect(handled).toBe(true);
        (0, ts_mockito_1.verify)(mockLogger.info((0, ts_mockito_1.anything)())).times(4); // Start + Recv REQ + Sent RESP + Recv FAIL
        (0, ts_mockito_1.verify)(mockLogger.warn((0, ts_mockito_1.anything)())).once(); // Log failure
    });
    test('[Client] should handle user cancelling input, emit authFailed', (done) => {
        authService.startAuthentication(connectionId, true, mockSendMessageCallback);
        simulateMessage(constants_1.AUTH.MESSAGE_TYPES.AUTH_REQ); // Trigger prompt state
        authService.on('authFailed', (connId, reason) => {
            expect(connId).toBe(connectionId);
            expect(reason).toContain('cancelled');
            expect(authService['states'].get(connectionId)?.state).toBe('FAILED');
            expect(clearTimeout).toHaveBeenCalledTimes(1);
            done();
        });
        authService.provideUserInput(connectionId, null); // Simulate user cancelling
        expect(mockSendMessageCallback).not.toHaveBeenCalled();
    });
    // --- Receiver (Server) Flow ---
    test('[Server] startAuthentication should send AUTH_REQ, transition state, and set timeout', () => {
        authService.startAuthentication(connectionId, false, mockSendMessageCallback);
        expect(mockSendMessageCallback).toHaveBeenCalledTimes(1);
        const sentMessage = JSON.parse(mockSendMessageCallback.mock.calls[0][0]);
        expect(sentMessage.type).toBe(constants_1.AUTH.MESSAGE_TYPES.AUTH_REQ);
        expect(authService['states'].get(connectionId)?.state).toBe('WAITING_FOR_AUTH_RESP');
        expect(authService.isAuthenticating(connectionId)).toBe(true);
        expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), constants_1.AUTH.TIMEOUT);
        (0, ts_mockito_1.verify)(mockLogger.info((0, ts_mockito_1.anything)())).twice(); // Start + Sent AUTH_REQ
    });
    test('[Server] should handle AUTH_RESP, emit promptForUserInput (validation), and transition state', (done) => {
        authService.startAuthentication(connectionId, false, mockSendMessageCallback);
        authService.on('promptForUserInput', (connId, prompt, isValidation) => {
            expect(connId).toBe(connectionId);
            expect(prompt).toContain('Enter animal name');
            expect(isValidation).toBe(true);
            expect(authService['states'].get(connectionId)?.state).toBe('WAITING_FOR_USER_INPUT_VALIDATION');
            expect(authService['states'].get(connectionId)?.pendingResponse).toEqual(validAnimalNames);
            done();
        });
        const handled = simulateMessage(constants_1.AUTH.MESSAGE_TYPES.AUTH_RESP, validAnimalNames);
        expect(handled).toBe(true);
        (0, ts_mockito_1.verify)(mockLogger.info((0, ts_mockito_1.anything)())).thrice(); // Start + Sent REQ + Recv RESP
    });
    test('[Server] should handle user validation input (success), send AUTH_SUCCESS, emit authSucceeded', (done) => {
        authService.startAuthentication(connectionId, false, mockSendMessageCallback);
        simulateMessage(constants_1.AUTH.MESSAGE_TYPES.AUTH_RESP, validAnimalNames); // Trigger validation prompt
        authService.on('authSucceeded', (connId) => {
            expect(connId).toBe(connectionId);
            expect(authService.isAuthenticated(connectionId)).toBe(true);
            expect(clearTimeout).toHaveBeenCalledTimes(1);
            done();
        });
        authService.provideUserInput(connectionId, validAnimalNames); // Provide matching names
        expect(mockSendMessageCallback).toHaveBeenCalledTimes(2); // AUTH_REQ + AUTH_SUCCESS
        const sentMessage = JSON.parse(mockSendMessageCallback.mock.calls[1][0]);
        expect(sentMessage.type).toBe(constants_1.AUTH.MESSAGE_TYPES.AUTH_SUCCESS);
        expect(authService['states'].get(connectionId)?.state).toBe('AUTHENTICATED');
        (0, ts_mockito_1.verify)(mockLogger.info((0, ts_mockito_1.anything)())).times(5); // Start + Sent REQ + Recv RESP + Validated + Sent SUCCESS
    });
    test('[Server] should handle user validation input (failure), send AUTH_FAIL, emit authFailed', (done) => {
        authService.startAuthentication(connectionId, false, mockSendMessageCallback);
        simulateMessage(constants_1.AUTH.MESSAGE_TYPES.AUTH_RESP, validAnimalNames); // Trigger validation prompt
        authService.on('authFailed', (connId, reason) => {
            expect(connId).toBe(connectionId);
            expect(reason).toContain('did not match');
            expect(authService.isAuthenticated(connectionId)).toBe(false);
            expect(authService['states'].get(connectionId)?.state).toBe('FAILED');
            expect(clearTimeout).toHaveBeenCalledTimes(1);
            done();
        });
        authService.provideUserInput(connectionId, invalidAnimalNames); // Provide non-matching names
        expect(mockSendMessageCallback).toHaveBeenCalledTimes(2); // AUTH_REQ + AUTH_FAIL
        const sentMessage = JSON.parse(mockSendMessageCallback.mock.calls[1][0]);
        expect(sentMessage.type).toBe(constants_1.AUTH.MESSAGE_TYPES.AUTH_FAIL);
        (0, ts_mockito_1.verify)(mockLogger.info((0, ts_mockito_1.anything)())).times(4); // Start + Sent REQ + Recv RESP + Validated (failed)
        (0, ts_mockito_1.verify)(mockLogger.warn((0, ts_mockito_1.anything)())).once(); // Log failure
    });
    test('[Server] should handle user cancelling validation input, send AUTH_FAIL, emit authFailed', (done) => {
        authService.startAuthentication(connectionId, false, mockSendMessageCallback);
        simulateMessage(constants_1.AUTH.MESSAGE_TYPES.AUTH_RESP, validAnimalNames); // Trigger validation prompt
        authService.on('authFailed', (connId, reason) => {
            expect(connId).toBe(connectionId);
            expect(reason).toContain('cancelled');
            expect(authService['states'].get(connectionId)?.state).toBe('FAILED');
            expect(clearTimeout).toHaveBeenCalledTimes(1);
            done();
        });
        authService.provideUserInput(connectionId, null); // Simulate user cancelling
        expect(mockSendMessageCallback).toHaveBeenCalledTimes(2); // AUTH_REQ + AUTH_FAIL
        const sentMessage = JSON.parse(mockSendMessageCallback.mock.calls[1][0]);
        expect(sentMessage.type).toBe(constants_1.AUTH.MESSAGE_TYPES.AUTH_FAIL);
    });
    // --- General & Edge Cases ---
    test('should handle timeout, emit authFailed, and transition state', (done) => {
        authService.startAuthentication(connectionId, true, mockSendMessageCallback);
        authService.on('authFailed', (connId, reason) => {
            expect(connId).toBe(connectionId);
            expect(reason).toContain('timed out');
            expect(authService.isAuthenticated(connectionId)).toBe(false);
            expect(authService.isAuthenticating(connectionId)).toBe(false);
            expect(authService['states'].get(connectionId)?.state).toBe('FAILED');
            done();
        });
        // Fast-forward time
        jest.advanceTimersByTime(constants_1.AUTH.TIMEOUT + 100);
        (0, ts_mockito_1.verify)(mockLogger.warn((0, ts_mockito_1.anything)())).once(); // Log timeout
    });
    test('should ignore non-auth messages', () => {
        authService.startAuthentication(connectionId, true, mockSendMessageCallback);
        const handled = authService.handleMessage(connectionId, { type: 'SOME_OTHER_MESSAGE', payload: 'data' });
        expect(handled).toBe(false);
    });
    test('should ignore messages for unknown connection IDs', () => {
        const handled = authService.handleMessage('unknown-id', { type: constants_1.AUTH.MESSAGE_TYPES.AUTH_REQ });
        expect(handled).toBe(false);
        (0, ts_mockito_1.verify)(mockLogger.warn((0, ts_mockito_1.anything)())).once();
    });
    test('should ignore messages when not authenticating (except AUTH_REQ for client)', () => {
        // Test when IDLE
        let handled = simulateMessage(constants_1.AUTH.MESSAGE_TYPES.AUTH_RESP, validAnimalNames);
        expect(handled).toBe(false);
        // Test when AUTHENTICATED
        authService.startAuthentication(connectionId, true, mockSendMessageCallback);
        simulateMessage(constants_1.AUTH.MESSAGE_TYPES.AUTH_REQ);
        authService.provideUserInput(connectionId, validAnimalNames);
        simulateMessage(constants_1.AUTH.MESSAGE_TYPES.AUTH_SUCCESS);
        expect(authService.isAuthenticated(connectionId)).toBe(true);
        handled = simulateMessage(constants_1.AUTH.MESSAGE_TYPES.AUTH_REQ);
        expect(handled).toBe(false);
        // Test when FAILED
        authService.cancelAuthentication(connectionId, 'test cancel');
        handled = simulateMessage(constants_1.AUTH.MESSAGE_TYPES.AUTH_REQ);
        expect(handled).toBe(false);
    });
    test('cancelAuthentication should emit authFailed and transition state', (done) => {
        authService.startAuthentication(connectionId, true, mockSendMessageCallback);
        expect(authService.isAuthenticating(connectionId)).toBe(true);
        authService.on('authFailed', (connId, reason) => {
            expect(connId).toBe(connectionId);
            expect(reason).toBe('Test cancel reason');
            expect(authService.isAuthenticating(connectionId)).toBe(false);
            expect(authService['states'].get(connectionId)?.state).toBe('FAILED');
            expect(clearTimeout).toHaveBeenCalledTimes(1);
            done();
        });
        authService.cancelAuthentication(connectionId, 'Test cancel reason');
    });
    test('cleanupConnection should remove state and clear timeout', () => {
        authService.startAuthentication(connectionId, true, mockSendMessageCallback);
        expect(authService['states'].has(connectionId)).toBe(true);
        expect(authService['states'].get(connectionId)?.timeoutHandle).not.toBeNull();
        authService.cleanupConnection(connectionId);
        expect(authService['states'].has(connectionId)).toBe(false);
        expect(clearTimeout).toHaveBeenCalledTimes(1);
    });
    test('should handle multiple concurrent authentications separately', () => {
        const connId1 = 'conn1';
        const connId2 = 'conn2';
        const sendMessage1 = jest.fn();
        const sendMessage2 = jest.fn();
        // Start client auth for conn1
        authService.startAuthentication(connId1, true, sendMessage1);
        expect(authService['states'].get(connId1)?.state).toBe('WAITING_FOR_AUTH_REQ');
        // Start server auth for conn2
        authService.startAuthentication(connId2, false, sendMessage2);
        expect(authService['states'].get(connId2)?.state).toBe('WAITING_FOR_AUTH_RESP');
        expect(sendMessage2).toHaveBeenCalledWith(JSON.stringify({ type: constants_1.AUTH.MESSAGE_TYPES.AUTH_REQ }));
        // Progress conn1
        authService.handleMessage(connId1, { type: constants_1.AUTH.MESSAGE_TYPES.AUTH_REQ });
        expect(authService['states'].get(connId1)?.state).toBe('WAITING_FOR_USER_INPUT');
        // Progress conn2
        authService.handleMessage(connId2, { type: constants_1.AUTH.MESSAGE_TYPES.AUTH_RESP, payload: validAnimalNames });
        expect(authService['states'].get(connId2)?.state).toBe('WAITING_FOR_USER_INPUT_VALIDATION');
        expect(authService.isAuthenticating(connId1)).toBe(true);
        expect(authService.isAuthenticating(connId2)).toBe(true);
    });
});
//# sourceMappingURL=authService.test.js.map