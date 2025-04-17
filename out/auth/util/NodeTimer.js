"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeTimer = void 0;
/**
 * Concrete implementation of ITimer using NodeJS global functions.
 */
class NodeTimer {
    set(callback, ms) {
        return setTimeout(callback, ms);
    }
    clear(handle) {
        if (handle) {
            clearTimeout(handle);
        }
    }
}
exports.NodeTimer = NodeTimer;
//# sourceMappingURL=NodeTimer.js.map