"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const events_1 = require("events");
const constants_1 = require("../constants");
/**
 * Implements the core logic for the animal names authentication protocol.
 * Manages state for multiple connections independently.
 */
class AuthService extends events_1.EventEmitter {
    constructor(logger) {
        super();
        this.states = new Map();
        this.logger = logger;
    }
    /**
     * Starts the authentication process for a specific connection.
     * @param connectionId A unique identifier for the connection.
     * @param isInitiator True if this side initiated the connection (client), false otherwise (server).
     * @param sendMessage A function to send a message over the connection.
     */
    startAuthentication(connectionId, isInitiator, sendMessage) {
        if (this.states.has(connectionId)) {
            this.logger.warn(`[AuthService] Authentication already in progress or completed for ${connectionId}.`);
            return;
        }
        this.logger.info(`[AuthService] Starting authentication for ${connectionId} (Initiator: ${isInitiator})`);
        const timeoutHandle = setTimeout(() => {
            this.handleAuthTimeout(connectionId);
        }, constants_1.AUTH.TIMEOUT);
        const initialState = {
            state: 'IDLE',
            isInitiator,
            sendMessage,
            timeoutHandle,
        };
        if (isInitiator) {
            // Client: Wait for AUTH_REQ from server
            initialState.state = 'WAITING_FOR_AUTH_REQ';
            this.states.set(connectionId, initialState);
            this.logger.info(`[AuthService] ${connectionId}: Waiting for AUTH_REQ.`);
        }
        else {
            // Server: Send AUTH_REQ to client
            initialState.state = 'WAITING_FOR_AUTH_RESP';
            this.states.set(connectionId, initialState);
            this.sendAuthRequest(connectionId);
        }
    }
    /**
     * Handles an incoming message for a specific connection, checking if it's part of the auth flow.
     * @param connectionId The connection identifier.
     * @param message The parsed message object.
     * @returns True if the message was handled as an auth message, false otherwise.
     */
    handleMessage(connectionId, message) {
        const authState = this.states.get(connectionId);
        if (!authState) {
            // If we don't have state, it might be an AUTH_REQ for a client that just connected
            // but hasn't called startAuthentication yet. This shouldn't happen with proper ConnectionHandler integration.
            this.logger.warn(`[AuthService] Received auth message for unknown or inactive connection ${connectionId}.`);
            return false;
        }
        // Check if it's a valid AuthMessage type
        if (!message || typeof message.type !== 'string' || !Object.values(constants_1.AUTH.MESSAGE_TYPES).includes(message.type)) {
            return false; // Not an auth message
        }
        this.logger.info(`[AuthService] ${connectionId}: Received auth message: ${message.type} in state ${authState.state}`);
        try {
            switch (message.type) {
                case constants_1.AUTH.MESSAGE_TYPES.AUTH_REQ:
                    this.handleAuthRequest(connectionId, authState);
                    break;
                case constants_1.AUTH.MESSAGE_TYPES.AUTH_RESP:
                    this.handleAuthResponse(connectionId, authState, message.payload || []);
                    break;
                case constants_1.AUTH.MESSAGE_TYPES.AUTH_SUCCESS:
                    this.handleAuthSuccess(connectionId, authState);
                    break;
                case constants_1.AUTH.MESSAGE_TYPES.AUTH_FAIL:
                    this.handleAuthFailure(connectionId, authState, 'Authentication rejected by peer');
                    break;
                default:
                    this.logger.warn(`[AuthService] ${connectionId}: Unknown auth message type: ${message.type}`);
                    return false; // Not handled
            }
            return true; // Message was handled
        }
        catch (error) {
            this.logger.error(`[AuthService] ${connectionId}: Error handling auth message`, error);
            this.failAuthentication(connectionId, authState, 'Internal error during authentication');
            return true; // Indicate we attempted to handle it, even if it failed
        }
    }
    /**
     * Provides the user input (animal names) obtained via IAuthUI.
     * @param connectionId The connection identifier.
     * @param animalNames The array of names, or null if the user cancelled.
     */
    provideUserInput(connectionId, animalNames) {
        const authState = this.states.get(connectionId);
        if (!authState) {
            this.logger.warn(`[AuthService] provideUserInput called for unknown connection ${connectionId}`);
            return;
        }
        if (authState.state === 'WAITING_FOR_USER_INPUT') {
            if (!animalNames || animalNames.length !== constants_1.AUTH.REQUIRED_ANIMALS) {
                this.logger.warn(`[AuthService] ${connectionId}: User cancelled or provided invalid input.`);
                this.failAuthentication(connectionId, authState, 'User cancelled or provided invalid input');
                return;
            }
            this.logger.info(`[AuthService] ${connectionId}: Received user input, sending AUTH_RESP.`);
            this.sendAuthResponse(connectionId, authState, animalNames);
            authState.state = 'WAITING_FOR_AUTH_SUCCESS_FAIL';
        }
        else if (authState.state === 'WAITING_FOR_USER_INPUT_VALIDATION') {
            if (!animalNames || animalNames.length !== constants_1.AUTH.REQUIRED_ANIMALS) {
                this.logger.warn(`[AuthService] ${connectionId}: User cancelled or provided invalid validation input.`);
                this.sendAuthFailure(connectionId, authState, 'Validation input cancelled or invalid');
                this.failAuthentication(connectionId, authState, 'User cancelled or provided invalid validation input');
                return;
            }
            this.logger.info(`[AuthService] ${connectionId}: Received user validation input.`);
            const receivedNames = authState.pendingResponse;
            if (!receivedNames) {
                this.logger.error(`[AuthService] ${connectionId}: Missing pending response during validation.`);
                this.failAuthentication(connectionId, authState, 'Internal error: Missing pending response');
                return;
            }
            // Validate names (case-insensitive, order-insensitive)
            const normalizedReceived = receivedNames.map(name => name.toLowerCase().trim());
            const normalizedExpected = animalNames.map(name => name.toLowerCase().trim());
            const isValid = normalizedReceived.length === normalizedExpected.length &&
                normalizedReceived.every(name => normalizedExpected.includes(name)) &&
                normalizedExpected.every(name => normalizedReceived.includes(name));
            if (isValid) {
                this.logger.info(`[AuthService] ${connectionId}: Animal names validated successfully.`);
                this.sendAuthSuccess(connectionId, authState);
                this.succeedAuthentication(connectionId, authState);
            }
            else {
                this.logger.warn(`[AuthService] ${connectionId}: Animal names validation failed.`);
                this.sendAuthFailure(connectionId, authState, 'Animal names did not match');
                this.failAuthentication(connectionId, authState, 'Animal names did not match');
            }
            delete authState.pendingResponse; // Clean up pending data
        }
        else {
            this.logger.warn(`[AuthService] ${connectionId}: provideUserInput called in unexpected state ${authState.state}`);
        }
    }
    isAuthenticating(connectionId) {
        const state = this.states.get(connectionId)?.state;
        return !!state && state !== 'IDLE' && state !== 'AUTHENTICATED' && state !== 'FAILED';
    }
    isAuthenticated(connectionId) {
        return this.states.get(connectionId)?.state === 'AUTHENTICATED';
    }
    cancelAuthentication(connectionId, reason) {
        const authState = this.states.get(connectionId);
        if (authState && this.isAuthenticating(connectionId)) {
            this.logger.warn(`[AuthService] ${connectionId}: Authentication cancelled. Reason: ${reason}`);
            this.failAuthentication(connectionId, authState, reason);
        }
    }
    cleanupConnection(connectionId) {
        const authState = this.states.get(connectionId);
        if (authState) {
            this.clearAuthTimeout(authState);
            this.states.delete(connectionId);
            this.logger.info(`[AuthService] Cleaned up state for connection ${connectionId}`);
        }
    }
    // --- Private State Handlers ---
    handleAuthRequest(connectionId, authState) {
        if (authState.state !== 'WAITING_FOR_AUTH_REQ') {
            this.logger.warn(`[AuthService] ${connectionId}: Unexpected AUTH_REQ in state ${authState.state}`);
            return; // Or potentially fail authentication
        }
        this.logger.info(`[AuthService] ${connectionId}: Received AUTH_REQ, prompting user for input.`);
        authState.state = 'WAITING_FOR_USER_INPUT';
        this.emit('promptForUserInput', connectionId, `Enter animal names for connection ${connectionId}`, false);
    }
    handleAuthResponse(connectionId, authState, receivedNames) {
        if (authState.state !== 'WAITING_FOR_AUTH_RESP') {
            this.logger.warn(`[AuthService] ${connectionId}: Unexpected AUTH_RESP in state ${authState.state}`);
            return;
        }
        if (!Array.isArray(receivedNames) || receivedNames.length !== constants_1.AUTH.REQUIRED_ANIMALS) {
            this.logger.warn(`[AuthService] ${connectionId}: Received invalid AUTH_RESP payload.`);
            this.sendAuthFailure(connectionId, authState, 'Invalid AUTH_RESP payload');
            this.failAuthentication(connectionId, authState, 'Invalid AUTH_RESP payload from peer');
            return;
        }
        this.logger.info(`[AuthService] ${connectionId}: Received AUTH_RESP, prompting user for validation.`);
        authState.state = 'WAITING_FOR_USER_INPUT_VALIDATION';
        authState.pendingResponse = receivedNames; // Store for validation
        this.emit('promptForUserInput', connectionId, `Enter animal names to validate connection ${connectionId}`, true);
    }
    handleAuthSuccess(connectionId, authState) {
        if (authState.state !== 'WAITING_FOR_AUTH_SUCCESS_FAIL') {
            this.logger.warn(`[AuthService] ${connectionId}: Unexpected AUTH_SUCCESS in state ${authState.state}`);
            // Allow success even if state is wrong? Or fail?
            // Let's be strict for now.
            // this.failAuthentication(connectionId, authState, 'Unexpected AUTH_SUCCESS message');
            return;
        }
        this.logger.info(`[AuthService] ${connectionId}: Received AUTH_SUCCESS.`);
        this.succeedAuthentication(connectionId, authState);
    }
    handleAuthFailure(connectionId, authState, reason) {
        // Can receive AUTH_FAIL in WAITING_FOR_AUTH_SUCCESS_FAIL (client) or after sending AUTH_FAIL (server - less likely)
        if (authState.state === 'WAITING_FOR_AUTH_SUCCESS_FAIL' || authState.state === 'FAILED') {
            this.logger.warn(`[AuthService] ${connectionId}: Received AUTH_FAIL. Reason: ${reason}`);
            this.failAuthentication(connectionId, authState, reason);
        }
        else {
            this.logger.warn(`[AuthService] ${connectionId}: Unexpected AUTH_FAIL in state ${authState.state}`);
        }
    }
    // --- Private Helper Methods ---
    sendAuthRequest(connectionId) {
        const authState = this.states.get(connectionId);
        if (!authState)
            return;
        const message = { type: constants_1.AUTH.MESSAGE_TYPES.AUTH_REQ };
        this.logger.info(`[AuthService] ${connectionId}: Sending AUTH_REQ.`);
        authState.sendMessage(JSON.stringify(message));
    }
    sendAuthResponse(connectionId, authState, animalNames) {
        const message = { type: constants_1.AUTH.MESSAGE_TYPES.AUTH_RESP, payload: animalNames };
        this.logger.info(`[AuthService] ${connectionId}: Sending AUTH_RESP.`);
        authState.sendMessage(JSON.stringify(message));
    }
    sendAuthSuccess(connectionId, authState) {
        const message = { type: constants_1.AUTH.MESSAGE_TYPES.AUTH_SUCCESS };
        this.logger.info(`[AuthService] ${connectionId}: Sending AUTH_SUCCESS.`);
        authState.sendMessage(JSON.stringify(message));
    }
    sendAuthFailure(connectionId, authState, reason) {
        const message = { type: constants_1.AUTH.MESSAGE_TYPES.AUTH_FAIL, payload: { reason } };
        this.logger.info(`[AuthService] ${connectionId}: Sending AUTH_FAIL. Reason: ${reason}`);
        authState.sendMessage(JSON.stringify(message));
    }
    succeedAuthentication(connectionId, authState) {
        if (authState.state === 'AUTHENTICATED')
            return; // Already succeeded
        this.logger.info(`[AuthService] ${connectionId}: Authentication successful.`);
        this.clearAuthTimeout(authState);
        authState.state = 'AUTHENTICATED';
        this.emit('authSucceeded', connectionId);
    }
    failAuthentication(connectionId, authState, reason) {
        if (authState.state === 'FAILED')
            return; // Already failed
        this.logger.warn(`[AuthService] ${connectionId}: Authentication failed. Reason: ${reason}`);
        this.clearAuthTimeout(authState);
        authState.state = 'FAILED';
        // Don't send AUTH_FAIL if we received AUTH_FAIL or if the failure is local (e.g., timeout, user cancel)
        this.emit('authFailed', connectionId, reason);
        // No automatic cleanup here, ConnectionHandler should decide when to close/cleanup
    }
    handleAuthTimeout(connectionId) {
        const authState = this.states.get(connectionId);
        if (authState && this.isAuthenticating(connectionId)) {
            this.logger.warn(`[AuthService] ${connectionId}: Authentication timed out.`);
            authState.timeoutHandle = null; // Avoid trying to clear it again
            this.failAuthentication(connectionId, authState, 'Authentication timed out');
        }
    }
    clearAuthTimeout(authState) {
        if (authState.timeoutHandle) {
            clearTimeout(authState.timeoutHandle);
            authState.timeoutHandle = null;
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=authService.js.map