import * as vscode from 'vscode';
import { ILogger } from './interfaces'; // We'll define this next

/**
 * Provides logging capabilities using a VS Code OutputChannel.
 */
export class Logger implements ILogger {
    private readonly outputChannel: vscode.OutputChannel;
    private readonly prefix: string;

    /**
     * Creates an instance of Logger.
     * @param outputChannel The VS Code OutputChannel to write logs to.
     * @param prefix An optional prefix for log messages (defaults to 'ChattyMcChatface').
     */
    constructor(outputChannel: vscode.OutputChannel, prefix: string = 'ChattyMcChatface') {
        this.outputChannel = outputChannel;
        this.prefix = prefix;
    }

    /**
     * Logs an informational message.
     * @param message The message to log.
     */
    public info(message: string): void {
        this.log('INFO', message);
    }

    /**
     * Logs a warning message.
     * @param message The message to log.
     */
    public warn(message: string): void {
        this.log('WARN', message);
    }

    /**
     * Logs an error message.
     * @param message The primary error message.
     * @param error Optional error object or additional details.
     */
    public error(message: string, error?: any): void {
        this.log('ERROR', message);
        if (error) {
            if (error instanceof Error) {
                this.log('ERROR', `Stack: ${error.stack}`);
            } else {
                this.log('ERROR', `Details: ${JSON.stringify(error)}`);
            }
        }
    }

    /**
     * Helper method to format and write the log message.
     * @param level The log level (e.g., 'INFO', 'WARN', 'ERROR').
     * @param message The message content.
     */
    private log(level: string, message: string): void {
        const timestamp = new Date().toISOString();
        this.outputChannel.appendLine(`[${timestamp}] [${this.prefix}] [${level}] ${message}`);
    }
}
