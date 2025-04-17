"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemMessage = void 0;
const IMessage_1 = require("../interfaces/IMessage");
const BaseMessage_1 = require("./BaseMessage");
/**
 * Represents a system message for internal notifications.
 */
class SystemMessage extends BaseMessage_1.BaseMessage {
    /**
     * Creates a new SystemMessage.
     * @param content The system message content
     * @param timestamp Optional timestamp (defaults to now)
     */
    constructor(content, timestamp = Date.now()) {
        super(IMessage_1.MessageType.SYSTEM);
        this.content = content;
        this.timestamp = timestamp;
    }
    /**
     * Validates that the message is properly formed.
     * @returns True if the message is valid, false otherwise
     */
    validate() {
        return typeof this.content === 'string' && this.content.length > 0;
    }
    /**
     * Converts the message to a plain object for serialization.
     * @returns A plain object representation of the message
     */
    toJSON() {
        return {
            type: this.type,
            content: this.content,
            timestamp: this.timestamp
        };
    }
    /**
     * Creates a SystemMessage from a parsed JSON object.
     * @param data The parsed JSON object
     * @returns A new SystemMessage, or null if invalid
     */
    static fromJSON(data) {
        if (!data || typeof data !== 'object' || data.type !== IMessage_1.MessageType.SYSTEM) {
            return null;
        }
        if (typeof data.content !== 'string' || data.content.length === 0) {
            return null;
        }
        return new SystemMessage(data.content, typeof data.timestamp === 'number' ? data.timestamp : Date.now());
    }
}
exports.SystemMessage = SystemMessage;
//# sourceMappingURL=SystemMessage.js.map