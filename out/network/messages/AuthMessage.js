"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthFailMessage = exports.AuthSuccessMessage = exports.AuthResponseMessage = exports.AuthRequestMessage = exports.AuthMessage = void 0;
const IMessage_1 = require("../interfaces/IMessage");
const BaseMessage_1 = require("./BaseMessage");
/**
 * Base class for authentication-related messages.
 */
class AuthMessage extends BaseMessage_1.BaseMessage {
    /**
     * Creates a new AuthMessage.
     * @param type The specific auth message type
     */
    constructor(type) {
        super(type);
    }
}
exports.AuthMessage = AuthMessage;
/**
 * Authentication request message.
 */
class AuthRequestMessage extends AuthMessage {
    /**
     * Creates a new AuthRequestMessage.
     */
    constructor() {
        super(IMessage_1.MessageType.AUTH_REQ);
    }
    /**
     * Validates that the message is properly formed.
     * @returns True if the message is valid, false otherwise
     */
    validate() {
        return true; // No additional fields to validate
    }
    /**
     * Converts the message to a plain object for serialization.
     * @returns A plain object representation of the message
     */
    toJSON() {
        return {
            type: this.type
        };
    }
    /**
     * Creates an AuthRequestMessage from a parsed JSON object.
     * @param data The parsed JSON object
     * @returns A new AuthRequestMessage, or null if invalid
     */
    static fromJSON(data) {
        if (!data || typeof data !== 'object' || data.type !== IMessage_1.MessageType.AUTH_REQ) {
            return null;
        }
        return new AuthRequestMessage();
    }
}
exports.AuthRequestMessage = AuthRequestMessage;
/**
 * Authentication response message.
 */
class AuthResponseMessage extends AuthMessage {
    /**
     * Creates a new AuthResponseMessage.
     * @param animalNames The animal names for authentication
     */
    constructor(animalNames) {
        super(IMessage_1.MessageType.AUTH_RESP);
        this.animalNames = animalNames;
    }
    /**
     * Validates that the message is properly formed.
     * @returns True if the message is valid, false otherwise
     */
    validate() {
        return Array.isArray(this.animalNames) &&
            this.animalNames.length > 0 &&
            this.animalNames.every(name => typeof name === 'string' && name.length > 0);
    }
    /**
     * Converts the message to a plain object for serialization.
     * @returns A plain object representation of the message
     */
    toJSON() {
        return {
            type: this.type,
            payload: this.animalNames
        };
    }
    /**
     * Creates an AuthResponseMessage from a parsed JSON object.
     * @param data The parsed JSON object
     * @returns A new AuthResponseMessage, or null if invalid
     */
    static fromJSON(data) {
        if (!data || typeof data !== 'object' || data.type !== IMessage_1.MessageType.AUTH_RESP) {
            return null;
        }
        if (!Array.isArray(data.payload) ||
            data.payload.length === 0 ||
            !data.payload.every((name) => typeof name === 'string' && name.length > 0)) {
            return null;
        }
        return new AuthResponseMessage(data.payload);
    }
}
exports.AuthResponseMessage = AuthResponseMessage;
/**
 * Authentication success message.
 */
class AuthSuccessMessage extends AuthMessage {
    /**
     * Creates a new AuthSuccessMessage.
     */
    constructor() {
        super(IMessage_1.MessageType.AUTH_SUCCESS);
    }
    /**
     * Validates that the message is properly formed.
     * @returns True if the message is valid, false otherwise
     */
    validate() {
        return true; // No additional fields to validate
    }
    /**
     * Converts the message to a plain object for serialization.
     * @returns A plain object representation of the message
     */
    toJSON() {
        return {
            type: this.type
        };
    }
    /**
     * Creates an AuthSuccessMessage from a parsed JSON object.
     * @param data The parsed JSON object
     * @returns A new AuthSuccessMessage, or null if invalid
     */
    static fromJSON(data) {
        if (!data || typeof data !== 'object' || data.type !== IMessage_1.MessageType.AUTH_SUCCESS) {
            return null;
        }
        return new AuthSuccessMessage();
    }
}
exports.AuthSuccessMessage = AuthSuccessMessage;
/**
 * Authentication failure message.
 */
class AuthFailMessage extends AuthMessage {
    /**
     * Creates a new AuthFailMessage.
     * @param reason The reason for authentication failure
     */
    constructor(reason) {
        super(IMessage_1.MessageType.AUTH_FAIL);
        this.reason = reason;
    }
    /**
     * Validates that the message is properly formed.
     * @returns True if the message is valid, false otherwise
     */
    validate() {
        return typeof this.reason === 'string';
    }
    /**
     * Converts the message to a plain object for serialization.
     * @returns A plain object representation of the message
     */
    toJSON() {
        return {
            type: this.type,
            payload: this.reason
        };
    }
    /**
     * Creates an AuthFailMessage from a parsed JSON object.
     * @param data The parsed JSON object
     * @returns A new AuthFailMessage, or null if invalid
     */
    static fromJSON(data) {
        if (!data || typeof data !== 'object' || data.type !== IMessage_1.MessageType.AUTH_FAIL) {
            return null;
        }
        const reason = typeof data.payload === 'string' ? data.payload : 'Unknown error';
        return new AuthFailMessage(reason);
    }
}
exports.AuthFailMessage = AuthFailMessage;
//# sourceMappingURL=AuthMessage.js.map