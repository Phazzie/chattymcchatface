"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileRequestMessage = void 0;
const IMessage_1 = require("../interfaces/IMessage");
const FileMessageBase_1 = require("./FileMessageBase");
/**
 * File transfer request message.
 */
class FileRequestMessage extends FileMessageBase_1.FileMessageBase {
    /**
     * Creates a new FileRequestMessage.
     * @param transferId Unique ID for the file transfer
     * @param fileName Name of the file being transferred
     * @param fileSize Size of the file in bytes
     */
    constructor(transferId, fileName, fileSize) {
        super(IMessage_1.MessageType.FILE_REQ);
        this.transferId = transferId;
        this.fileName = fileName;
        this.fileSize = fileSize;
    }
    /**
     * Validates that the message is properly formed.
     * @returns True if the message is valid, false otherwise
     */
    validate() {
        return (typeof this.transferId === 'string' &&
            this.transferId.length > 0 &&
            typeof this.fileName === 'string' &&
            this.fileName.length > 0 &&
            typeof this.fileSize === 'number' &&
            this.fileSize > 0);
    }
    /**
     * Converts the message to a plain object for serialization.
     * @returns A plain object representation of the message
     */
    toJSON() {
        return {
            type: this.type,
            transferId: this.transferId,
            fileName: this.fileName,
            fileSize: this.fileSize
        };
    }
    /**
     * Creates a FileRequestMessage from a parsed JSON object.
     * @param data The parsed JSON object
     * @returns A new FileRequestMessage, or null if invalid
     */
    static fromJSON(data) {
        if (!data || typeof data !== 'object' || data.type !== IMessage_1.MessageType.FILE_REQ) {
            return null;
        }
        if (typeof data.transferId !== 'string' ||
            data.transferId.length === 0 ||
            typeof data.fileName !== 'string' ||
            data.fileName.length === 0 ||
            typeof data.fileSize !== 'number' ||
            data.fileSize <= 0) {
            return null;
        }
        return new FileRequestMessage(data.transferId, data.fileName, data.fileSize);
    }
}
exports.FileRequestMessage = FileRequestMessage;
//# sourceMappingURL=FileRequestMessage.js.map