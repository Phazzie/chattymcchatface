import * as vscode from 'vscode';
import { ICommandService } from './interfaces/ICommandService';
import { DependencyContainer } from './DependencyContainer';
import { INetworkManager } from '../network/interfaces/INetworkManager';
import { TextMessage } from '../network/messages/TextMessage';

/**
 * Service for registering and executing VS Code commands.
 * Implements the ICommandService interface for SOLID compliance.
 */
export class CommandService implements ICommandService {
    private readonly context: vscode.ExtensionContext;
    
    /**
     * Creates a new CommandService.
     * @param context The extension context
     */
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }
    
    /**
     * Registers a command with VS Code.
     * @param commandId The ID of the command to register
     * @param callback The function to execute when the command is invoked
     * @returns A disposable that can be used to unregister the command
     */
    public registerCommand(commandId: string, callback: (...args: any[]) => any): vscode.Disposable {
        return vscode.commands.registerCommand(commandId, callback);
    }
    
    /**
     * Executes a command.
     * @param commandId The ID of the command to execute
     * @param args Arguments to pass to the command
     * @returns A promise that resolves with the command's result
     */
    public executeCommand<T>(commandId: string, ...args: any[]): Thenable<T | undefined> {
        return vscode.commands.executeCommand(commandId, ...args);
    }
    
    /**
     * Registers all commands for the extension.
     * @param context The extension context
     */
    public registerAllCommands(context: vscode.ExtensionContext): void {
        // Hello world command (for testing)
        const helloCommand = this.registerCommand('chattymcchatface.helloWorld', () => {
            vscode.window.showInformationMessage('Hello from ChattyMcChatface!');
        });
        
        // Open chat panel command
        const openChatCommand = this.registerCommand('chattymcchatface.openChat', () => {
            const container = DependencyContainer.getInstance();
            const webviewProvider = container.getService('webviewProvider');
            if (webviewProvider) {
                const panel = webviewProvider.createChatPanel();
                // Update connection status on open
                const networkManager = container.getService<INetworkManager>('networkManager');
                const isConnected = networkManager.isConnected;
                webviewProvider.updateConnectionStatus(isConnected);
            }
        });
        
        // Send test message command
        const sendMessageCommand = this.registerCommand('chattymcchatface.sendTestMessage', () => {
            const container = DependencyContainer.getInstance();
            const networkManager = container.getService<INetworkManager>('networkManager');
            
            const testMessage = new TextMessage(`Test message from ${vscode.env.machineId} at ${new Date().toISOString()}`);
            const success = networkManager.sendMessage(testMessage);
            
            if (success) {
                vscode.window.showInformationMessage('Test message sent!');
            } else {
                vscode.window.showErrorMessage('Failed to send test message - not connected to a peer or not authenticated');
            }
        });
        
        // Start discovery command
        const startDiscoveryCommand = this.registerCommand('chattymcchatface.startDiscovery', () => {
            const container = DependencyContainer.getInstance();
            const networkManager = container.getService<INetworkManager>('networkManager');
            networkManager.start();
            vscode.window.showInformationMessage('Started network discovery and listening');
        });
        
        // Stop discovery command
        const stopDiscoveryCommand = this.registerCommand('chattymcchatface.stopDiscovery', () => {
            const container = DependencyContainer.getInstance();
            const networkManager = container.getService<INetworkManager>('networkManager');
            networkManager.stop();
            vscode.window.showInformationMessage('Stopped network discovery and listening');
        });
        
        // Clear chat command
        const clearChatCommand = this.registerCommand('chattymcchatface.clearChat', () => {
            const container = DependencyContainer.getInstance();
            const webviewProvider = container.getService('webviewProvider');
            if (webviewProvider) {
                webviewProvider.clearChat();
                vscode.window.showInformationMessage('Chat cleared');
            }
        });
        
        // Add commands to subscriptions
        context.subscriptions.push(
            helloCommand,
            openChatCommand,
            sendMessageCommand,
            startDiscoveryCommand,
            stopDiscoveryCommand,
            clearChatCommand
        );
    }
}
