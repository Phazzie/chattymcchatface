"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthMessageFactory = void 0;
const IMessage_1 = require("../../interfaces/IMessage");
const AuthMessage_1 = require("../AuthMessage");
/**
 * Factory for creating auth-related message objects.
 */
class AuthMessageFactory {
    /**
     * Creates an auth message from a parsed JSON object.
     * @param data The parsed JSON object
     * @returns A new auth message, or null if invalid
     */
    static fromJSON(data) {
        if (!data || typeof data !== 'object') {
            return null;
        }
        switch (data.type) {
            case IMessage_1.MessageType.AUTH_REQ:
                return AuthMessage_1.AuthRequestMessage.fromJSON(data);
            case IMessage_1.MessageType.AUTH_RESP:
                return AuthMessage_1.AuthResponseMessage.fromJSON(data);
            case IMessage_1.MessageType.AUTH_SUCCESS:
                return AuthMessage_1.AuthSuccessMessage.fromJSON(data);
            case IMessage_1.MessageType.AUTH_FAIL:
                return AuthMessage_1.AuthFailMessage.fromJSON(data);
            default:
                return null;
        }
    }
    /**
     * Checks if the message type is an auth message type.
     * @param type The message type to check
     * @returns True if it's an auth message type, false otherwise
     */
    static isAuthMessageType(type) {
        return type === IMessage_1.MessageType.AUTH_REQ ||
            type === IMessage_1.MessageType.AUTH_RESP ||
            type === IMessage_1.MessageType.AUTH_SUCCESS ||
            type === IMessage_1.MessageType.AUTH_FAIL;
    }
}
exports.AuthMessageFactory = AuthMessageFactory;
//# sourceMappingURL=AuthMessageFactory.js.map