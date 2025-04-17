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
exports.CommandService = void 0;
const vscode = __importStar(require("vscode"));
const DependencyContainer_1 = require("./DependencyContainer");
const TextMessage_1 = require("../network/messages/TextMessage");
/**
 * Service for registering and executing VS Code commands.
 * Implements the ICommandService interface for SOLID compliance.
 */
class CommandService {
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
        // Hello world command (for testing)
        const helloCommand = this.registerCommand('chattymcchatface.helloWorld', () => {
            vscode.window.showInformationMessage('Hello from ChattyMcChatface!');
        });
        // Open chat panel command
        const openChatCommand = this.registerCommand('chattymcchatface.openChat', () => {
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
        // Send test message command
        const sendMessageCommand = this.registerCommand('chattymcchatface.sendTestMessage', () => {
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
        // Start discovery command
        const startDiscoveryCommand = this.registerCommand('chattymcchatface.startDiscovery', () => {
            const container = DependencyContainer_1.DependencyContainer.getInstance();
            const networkManager = container.getService('networkManager');
            networkManager.start();
            vscode.window.showInformationMessage('Started network discovery and listening');
        });
        // Stop discovery command
        const stopDiscoveryCommand = this.registerCommand('chattymcchatface.stopDiscovery', () => {
            const container = DependencyContainer_1.DependencyContainer.getInstance();
            const networkManager = container.getService('networkManager');
            networkManager.stop();
            vscode.window.showInformationMessage('Stopped network discovery and listening');
        });
        // Clear chat command
        const clearChatCommand = this.registerCommand('chattymcchatface.clearChat', () => {
            const container = DependencyContainer_1.DependencyContainer.getInstance();
            const webviewProvider = container.getService('webviewProvider');
            if (webviewProvider) {
                webviewProvider.clearChat();
                vscode.window.showInformationMessage('Chat cleared');
            }
        });
        // Add commands to subscriptions
        context.subscriptions.push(helloCommand, openChatCommand, sendMessageCommand, startDiscoveryCommand, stopDiscoveryCommand, clearChatCommand);
    }
}
exports.CommandService = CommandService;
//# sourceMappingURL=CommandService.js.map