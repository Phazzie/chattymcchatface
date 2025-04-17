"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileChunkMessage = void 0;
const IMessage_1 = require("../interfaces/IMessage");
const FileMessageBase_1 = require("./FileMessageBase");
/**
 * File chunk message for transferring file data.
 */
class FileChunkMessage extends FileMessageBase_1.FileMessageBase {
    /**
     * Creates a new FileChunkMessage.
     * @param transferId Unique ID for the file transfer
     * @param chunkIndex Index of this chunk
     * @param totalChunks Total number of chunks
     * @param data Base64-encoded chunk data
     */
    constructor(transferId, chunkIndex, totalChunks, data) {
        super(IMessage_1.MessageType.FILE_CHUNK);
        this.transferId = transferId;
        this.chunkIndex = chunkIndex;
        this.totalChunks = totalChunks;
        this.data = data;
    }
    /**
     * Validates that the message is properly formed.
     * @returns True if the message is valid, false otherwise
     */
    validate() {
        return (typeof this.transferId === 'string' &&
            this.transferId.length > 0 &&
            typeof this.chunkIndex === 'number' &&
            this.chunkIndex >= 0 &&
            typeof this.totalChunks === 'number' &&
            this.totalChunks > 0 &&
            this.chunkIndex < this.totalChunks &&
            typeof this.data === 'string' &&
            this.data.length > 0);
    }
    /**
     * Converts the message to a plain object for serialization.
     * @returns A plain object representation of the message
     */
    toJSON() {
        return {
            type: this.type,
            transferId: this.transferId,
            chunkIndex: this.chunkIndex,
            totalChunks: this.totalChunks,
            data: this.data
        };
    }
    /**
     * Creates a FileChunkMessage from a parsed JSON object.
     * @param data The parsed JSON object
     * @returns A new FileChunkMessage, or null if invalid
     */
    static fromJSON(data) {
        if (!data || typeof data !== 'object' || data.type !== IMessage_1.MessageType.FILE_CHUNK) {
            return null;
        }
        if (typeof data.transferId !== 'string' ||
            data.transferId.length === 0 ||
            typeof data.chunkIndex !== 'number' ||
            data.chunkIndex < 0 ||
            typeof data.totalChunks !== 'number' ||
            data.totalChunks <= 0 ||
            data.chunkIndex >= data.totalChunks ||
            typeof data.data !== 'string' ||
            data.data.length === 0) {
            return null;
        }
        return new FileChunkMessage(data.transferId, data.chunkIndex, data.totalChunks, data.data);
    }
}
exports.FileChunkMessage = FileChunkMessage;
//# sourceMappingURL=FileChunkMessage.js.map