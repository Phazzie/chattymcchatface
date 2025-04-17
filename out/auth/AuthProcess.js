"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthProcess = void 0;
const events_1 = require("events");
const constants_1 = require("../constants");
/**
 * Implements the authentication state machine for a single connection.
 */
class AuthProcess extends events_1.EventEmitter {
    constructor(connectionId, isInitiator, sendMessageCallback, timer, logger) {
        super();
        this.connectionId = connectionId;
        this.isInitiator = isInitiator;
        this.sendMessageCallback = sendMessageCallback;
        this.timer = timer;
        this.logger = logger;
        this.state = 'IDLE';
        this.timeoutHandle = null;
    }
    getConnectionId() {
        return this.connectionId;
    }
    start() {
        if (this.state !== 'IDLE') {
            return;
        }
        this.logger.info(`[AuthProcess:${this.connectionId}] Starting (Initiator: ${this.isInitiator})`);
        this.resetTimeout();
        if (this.isInitiator) {
            this.sendAuthRequest();
            this.setState('AWAITING_RESP');
        }
        else {
            this.setState('AWAITING_REQ');
        }
    }
    handleMessage(message) {
        if (this.state === 'DONE') {
            return; // Ignore messages if already done
        }
        this.logger.debug(`[AuthProcess:${this.connectionId}] Handling message: ${message.type}, State: ${this.state}`);
        this.resetTimeout(); // Reset timeout on any valid message activity
        switch (message.type) {
            case constants_1.AUTH.MESSAGE_TYPES.AUTH_REQ:
                this.handleAuthRequest(message);
                break;
            case constants_1.AUTH.MESSAGE_TYPES.AUTH_RESP:
                this.handleAuthResponse(message);
                break;
            case constants_1.AUTH.MESSAGE_TYPES.AUTH_SUCCESS:
                this.handleAuthSuccess();
                break;
            case constants_1.AUTH.MESSAGE_TYPES.AUTH_FAIL:
                this.handleAuthFail(message.payload?.reason || 'Peer reported failure');
                break;
            default:
                this.logger.warn(`[AuthProcess:${this.connectionId}] Received unexpected message type: ${message.type}`);
        }
    }
    abort(reason) {
        this.logger.warn(`[AuthProcess:${this.connectionId}] Aborting: ${reason}`);
        this.fail(reason, false); // Don't send fail message if aborted locally
    }
    handleAuthRequest(message) {
        if (this.state !== 'AWAITING_REQ') {
            return this.fail('Unexpected AUTH_REQ');
        }
        // TODO: Validate request payload if necessary
        this.sendAuthResponse();
        this.setState('AWAITING_SUCCESS');
    }
    handleAuthResponse(message) {
        if (this.state !== 'AWAITING_RESP') {
            return this.fail('Unexpected AUTH_RESP');
        }
        // TODO: Validate response payload if necessary
        this.sendAuthSuccess();
        this.succeed();
    }
    handleAuthSuccess() {
        if (this.state !== 'AWAITING_SUCCESS') {
            return this.fail('Unexpected AUTH_SUCCESS');
        }
        this.succeed();
    }
    handleAuthFail(reason) {
        this.fail(`Peer failed authentication: ${reason}`, false); // Don't send fail back
    }
    sendAuthRequest() {
        this.sendMessage({ type: constants_1.AUTH.MESSAGE_TYPES.AUTH_REQ, payload: { /* data */} });
    }
    sendAuthResponse() {
        this.sendMessage({ type: constants_1.AUTH.MESSAGE_TYPES.AUTH_RESP, payload: { /* data */} });
    }
    sendAuthSuccess() {
        this.sendMessage({ type: constants_1.AUTH.MESSAGE_TYPES.AUTH_SUCCESS, payload: {} });
    }
    sendAuthFail(reason) {
        this.sendMessage({ type: constants_1.AUTH.MESSAGE_TYPES.AUTH_FAIL, payload: { reason } });
    }
    sendMessage(message) {
        try {
            const messageString = JSON.stringify(message);
            const success = this.sendMessageCallback(messageString);
            if (!success) {
                this.logger.warn(`[AuthProcess:${this.connectionId}] Failed to send message: ${message.type}`);
            }
        }
        catch (error) {
            this.logger.error(`[AuthProcess:${this.connectionId}] Error stringifying message: ${error?.message}`, error);
        }
    }
    setState(newState) {
        this.logger.debug(`[AuthProcess:${this.connectionId}] State transition: ${this.state} -> ${newState}`);
        this.state = newState;
    }
    succeed() {
        if (this.state === 'DONE') {
            return; // Already succeeded or failed
        }
        this.logger.info(`[AuthProcess:${this.connectionId}] Authentication successful`);
        this.clearTimeout();
        this.setState('DONE');
        this.emit('authenticated', this.connectionId);
    }
    fail(reason, sendFailMessage = true) {
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
    resetTimeout() {
        this.clearTimeout();
        this.timeoutHandle = this.timer.set(() => this.handleTimeout(), constants_1.AUTH.TIMEOUT);
    }
    clearTimeout() {
        this.timer.clear(this.timeoutHandle);
        this.timeoutHandle = null;
    }
    handleTimeout() {
        this.timeoutHandle = null;
        this.fail('Authentication timed out');
    }
}
exports.AuthProcess = AuthProcess;
//# sourceMappingURL=AuthProcess.js.map