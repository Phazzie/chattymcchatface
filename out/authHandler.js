"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthHandler = void 0;
// filepath: /Users/hbpheonix/Documents/augment-projects/ChattyMcChatface/src/authHandler.ts
const vscode = __importStar(require("vscode"));
const events_1 = require("events");
const constants_1 = require("./constants");
/**
 * Possible states of the authentication process
 */
var AuthState;
(function (AuthState) {
    /** Not started */
    AuthState[AuthState["IDLE"] = 0] = "IDLE";
    /** Waiting for animal names from the user */
    AuthState[AuthState["WAITING_FOR_USER_INPUT"] = 1] = "WAITING_FOR_USER_INPUT";
    /** Waiting for the other side to send AUTH_REQ */
    AuthState[AuthState["WAITING_FOR_AUTH_REQ"] = 2] = "WAITING_FOR_AUTH_REQ";
    /** Waiting for the other side to send AUTH_RESP with animal names */
    AuthState[AuthState["WAITING_FOR_AUTH_RESP"] = 3] = "WAITING_FOR_AUTH_RESP";
    /** Authentication completed successfully */
    AuthState[AuthState["AUTHENTICATED"] = 4] = "AUTHENTICATED";
    /** Authentication failed */
    AuthState[AuthState["FAILED"] = 5] = "FAILED";
})(AuthState || (AuthState = {}));
/**
 * Handles the animal names authentication protocol
 * This implements a simple shared secret authentication mechanism where
 * both sides must know the same set of animal names to authenticate
 */
