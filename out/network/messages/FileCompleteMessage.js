"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileCompleteMessage = void 0;
const IMessage_1 = require("../interfaces/IMessage");
const FileMessageBase_1 = require("./FileMessageBase");
/**
 * File transfer complete message.
 */
class FileCompleteMessage extends FileMessageBase_1.FileMessageBase {
    /**
     * Creates a new FileCompleteMessage.
     * @param transferId Unique ID for the file transfer
     */
    constructor(transferId) {
        super(IMessage_1.MessageType.FILE_COMPLETE);
        this.transferId = transferId;
    }
    /**
     * Validates that the message is properly formed.
     * @returns True if the message is valid, false otherwise
     */
    validate() {
        return typeof this.transferId === 'string' && this.transferId.length > 0;
    }
    /**
     * Converts the message to a plain object for serialization.
     * @returns A plain object representation of the message
     */
    toJSON() {
        return {
            type: this.type,
            transferId: this.transferId
        };
    }
    /**
     * Creates a FileCompleteMessage from a parsed JSON object.
     * @param data The parsed JSON object
     * @returns A new FileCompleteMessage, or null if invalid
     */
    static fromJSON(data) {
        if (!data || typeof data !== 'object' || data.type !== IMessage_1.MessageType.FILE_COMPLETE) {
            return null;
        }
        if (typeof data.transferId !== 'string' || data.transferId.length === 0) {
            return null;
        }
        return new FileCompleteMessage(data.transferId);
    }
}
exports.FileCompleteMessage = FileCompleteMessage;
//# sourceMappingURL=FileCompleteMessage.js.map