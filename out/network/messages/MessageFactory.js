"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageFactory = void 0;
const MessageFactoryImpl_1 = require("./MessageFactoryImpl");
/**
 * Factory for creating message objects from serialized data.
 * This is a facade for the MessageFactoryImpl to maintain backward compatibility.
 */
class MessageFactory {
    /**
     * Creates a message from a serialized string.
     * @param data The serialized message
     * @returns The deserialized message, or null if invalid
     */
    static fromSerialized(data) {
        return MessageFactoryImpl_1.MessageFactoryImpl.fromSerialized(data);
    }
    /**
     * Creates a message from a parsed JSON object.
     * @param data The parsed JSON object
     * @returns The appropriate message object, or null if invalid
     */
    static fromJSON(data) {
        return MessageFactoryImpl_1.MessageFactoryImpl.fromJSON(data);
    }
}
exports.MessageFactory = MessageFactory;
//# sourceMappingURL=MessageFactory.js.map