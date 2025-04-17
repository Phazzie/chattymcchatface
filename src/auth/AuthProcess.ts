import { EventEmitter } from 'events';
import { IAuthProcess } from './interfaces/IAuthProcess';
import { ITimer } from './interfaces/ITimer';
import { ILogger } from '../interfaces';
import { AUTH } from '../constants';

type AuthStateValue = 'IDLE' | 'AWAITING_REQ' | 'AWAITING_RESP' | 'AWAITING_SUCCESS' | 'DONE';

/**
 * Implements the authentication state machine for a single connection.
 */
export class AuthProcess extends EventEmitter implements IAuthProcess {
    private state: AuthStateValue = 'IDLE';
    private timeoutHandle: NodeJS.Timeout | null = null;

    constructor(
        private readonly connectionId: string,
        private readonly isInitiator: boolean,
        private readonly sendMessageCallback: (message: string) => boolean,
        private readonly timer: ITimer,
        private readonly logger: ILogger
    ) {
        super();
    }

    getConnectionId(): string {
        return this.connectionId;
    }

    start(): void {
        if (this.state !== 'IDLE') {
            return;
        }
        
        this.logger.info(`[AuthProcess:${this.connectionId}] Starting (Initiator: ${this.isInitiator})`);
        this.resetTimeout();

        if (this.isInitiator) {
            this.sendAuthRequest();
            this.setState('AWAITING_RESP');
        } else {
            this.setState('AWAITING_REQ');
        }
    }

    handleMessage(message: any): void {
        if (this.state === 'DONE') {
            return; // Ignore messages if already done
        }
        
        this.logger.debug(`[AuthProcess:${this.connectionId}] Handling message: ${message.type}, State: ${this.state}`);
        this.resetTimeout(); // Reset timeout on any valid message activity

        switch (message.type) {
            case AUTH.MESSAGE_TYPES.AUTH_REQ:
                this.handleAuthRequest(message);
                break;
            case AUTH.MESSAGE_TYPES.AUTH_RESP:
                this.handleAuthResponse(message);
                break;
            case AUTH.MESSAGE_TYPES.AUTH_SUCCESS:
                this.handleAuthSuccess();
                break;
            case AUTH.MESSAGE_TYPES.AUTH_FAIL:
                this.handleAuthFail(message.payload?.reason || 'Peer reported failure');
                break;
            default:
                this.logger.warn(`[AuthProcess:${this.connectionId}] Received unexpected message type: ${message.type}`);
        }
    }

    abort(reason: string): void {
        this.logger.warn(`[AuthProcess:${this.connectionId}] Aborting: ${reason}`);
        this.fail(reason, false); // Don't send fail message if aborted locally
    }

    private handleAuthRequest(message: any): void {
        if (this.state !== 'AWAITING_REQ') {
            return this.fail('Unexpected AUTH_REQ');
        }
        
        // TODO: Validate request payload if necessary
        this.sendAuthResponse();
        this.setState('AWAITING_SUCCESS');
    }

    private handleAuthResponse(message: any): void {
        if (this.state !== 'AWAITING_RESP') {
            return this.fail('Unexpected AUTH_RESP');
        }
        
        // TODO: Validate response payload if necessary
        this.sendAuthSuccess();
        this.succeed();
    }

    private handleAuthSuccess(): void {
        if (this.state !== 'AWAITING_SUCCESS') {
            return this.fail('Unexpected AUTH_SUCCESS');
        }
        
        this.succeed();
    }

    private handleAuthFail(reason: string): void {
        this.fail(`Peer failed authentication: ${reason}`, false); // Don't send fail back
    }

    private sendAuthRequest(): void {
        this.sendMessage({ type: AUTH.MESSAGE_TYPES.AUTH_REQ, payload: { /* data */ } });
    }

    private sendAuthResponse(): void {
        this.sendMessage({ type: AUTH.MESSAGE_TYPES.AUTH_RESP, payload: { /* data */ } });
    }

    private sendAuthSuccess(): void {
        this.sendMessage({ type: AUTH.MESSAGE_TYPES.AUTH_SUCCESS, payload: {} });
    }

    private sendAuthFail(reason: string): void {
        this.sendMessage({ type: AUTH.MESSAGE_TYPES.AUTH_FAIL, payload: { reason } });
    }

    private sendMessage(message: any): void {
        try {
            const messageString = JSON.stringify(message);
            const success = this.sendMessageCallback(messageString);
            
            if (!success) {
                this.logger.warn(`[AuthProcess:${this.connectionId}] Failed to send message: ${message.type}`);
            }
        } catch (error: any) {
            this.logger.error(`[AuthProcess:${this.connectionId}] Error stringifying message: ${error?.message}`, error);
        }
    }

    private setState(newState: AuthStateValue): void {
        this.logger.debug(`[AuthProcess:${this.connectionId}] State transition: ${this.state} -> ${newState}`);
        this.state = newState;
    }

    private succeed(): void {
        if (this.state === 'DONE') {
            return; // Already succeeded or failed
        }
        
        this.logger.info(`[AuthProcess:${this.connectionId}] Authentication successful`);
        this.clearTimeout();
        this.setState('DONE');
        this.emit('authenticated', this.connectionId);
    }

    private fail(reason: string, sendFailMessage: boolean = true): void {
        if (this.state === 'DONE') {
            return; // Already succeeded or failed
        }
        
        this.logger.warn(`[AuthProcess:${this.connectionId}] Authentication failed: ${reason}`);
        this.clearTimeout();
        
        if (sendFailMessage) {
            this.sendAuthFail(reason);
        }
        
        this.setState('DONE');
        this.emit('failed', this.connectionId, reason);
    }

    private resetTimeout(): void {
        this.clearTimeout();
        this.timeoutHandle = this.timer.set(() => this.handleTimeout(), AUTH.TIMEOUT);
    }

    private clearTimeout(): void {
        this.timer.clear(this.timeoutHandle);
        this.timeoutHandle = null;
    }

    private handleTimeout(): void {
        this.timeoutHandle = null;
        this.fail('Authentication timed out');
    }
}
