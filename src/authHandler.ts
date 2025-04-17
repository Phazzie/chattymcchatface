// filepath: /Users/hbpheonix/Documents/augment-projects/ChattyMcChatface/src/authHandler.ts
import * as vscode from 'vscode';
import { EventEmitter } from 'events';
import { AUTH, AuthMessage } from './constants';

/**
 * Possible states of the authentication process
 */
enum AuthState {
    /** Not started */
    IDLE,
    /** Waiting for animal names from the user */
    WAITING_FOR_USER_INPUT,
    /** Waiting for the other side to send AUTH_REQ */
    WAITING_FOR_AUTH_REQ,
    /** Waiting for the other side to send AUTH_RESP with animal names */
    WAITING_FOR_AUTH_RESP,
    /** Authentication completed successfully */
    AUTHENTICATED,
    /** Authentication failed */
    FAILED
}

/**
 * Handles the animal names authentication protocol
 * This implements a simple shared secret authentication mechanism where
 * both sides must know the same set of animal names to authenticate
 */
export class AuthHandler extends EventEmitter {
    /** Current state of the authentication process */
    private state: AuthState = AuthState.IDLE;

    /** Stored animal names for validation */
    private animalNames: string[] = [];

    /** Timeout handle for authentication process */
    private authTimeout: NodeJS.Timeout | null = null;

    /** Output channel for logging */
    private outputChannel: vscode.OutputChannel;

    /** Function to send messages to the peer */
    private sendMessageFn: (message: string) => boolean;

    /** Whether this instance initiated the connection (client) or received it (server) */
    private isInitiator: boolean;

    /**
     * Create a new AuthHandler
     * @param sendMessageFn Function to send messages to the peer
     * @param outputChannel VS Code output channel for logging
     * @param isInitiator Whether this instance initiated the connection
     */
    constructor(
        sendMessageFn: (message: string) => boolean,
        outputChannel: vscode.OutputChannel,
        isInitiator: boolean
    ) {
        super();
        this.sendMessageFn = sendMessageFn;
        this.outputChannel = outputChannel;
        this.isInitiator = isInitiator;
        this.log('AuthHandler initialized');
    }

