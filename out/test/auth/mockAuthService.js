"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
/**
 * Authentication Service
 */
class AuthService {
    /**
     * Create a new AuthService
     *
     * @param socket The socket to communicate over
     * @param eventEmitter Event emitter for auth events
     */
    constructor(socket, eventEmitter) {
        this.socket = socket;
        this.eventEmitter = eventEmitter;
    }
    /**
     * Initialize the auth service
     */
    initialize() {
        this.socket.on('data', this.handleData.bind(this));
        this.socket.on('error', this.handleError.bind(this));
    }
    /**
     * Send an authentication request
     */
    sendAuthRequest() {
        const message = JSON.stringify({
            type: 'AUTH_REQ'
        });
        this.socket.write(message);
    }
    /**
     * Handle an authentication response
     *
     * @param data The response data
     */
    handleAuthResponse(data) {
        this.eventEmitter.emit('auth-challenge', data.challenge);
    }
    /**
     * Submit an authentication response
     *
     * @param response The response to the challenge
     */
    submitAuthResponse(response) {
        const message = JSON.stringify({
            type: 'AUTH_RESP',
            response: response
        });
        this.socket.write(message);
    }
    /**
     * Handle an authentication result
     *
     * @param data The result data
     */
    handleAuthResult(data) {
        if (data.success) {
            this.eventEmitter.emit('auth-success');
        }
        else {
            this.eventEmitter.emit('auth-failure', data.reason);
        }
    }
    /**
     * Handle incoming data
     *
     * @param data The incoming data
     */
    handleData(data) {
        try {
            const message = JSON.parse(data.toString());
            switch (message.type) {
                case 'AUTH_RESP':
                    this.handleAuthResponse(message);
                    break;
                case 'AUTH_RESULT':
                    this.handleAuthResult(message);
                    break;
            }
        }
        catch (error) {
            console.error('Error parsing auth message:', error);
        }
    }
    /**
     * Handle socket errors
     *
     * @param error The error
     */
    handleError(error) {
        console.error('Auth socket error:', error);
        this.eventEmitter.emit('auth-error', error.message);
    }
    /**
     * Clean up resources
     */
    cleanup() {
        this.socket.off('data', this.handleData.bind(this));
        this.socket.off('error', this.handleError.bind(this));
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=mockAuthService.js.map