"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseMessage = void 0;
/**
 * Base class for all message implementations.
 * Provides common functionality for serialization and validation.
 */
class BaseMessage {
    /**
     * Creates a new BaseMessage.
     * @param type The type of message
     */
    constructor(type) {
        this.type = type;
    }
    /**
     * Serializes the message to a string for transmission.
     * @returns The serialized message
     */
    serialize() {
        return JSON.stringify(this.toJSON());
    }
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
            // Delegate to the appropriate factory based on message type
            // This will be implemented by subclasses
            return null;
        }
        catch (error) {
            return null;
        }
    }
}
exports.BaseMessage = BaseMessage;
//# sourceMappingURL=BaseMessage.js.map