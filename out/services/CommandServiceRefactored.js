"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandServiceRefactored = void 0;
const vscode = __importStar(require("vscode"));
const DependencyContainer_1 = require("./DependencyContainer");
const TextMessage_1 = require("../network/messages/TextMessage");
/**
 * Service for registering and executing VS Code commands.
 * Implements the ICommandService interface for SOLID compliance.
 */
class CommandServiceRefactored {
    /**
     * Creates a new CommandService.
     * @param context The extension context
     */
    constructor(context) {
        this.context = context;
    }
    /**
     * Registers a command with VS Code.
     * @param commandId The ID of the command to register
     * @param callback The function to execute when the command is invoked
     * @returns A disposable that can be used to unregister the command
     */
    registerCommand(commandId, callback) {
        return vscode.commands.registerCommand(commandId, callback);
    }
    /**
     * Executes a command.
     * @param commandId The ID of the command to execute
     * @param args Arguments to pass to the command
     * @returns A promise that resolves with the command's result
     */
    executeCommand(commandId, ...args) {
        return vscode.commands.executeCommand(commandId, ...args);
    }
    /**
     * Registers all commands for the extension.
     * @param context The extension context
     */
    registerAllCommands(context) {
        // Register each command in its own method for better organization
        const commands = [
            this.registerHelloWorldCommand(),
            this.registerOpenChatCommand(),
            this.registerSendTestMessageCommand(),
            this.registerStartDiscoveryCommand(),
            this.registerStopDiscoveryCommand(),
            this.registerClearChatCommand()
        ];
        // Add commands to subscriptions
        commands.forEach(command => context.subscriptions.push(command));
    }
    /**
     * Registers the hello world command.
     * @returns The command disposable
     */
    registerHelloWorldCommand() {
        return this.registerCommand('chattymcchatface.helloWorld', () => {
            vscode.window.showInformationMessage('Hello from ChattyMcChatface!');
        });
    }
    /**
     * Registers the open chat command.
     * @returns The command disposable
     */
    registerOpenChatCommand() {
        return this.registerCommand('chattymcchatface.openChat', () => {
            const container = DependencyContainer_1.DependencyContainer.getInstance();
            const webviewProvider = container.getService('webviewProvider');
            if (webviewProvider) {
                const panel = webviewProvider.createChatPanel();
                // Update connection status on open
                const networkManager = container.getService('networkManager');
                const isConnected = networkManager.isConnected;
                webviewProvider.updateConnectionStatus(isConnected);
            }
        });
    }
    /**
     * Registers the send test message command.
     * @returns The command disposable
     */
    registerSendTestMessageCommand() {
        return this.registerCommand('chattymcchatface.sendTestMessage', () => {
            const container = DependencyContainer_1.DependencyContainer.getInstance();
            const networkManager = container.getService('networkManager');
            const testMessage = new TextMessage_1.TextMessage(`Test message from ${vscode.env.machineId} at ${new Date().toISOString()}`);
            const success = networkManager.sendMessage(testMessage);
            if (success) {
                vscode.window.showInformationMessage('Test message sent!');
            }
            else {
                vscode.window.showErrorMessage('Failed to send test message - not connected to a peer or not authenticated');
            }
        });
    }
    /**
     * Registers the start discovery command.
     * @returns The command disposable
     */
    registerStartDiscoveryCommand() {
        return this.registerCommand('chattymcchatface.startDiscovery', () => {
            const container = DependencyContainer_1.DependencyContainer.getInstance();
            const networkManager = container.getService('networkManager');
            networkManager.start();
            vscode.window.showInformationMessage('Started network discovery and listening');
        });
    }
    /**
     * Registers the stop discovery command.
     * @returns The command disposable
     */
    registerStopDiscoveryCommand() {
        return this.registerCommand('chattymcchatface.stopDiscovery', () => {
            const container = DependencyContainer_1.DependencyContainer.getInstance();
            const networkManager = container.getService('networkManager');
            networkManager.stop();
            vscode.window.showInformationMessage('Stopped network discovery and listening');
        });
    }
    /**
     * Registers the clear chat command.
     * @returns The command disposable
     */
    registerClearChatCommand() {
        return this.registerCommand('chattymcchatface.clearChat', () => {
            const container = DependencyContainer_1.DependencyContainer.getInstance();
            const webviewProvider = container.getService('webviewProvider');
            if (webviewProvider) {
                webviewProvider.clearChat();
                vscode.window.showInformationMessage('Chat cleared');
            }
        });
    }
}
exports.CommandServiceRefactored = CommandServiceRefactored;
//# sourceMappingURL=CommandServiceRefactored.js.map