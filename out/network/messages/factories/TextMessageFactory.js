"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextMessageFactory = void 0;
const IMessage_1 = require("../../interfaces/IMessage");
const TextMessage_1 = require("../TextMessage");
/**
 * Factory for creating TextMessage objects.
 */
class TextMessageFactory {
    /**
     * Creates a TextMessage from a parsed JSON object.
     * @param data The parsed JSON object
     * @returns A new TextMessage, or null if invalid
     */
    static fromJSON(data) {
        if (data.type !== IMessage_1.MessageType.TEXT) {
            return null;
        }
        return TextMessage_1.TextMessage.fromJSON(data);
    }
}
exports.TextMessageFactory = TextMessageFactory;
//# sourceMappingURL=TextMessageFactory.js.map