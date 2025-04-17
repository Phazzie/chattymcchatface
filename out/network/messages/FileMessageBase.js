"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileMessageBase = void 0;
const BaseMessage_1 = require("./BaseMessage");
/**
 * Base class for file-related messages.
 */
class FileMessageBase extends BaseMessage_1.BaseMessage {
    /**
     * Creates a new FileMessageBase.
     * @param type The specific file message type
     */
    constructor(type) {
        super(type);
    }
}
exports.FileMessageBase = FileMessageBase;
//# sourceMappingURL=FileMessageBase.js.map