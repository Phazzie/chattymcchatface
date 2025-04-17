"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextMessage = void 0;
const IMessage_1 = require("../interfaces/IMessage");
const BaseMessage_1 = require("./BaseMessage");
/**
 * Represents a text message sent between peers.
 */
class TextMessage extends BaseMessage_1.BaseMessage {
    /**
     * Creates a new TextMessage.
     * @param content The text content of the message
     * @param sender Optional sender identifier
     * @param timestamp Optional timestamp (defaults to now)
     */
    constructor(content, sender, timestamp = Date.now()) {
        super(IMessage_1.MessageType.TEXT);
        this.content = content;
        this.sender = sender;
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
            sender: this.sender,
            timestamp: this.timestamp
        };
    }
    /**
     * Creates a TextMessage from a parsed JSON object.
     * @param data The parsed JSON object
     * @returns A new TextMessage, or null if invalid
     */
    static fromJSON(data) {
        if (!data || typeof data !== 'object' || data.type !== IMessage_1.MessageType.TEXT) {
            return null;
        }
        if (typeof data.content !== 'string' || data.content.length === 0) {
            return null;
        }
        return new TextMessage(data.content, data.sender, typeof data.timestamp === 'number' ? data.timestamp : Date.now());
    }
}
exports.TextMessage = TextMessage;
//# sourceMappingURL=TextMessage.js.map