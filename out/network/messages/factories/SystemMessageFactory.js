"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemMessageFactory = void 0;
const IMessage_1 = require("../../interfaces/IMessage");
const SystemMessage_1 = require("../SystemMessage");
/**
 * Factory for creating SystemMessage objects.
 */
class SystemMessageFactory {
    /**
     * Creates a SystemMessage from a parsed JSON object.
     * @param data The parsed JSON object
     * @returns A new SystemMessage, or null if invalid
     */
    static fromJSON(data) {
        if (data.type !== IMessage_1.MessageType.SYSTEM) {
            return null;
        }
        return SystemMessage_1.SystemMessage.fromJSON(data);
    }
}
exports.SystemMessageFactory = SystemMessageFactory;
//# sourceMappingURL=SystemMessageFactory.js.map