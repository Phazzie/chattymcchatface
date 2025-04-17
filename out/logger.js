"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
/**
 * Provides logging capabilities using a VS Code OutputChannel.
 */
class Logger {
    /**
     * Creates an instance of Logger.
     * @param outputChannel The VS Code OutputChannel to write logs to.
     * @param prefix An optional prefix for log messages (defaults to 'ChattyMcChatface').
     */
    constructor(outputChannel, prefix = 'ChattyMcChatface') {
        this.outputChannel = outputChannel;
        this.prefix = prefix;
    }
    /**
     * Logs an informational message.
     * @param message The message to log.
     */
    info(message) {
        this.log('INFO', message);
    }
    /**
     * Logs a warning message.
     * @param message The message to log.
     */
    warn(message) {
        this.log('WARN', message);
    }
    /**
     * Logs an error message.
     * @param message The primary error message.
     * @param error Optional error object or additional details.
     */
    error(message, error) {
        this.log('ERROR', message);
        if (error) {
            if (error instanceof Error) {
                this.log('ERROR', `Stack: ${error.stack}`);
            }
            else {
                this.log('ERROR', `Details: ${JSON.stringify(error)}`);
            }
        }
    }
    /**
     * Helper method to format and write the log message.
     * @param level The log level (e.g., 'INFO', 'WARN', 'ERROR').
     * @param message The message content.
     */
    log(level, message) {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[${timestamp}] [${this.prefix}] [${level}] ${message}`);
    }
}
exports.Logger = Logger;
//# sourceMappingURL=logger.js.map