"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthProcessFactory = void 0;
const AuthProcess_1 = require("./AuthProcess");
/**
 * Factory for creating AuthProcess instances.
 */
class AuthProcessFactory {
    constructor(timer) {
        this.timer = timer;
    }
    create(connectionId, isInitiator, sendMessage, logger) {
        return new AuthProcess_1.AuthProcess(connectionId, isInitiator, sendMessage, this.timer, logger);
    }
}
exports.AuthProcessFactory = AuthProcessFactory;
//# sourceMappingURL=AuthProcessFactory.js.map