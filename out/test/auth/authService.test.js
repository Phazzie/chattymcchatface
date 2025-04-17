"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const authService_1 = require("../../auth/authService");
const constants_1 = require("../../constants");
describe('AuthService', () => {
    let authService;
    let mockLogger;
    let mockSendMessage;
    let connectionId;
    beforeEach(() => {
        // Mock logger
        mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn()
        };
        // Mock send message function
        mockSendMessage = jest.fn().mockReturnValue(true);
        // Create auth service
        authService = new authService_1.AuthService(mockLogger);
        // Set up a test connection
        connectionId = 'test-connection-id';
    });
    describe('startAuthentication', () => {
        it('should set up authentication state for a connection', () => {
            authService.startAuthentication(connectionId, true, mockSendMessage);
            expect(mockLogger.info).toHaveBeenCalled();
            expect(authService.isAuthenticating(connectionId)).toBe(true);
        });
        it('should send AUTH_REQ when server-initiated', () => {
            authService.startAuthentication(connectionId, false, mockSendMessage);
            expect(mockSendMessage).toHaveBeenCalledWith(expect.stringContaining(constants_1.AUTH.MESSAGE_TYPES.AUTH_REQ));
        });
    });
    describe('handleMessage', () => {
        beforeEach(() => {
            // Set up authentication state
            authService.startAuthentication(connectionId, true, mockSendMessage);
        });
        it('should handle AUTH_REQ messages', () => {
            const spy = jest.spyOn(authService, 'emit');
            const handled = authService.handleMessage(connectionId, {
                type: constants_1.AUTH.MESSAGE_TYPES.AUTH_REQ
            });
            expect(handled).toBe(true);
            expect(spy).toHaveBeenCalledWith('promptForUserInput', connectionId, expect.any(String), false);
        });
        it('should handle AUTH_RESP messages', () => {
            // Change state to waiting for AUTH_RESP
            authService.states.get(connectionId).state = 'WAITING_FOR_AUTH_RESP';
            const spy = jest.spyOn(authService, 'emit');
            const handled = authService.handleMessage(connectionId, {
                type: constants_1.AUTH.MESSAGE_TYPES.AUTH_RESP,
                payload: ['elephant', 'tiger', 'giraffe']
            });
            expect(handled).toBe(true);
            expect(spy).toHaveBeenCalledWith('promptForUserInput', connectionId, expect.any(String), true);
        });
        it('should handle AUTH_SUCCESS messages', () => {
            // Change state to waiting for AUTH_SUCCESS/FAIL
            authService.states.get(connectionId).state = 'WAITING_FOR_AUTH_SUCCESS_FAIL';
            const spy = jest.spyOn(authService, 'emit');
            const handled = authService.handleMessage(connectionId, {
                type: constants_1.AUTH.MESSAGE_TYPES.AUTH_SUCCESS
            });
            expect(handled).toBe(true);
            expect(spy).toHaveBeenCalledWith('authSucceeded', connectionId);
        });
        it('should handle AUTH_FAIL messages', () => {
            // Change state to waiting for AUTH_SUCCESS/FAIL
            authService.states.get(connectionId).state = 'WAITING_FOR_AUTH_SUCCESS_FAIL';
            const spy = jest.spyOn(authService, 'emit');
            const handled = authService.handleMessage(connectionId, {
                type: constants_1.AUTH.MESSAGE_TYPES.AUTH_FAIL,
                payload: { reason: 'Invalid response' }
            });
            expect(handled).toBe(true);
            expect(spy).toHaveBeenCalledWith('authFailed', connectionId, expect.any(String));
        });
    });
    describe('provideUserInput', () => {
        beforeEach(() => {
            // Set up authentication state
            authService.startAuthentication(connectionId, true, mockSendMessage);
        });
        it('should send AUTH_RESP when providing input for challenge', () => {
            // Change state to waiting for user input
            authService.states.get(connectionId).state = 'WAITING_FOR_USER_INPUT';
            authService.provideUserInput(connectionId, ['elephant', 'tiger', 'giraffe']);
            expect(mockSendMessage).toHaveBeenCalledWith(expect.stringContaining(constants_1.AUTH.MESSAGE_TYPES.AUTH_RESP));
        });
        it('should validate response and send AUTH_SUCCESS when valid', () => {
            // Change state to waiting for user input validation
            authService.states.get(connectionId).state = 'WAITING_FOR_USER_INPUT_VALIDATION';
            authService.states.get(connectionId).pendingResponse = ['elephant', 'tiger', 'giraffe'];
            const spy = jest.spyOn(authService, 'emit');
            authService.provideUserInput(connectionId, ['elephant', 'tiger', 'giraffe']);
            expect(mockSendMessage).toHaveBeenCalledWith(expect.stringContaining(constants_1.AUTH.MESSAGE_TYPES.AUTH_SUCCESS));
            expect(spy).toHaveBeenCalledWith('authSucceeded', connectionId);
        });
    });
    describe('cleanupConnection', () => {
        it('should clean up connection state', () => {
            // Set up authentication state
            authService.startAuthentication(connectionId, true, mockSendMessage);
            // Verify state exists
            expect(authService.isAuthenticating(connectionId)).toBe(true);
            // Clean up
            authService.cleanupConnection(connectionId);
            // Verify state is gone
            expect(authService.isAuthenticating(connectionId)).toBe(false);
        });
    });
});
//# sourceMappingURL=authService.test.js.map