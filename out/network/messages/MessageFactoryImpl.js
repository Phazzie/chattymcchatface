"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageFactoryImpl = void 0;
const TextMessageFactory_1 = require("./factories/TextMessageFactory");
const AuthMessageFactory_1 = require("./factories/AuthMessageFactory");
const SystemMessageFactory_1 = require("./factories/SystemMessageFactory");
const FileMessageFactory_1 = require("./factories/FileMessageFactory");
/**
 * Factory for creating message objects from serialized data.
 */
class MessageFactoryImpl {
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
            return MessageFactoryImpl.fromJSON(parsed);
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
        // Try each specialized factory
        const message = TextMessageFactory_1.TextMessageFactory.fromJSON(data) ||
            AuthMessageFactory_1.AuthMessageFactory.fromJSON(data) ||
            SystemMessageFactory_1.SystemMessageFactory.fromJSON(data) ||
            FileMessageFactory_1.FileMessageFactory.fromJSON(data);
        return message;
    }
}
exports.MessageFactoryImpl = MessageFactoryImpl;
//# sourceMappingURL=MessageFactoryImpl.js.map