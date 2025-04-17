"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageType = void 0;
/**
 * Defines the message types used in the chat application.
 */
var MessageType;
(function (MessageType) {
    MessageType["TEXT"] = "TEXT";
    MessageType["AUTH_REQ"] = "AUTH_REQ";
    MessageType["AUTH_RESP"] = "AUTH_RESP";
    MessageType["AUTH_SUCCESS"] = "AUTH_SUCCESS";
    MessageType["AUTH_FAIL"] = "AUTH_FAIL";
    MessageType["SYSTEM"] = "SYSTEM";
    MessageType["FILE_REQ"] = "FILE_REQ";
    MessageType["FILE_CHUNK"] = "FILE_CHUNK";
    MessageType["FILE_COMPLETE"] = "FILE_COMPLETE";
})(MessageType = exports.MessageType || (exports.MessageType = {}));
//# sourceMappingURL=IMessage.js.map