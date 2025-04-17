/**
 * Mock Authentication Service for Tests
 */
import { EventEmitter } from 'events';
import { Socket } from 'net';

/**
 * Authentication Service
 */
export class AuthService {
    private socket: Socket;
    private eventEmitter: EventEmitter;

    /**
     * Create a new AuthService
     * 
     * @param socket The socket to communicate over
     * @param eventEmitter Event emitter for auth events
     */
    constructor(socket: Socket, eventEmitter: EventEmitter) {
        this.socket = socket;
        this.eventEmitter = eventEmitter;
    }

    /**
     * Initialize the auth service
     */
    public initialize(): void {
        this.socket.on('data', this.handleData.bind(this));
        this.socket.on('error', this.handleError.bind(this));
    }

    /**
     * Send an authentication request
     */
    public sendAuthRequest(): void {
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
    public handleAuthResponse(data: { challenge: string }): void {
        this.eventEmitter.emit('auth-challenge', data.challenge);
    }

    /**
     * Submit an authentication response
     * 
     * @param response The response to the challenge
     */
    public submitAuthResponse(response: string): void {
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
    public handleAuthResult(data: { success: boolean, reason?: string }): void {
        if (data.success) {
            this.eventEmitter.emit('auth-success');
        } else {
            this.eventEmitter.emit('auth-failure', data.reason);
        }
    }

    /**
     * Handle incoming data
     * 
     * @param data The incoming data
     */
    private handleData(data: Buffer): void {
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
        } catch (error) {
            console.error('Error parsing auth message:', error);
        }
    }

    /**
     * Handle socket errors
     * 
     * @param error The error
     */
    private handleError(error: Error): void {
        console.error('Auth socket error:', error);
        this.eventEmitter.emit('auth-error', error.message);
    }

    /**
     * Clean up resources
     */
    public cleanup(): void {
        this.socket.off('data', this.handleData.bind(this));
        this.socket.off('error', this.handleError.bind(this));
    }
}
