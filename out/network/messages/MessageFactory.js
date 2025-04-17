"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageFactory = void 0;
const IMessage_1 = require("../interfaces/IMessage");
const TextMessage_1 = require("./TextMessage");
const AuthMessage_1 = require("./AuthMessage");
const SystemMessage_1 = require("./SystemMessage");
/**
 * Factory for creating message objects from serialized data.
 */
class MessageFactory {
    /**
     * Creates a message from a serialized string.
     * @param data The serialized message
     * @returns The deserialized message, or null if invalid
     */
    static fromSerialized(data) {
        try {
            const parsed = JSON.parse(data);
            if (!parsed || typeof parsed !== 'object' || !parsed.type) {
                return null;
            }
            return MessageFactory.fromJSON(parsed);
        }
        catch (error) {
            return null;
        }
    }
    /**
     * Creates a message from a parsed JSON object.
     * @param data The parsed JSON object
     * @returns The appropriate message object, or null if invalid
     */
    static fromJSON(data) {
        if (!data || typeof data !== 'object' || !data.type) {
            return null;
        }
        switch (data.type) {
            case IMessage_1.MessageType.TEXT:
                return TextMessage_1.TextMessage.fromJSON(data);
            case IMessage_1.MessageType.AUTH_REQ:
                return AuthMessage_1.AuthRequestMessage.fromJSON(data);
            case IMessage_1.MessageType.AUTH_RESP:
                return AuthMessage_1.AuthResponseMessage.fromJSON(data);
            case IMessage_1.MessageType.AUTH_SUCCESS:
                return AuthMessage_1.AuthSuccessMessage.fromJSON(data);
            case IMessage_1.MessageType.AUTH_FAIL:
                return AuthMessage_1.AuthFailMessage.fromJSON(data);
            case IMessage_1.MessageType.SYSTEM:
                return SystemMessage_1.SystemMessage.fromJSON(data);
            default:
                return null;
        }
    }
}
exports.MessageFactory = MessageFactory;
//# sourceMappingURL=MessageFactory.js.map