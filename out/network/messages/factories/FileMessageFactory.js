"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileMessageFactory = void 0;
const IMessage_1 = require("../../interfaces/IMessage");
const FileRequestMessage_1 = require("../FileRequestMessage");
const FileChunkMessage_1 = require("../FileChunkMessage");
const FileCompleteMessage_1 = require("../FileCompleteMessage");
/**
 * Factory for creating file-related message objects.
 */
class FileMessageFactory {
    /**
     * Creates a file message from a parsed JSON object.
     * @param data The parsed JSON object
     * @returns A new file message, or null if invalid
     */
    static fromJSON(data) {
        if (!data || typeof data !== 'object') {
            return null;
        }
        switch (data.type) {
            case IMessage_1.MessageType.FILE_REQ:
                return FileRequestMessage_1.FileRequestMessage.fromJSON(data);
            case IMessage_1.MessageType.FILE_CHUNK:
                return FileChunkMessage_1.FileChunkMessage.fromJSON(data);
            case IMessage_1.MessageType.FILE_COMPLETE:
                return FileCompleteMessage_1.FileCompleteMessage.fromJSON(data);
            default:
                return null;
        }
    }
    /**
     * Checks if the message type is a file message type.
     * @param type The message type to check
     * @returns True if it's a file message type, false otherwise
     */
    static isFileMessageType(type) {
        return type === IMessage_1.MessageType.FILE_REQ ||
            type === IMessage_1.MessageType.FILE_CHUNK ||
            type === IMessage_1.MessageType.FILE_COMPLETE;
    }
}
exports.FileMessageFactory = FileMessageFactory;
//# sourceMappingURL=FileMessageFactory.js.map