    /**
     * Log a message to the output channel
     */
    private log(message: string): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[${timestamp}] [AuthHandler] ${message}`);
    }

    /**
     * Start the authentication process
     * The initiator (client) waits for AUTH_REQ from the server
     * The receiver (server) sends AUTH_REQ to the client
     */
    public startAuthentication(): void {
        if (this.state !== AuthState.IDLE) {
            this.log('Cannot start authentication: Already in progress');
            return;
        }

        // Set timeout for the entire auth process
        this.authTimeout = setTimeout(() => {
            this.handleAuthTimeout();
        }, AUTH.TIMEOUT);

        if (this.isInitiator) {
            // Client: Wait for AUTH_REQ from server
            this.state = AuthState.WAITING_FOR_AUTH_REQ;
            this.log('Starting authentication as client, waiting for AUTH_REQ');
        } else {
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
    public handleMessage(messageData: string): boolean {
        try {
            // Try to parse the message as an AuthMessage
            const message = JSON.parse(messageData) as AuthMessage;

            // Check if it's an auth message
            if (!message.type || !Object.values(AUTH.MESSAGE_TYPES).includes(message.type)) {
                return false; // Not an auth message
            }

            this.log(`Received auth message: ${message.type}`);

            // Handle based on the message type
            switch (message.type) {
                case AUTH.MESSAGE_TYPES.AUTH_REQ:
                    this.handleAuthRequest();
                    break;
                case AUTH.MESSAGE_TYPES.AUTH_RESP:
                    this.handleAuthResponse(message.payload || []);
                    break;
                case AUTH.MESSAGE_TYPES.AUTH_SUCCESS:
                    this.handleAuthSuccess();
                    break;
                case AUTH.MESSAGE_TYPES.AUTH_FAIL:
                    this.handleAuthFailure();
                    break;
                default:
                    this.log(`Unknown auth message type: ${message.type}`);
                    return false;
            }

            return true; // Message was handled
        } catch (err) {
            // Not a valid JSON or not an auth message
            return false;
        }
    }

    /**
     * Handle auth timeout
     */
    private handleAuthTimeout(): void {
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
    private sendAuthRequest(): void {
        const message: AuthMessage = {
            type: AUTH.MESSAGE_TYPES.AUTH_REQ
        };

        this.sendMessageFn(JSON.stringify(message));
        this.log('Sent AUTH_REQ');
    }

    /**
     * Handle receiving an AUTH_REQ message
     */
    private async handleAuthRequest(): Promise<void> {
        if (this.state !== AuthState.WAITING_FOR_AUTH_REQ) {
            this.log(`Unexpected AUTH_REQ in state ${this.state}`);
            return;
        }

        this.log('Received AUTH_REQ, prompting user for animal names');
        this.state = AuthState.WAITING_FOR_USER_INPUT;

        // Get animal names from the user
        const animalNames = await this.promptForAnimalNames();

        if (!animalNames || animalNames.length !== AUTH.REQUIRED_ANIMALS) {
            this.log('Invalid animal names provided by user');
            this.state = AuthState.FAILED;
            this.emit('authFailed', 'Invalid animal names provided');
            this.cleanupAuth();
            return;
        }

        // Send AUTH_RESP with the animal names
        const message: AuthMessage = {
            type: AUTH.MESSAGE_TYPES.AUTH_RESP,
            payload: animalNames
        };

        this.sendMessageFn(JSON.stringify(message));
        this.log('Sent AUTH_RESP with animal names');
    }

    /**
     * Handle receiving an AUTH_RESP message with animal names
     */
    private async handleAuthResponse(receivedNames: string[]): Promise<void> {
        if (this.state !== AuthState.WAITING_FOR_AUTH_RESP) {
            this.log(`Unexpected AUTH_RESP in state ${this.state}`);
            return;
        }

        this.log('Received AUTH_RESP, prompting user for animal names to validate');

        // Get animal names from the user for validation
        const expectedNames = await this.promptForAnimalNames();

        if (!expectedNames || expectedNames.length !== AUTH.REQUIRED_ANIMALS) {
            this.log('Invalid animal names provided by user for validation');
            this.sendAuthFailure();
            return;
        }

        // Validate the animal names (case-insensitive)
        const normalizedReceived = receivedNames.map(name => name.toLowerCase());
        const normalizedExpected = expectedNames.map(name => name.toLowerCase());

        // Check if arrays have the same content regardless of order
        const isValid =
            normalizedReceived.length === normalizedExpected.length &&
            normalizedReceived.every(name => normalizedExpected.includes(name));

        if (isValid) {
            this.log('Animal names validated successfully');
            this.sendAuthSuccess();
        } else {
            this.log('Animal names validation failed');
            this.sendAuthFailure();
        }
    }

    /**
     * Send AUTH_SUCCESS message to the peer
     */
    private sendAuthSuccess(): void {
        const message: AuthMessage = {
            type: AUTH.MESSAGE_TYPES.AUTH_SUCCESS
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
    private sendAuthFailure(): void {
        const message: AuthMessage = {
            type: AUTH.MESSAGE_TYPES.AUTH_FAIL
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
    private handleAuthSuccess(): void {
        this.log('Received AUTH_SUCCESS');
        this.state = AuthState.AUTHENTICATED;
        this.emit('authSucceeded');
        this.cleanupAuth();
    }

    /**
     * Handle receiving AUTH_FAIL message
     */
    private handleAuthFailure(): void {
        this.log('Received AUTH_FAIL');
        this.state = AuthState.FAILED;
        this.emit('authFailed', 'Authentication rejected by peer');
        this.cleanupAuth();
    }

    /**
     * Prompt the user for the three animal names
     * @returns Array of animal names or null if cancelled
     */
    private async promptForAnimalNames(): Promise<string[] | null> {
        const animalNames: string[] = [];

        for (let i = 1; i <= AUTH.REQUIRED_ANIMALS; i++) {
            const animalName = await vscode.window.showInputBox({
                prompt: `Enter animal name ${i} of ${AUTH.REQUIRED_ANIMALS} for authentication`,
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
    private cleanupAuth(): void {
        if (this.authTimeout) {
            clearTimeout(this.authTimeout);
            this.authTimeout = null;
        }
    }

    /**
     * Cancel the authentication process
     */
    public cancelAuthentication(): void {
        this.log('Authentication cancelled');
        this.state = AuthState.FAILED;
        this.emit('authFailed', 'Authentication cancelled');
        this.cleanupAuth();
    }

    /**
     * Check if the authentication is in progress
     */
    public isAuthenticating(): boolean {
        return this.state !== AuthState.IDLE &&
            this.state !== AuthState.AUTHENTICATED &&
            this.state !== AuthState.FAILED;
    }

    /**
     * Check if the authentication has succeeded
     */
    public isAuthenticated(): boolean {
        return this.state === AuthState.AUTHENTICATED;
    }
}