class AuthHandler extends events_1.EventEmitter {
    /**
     * Create a new AuthHandler
     * @param sendMessageFn Function to send messages to the peer
     * @param outputChannel VS Code output channel for logging
     * @param isInitiator Whether this instance initiated the connection
     */
    constructor(sendMessageFn, outputChannel, isInitiator) {
        super();
        /** Current state of the authentication process */
        this.state = AuthState.IDLE;
        /** Stored animal names for validation */
        this.animalNames = [];
        /** Timeout handle for authentication process */
        this.authTimeout = null;
        this.sendMessageFn = sendMessageFn;
        this.outputChannel = outputChannel;
        this.isInitiator = isInitiator;
        this.log('AuthHandler initialized');
    }
    /**
     * Log a message to the output channel
     */
    log(message) {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[${timestamp}] [AuthHandler] ${message}`);
    }
    /**
     * Start the authentication process
     * The initiator (client) waits for AUTH_REQ from the server
     * The receiver (server) sends AUTH_REQ to the client
     */
    startAuthentication() {
        if (this.state !== AuthState.IDLE) {
            this.log('Cannot start authentication: Already in progress');
            return;
        }
        // Set timeout for the entire auth process
        this.authTimeout = setTimeout(() => {
            this.handleAuthTimeout();
        }, constants_1.AUTH.TIMEOUT);
        if (this.isInitiator) {
            // Client: Wait for AUTH_REQ from server
            this.state = AuthState.WAITING_FOR_AUTH_REQ;
            this.log('Starting authentication as client, waiting for AUTH_REQ');
        }
        else {
            // Server: Send AUTH_REQ to client
            this.state = AuthState.WAITING_FOR_AUTH_RESP;
            this.log('Starting authentication as server, sending AUTH_REQ');
            this.sendAuthRequest();
        }
    }
    /**
     * Handle an incoming authentication message from the peer
     * @param messageData The raw message data from the peer
     * @returns Whether the message was a valid auth message and was handled
     */
    handleMessage(messageData) {
        try {
            // Try to parse the message as an AuthMessage
            const message = JSON.parse(messageData);
            // Check if it's an auth message
            if (!message.type || !Object.values(constants_1.AUTH.MESSAGE_TYPES).includes(message.type)) {
                return false; // Not an auth message
            }
            this.log(`Received auth message: ${message.type}`);
            // Handle based on the message type
            switch (message.type) {
                case constants_1.AUTH.MESSAGE_TYPES.AUTH_REQ:
                    this.handleAuthRequest();
                    break;
                case constants_1.AUTH.MESSAGE_TYPES.AUTH_RESP:
                    this.handleAuthResponse(message.payload || []);
                    break;
                case constants_1.AUTH.MESSAGE_TYPES.AUTH_SUCCESS:
                    this.handleAuthSuccess();
                    break;
                case constants_1.AUTH.MESSAGE_TYPES.AUTH_FAIL:
                    this.handleAuthFailure();
                    break;
                default:
                    this.log(`Unknown auth message type: ${message.type}`);
                    return false;
            }
            return true; // Message was handled
        }
        catch (err) {
            // Not a valid JSON or not an auth message
            return false;
        }
    }
    /**
     * Handle auth timeout
     */
    handleAuthTimeout() {
        if (this.state === AuthState.AUTHENTICATED || this.state === AuthState.FAILED) {
            return; // Already completed
        }
        this.log('Authentication timed out');
        this.state = AuthState.FAILED;
        this.emit('authFailed', 'Authentication timed out');
        this.cleanupAuth();
    }
    /**
     * Send an AUTH_REQ message to the peer
     */
    sendAuthRequest() {
        const message = {
            type: constants_1.AUTH.MESSAGE_TYPES.AUTH_REQ
        };
        this.sendMessageFn(JSON.stringify(message));
        this.log('Sent AUTH_REQ');
    }
    /**
     * Handle receiving an AUTH_REQ message
     */
    async handleAuthRequest() {
        if (this.state !== AuthState.WAITING_FOR_AUTH_REQ) {
            this.log(`Unexpected AUTH_REQ in state ${this.state}`);
            return;
        }
        this.log('Received AUTH_REQ, prompting user for animal names');
        this.state = AuthState.WAITING_FOR_USER_INPUT;
        // Get animal names from the user
        const animalNames = await this.promptForAnimalNames();
        if (!animalNames || animalNames.length !== constants_1.AUTH.REQUIRED_ANIMALS) {
            this.log('Invalid animal names provided by user');
            this.state = AuthState.FAILED;
            this.emit('authFailed', 'Invalid animal names provided');
            this.cleanupAuth();
            return;
        }
        // Send AUTH_RESP with the animal names
        const message = {
            type: constants_1.AUTH.MESSAGE_TYPES.AUTH_RESP,
            payload: animalNames
        };
        this.sendMessageFn(JSON.stringify(message));
        this.log('Sent AUTH_RESP with animal names');
    }
    /**
     * Handle receiving an AUTH_RESP message with animal names
     */
    async handleAuthResponse(receivedNames) {
        if (this.state !== AuthState.WAITING_FOR_AUTH_RESP) {
            this.log(`Unexpected AUTH_RESP in state ${this.state}`);
            return;
        }
        this.log('Received AUTH_RESP, prompting user for animal names to validate');
        // Get animal names from the user for validation
        const expectedNames = await this.promptForAnimalNames();
        if (!expectedNames || expectedNames.length !== constants_1.AUTH.REQUIRED_ANIMALS) {
            this.log('Invalid animal names provided by user for validation');
            this.sendAuthFailure();
            return;
        }
        // Validate the animal names (case-insensitive)
        const normalizedReceived = receivedNames.map(name => name.toLowerCase());
        const normalizedExpected = expectedNames.map(name => name.toLowerCase());
        // Check if arrays have the same content regardless of order
        const isValid = normalizedReceived.length === normalizedExpected.length &&
            normalizedReceived.every(name => normalizedExpected.includes(name));
        if (isValid) {
            this.log('Animal names validated successfully');
            this.sendAuthSuccess();
        }
        else {
            this.log('Animal names validation failed');
            this.sendAuthFailure();
        }
    }
    /**
     * Send AUTH_SUCCESS message to the peer
     */
    sendAuthSuccess() {
        const message = {
            type: constants_1.AUTH.MESSAGE_TYPES.AUTH_SUCCESS
        };
        this.sendMessageFn(JSON.stringify(message));
        this.log('Sent AUTH_SUCCESS');
        this.state = AuthState.AUTHENTICATED;
        this.emit('authSucceeded');
        this.cleanupAuth();
    }
    /**
     * Send AUTH_FAIL message to the peer
     */
    sendAuthFailure() {
        const message = {
            type: constants_1.AUTH.MESSAGE_TYPES.AUTH_FAIL
        };
        this.sendMessageFn(JSON.stringify(message));
        this.log('Sent AUTH_FAIL');
        this.state = AuthState.FAILED;
        this.emit('authFailed', 'Animal names did not match');
        this.cleanupAuth();
    }
    /**
     * Handle receiving AUTH_SUCCESS message
     */
    handleAuthSuccess() {
        this.log('Received AUTH_SUCCESS');
        this.state = AuthState.AUTHENTICATED;
        this.emit('authSucceeded');
        this.cleanupAuth();
    }
    /**
     * Handle receiving AUTH_FAIL message
     */
    handleAuthFailure() {
        this.log('Received AUTH_FAIL');
        this.state = AuthState.FAILED;
        this.emit('authFailed', 'Authentication rejected by peer');
        this.cleanupAuth();
    }
    /**
     * Prompt the user for the three animal names
     * @returns Array of animal names or null if cancelled
     */
    async promptForAnimalNames() {
        const animalNames = [];
        for (let i = 1; i <= constants_1.AUTH.REQUIRED_ANIMALS; i++) {
            const animalName = await vscode.window.showInputBox({
                prompt: `Enter animal name ${i} of ${constants_1.AUTH.REQUIRED_ANIMALS} for authentication`,
                placeHolder: 'e.g., Elephant',
                ignoreFocusOut: true
            });
            if (!animalName) {
                // User cancelled
                return null;
            }
            animalNames.push(animalName.trim());
        }
        return animalNames;
    }
    /**
     * Clean up authentication resources
     */
    cleanupAuth() {
        if (this.authTimeout) {
            clearTimeout(this.authTimeout);
            this.authTimeout = null;
        }
    }
    /**
     * Cancel the authentication process
     */
    cancelAuthentication() {
        this.log('Authentication cancelled');
        this.state = AuthState.FAILED;
        this.emit('authFailed', 'Authentication cancelled');
        this.cleanupAuth();
    }
    /**
     * Check if the authentication is in progress
     */
    isAuthenticating() {
        return this.state !== AuthState.IDLE &&
            this.state !== AuthState.AUTHENTICATED &&
            this.state !== AuthState.FAILED;
    }
    /**
     * Check if the authentication has succeeded
     */
    isAuthenticated() {
        return this.state === AuthState.AUTHENTICATED;
    }
}
exports.AuthHandler = AuthHandler;
//# sourceMappingURL=authHandler.js.map