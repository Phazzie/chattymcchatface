import * as vscode from 'vscode';
import { ICommandService } from './interfaces/ICommandService';
import { DependencyContainer } from './DependencyContainer';
import { INetworkManager } from '../network/interfaces/INetworkManager';
import { TextMessage } from '../network/messages/TextMessage';

/**
 * Service for registering and executing VS Code commands.
 * Implements the ICommandService interface for SOLID compliance.
 */
export class CommandServiceRefactored implements ICommandService {
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
    private registerHelloWorldCommand(): vscode.Disposable {
        return this.registerCommand('chattymcchatface.helloWorld', () => {
            vscode.window.showInformationMessage('Hello from ChattyMcChatface!');
        });
    }

    /**
     * Registers the open chat command.
     * @returns The command disposable
     */
    private registerOpenChatCommand(): vscode.Disposable {
        return this.registerCommand('chattymcchatface.openChat', () => {
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
    }

    /**
     * Registers the send test message command.
     * @returns The command disposable
     */
    private registerSendTestMessageCommand(): vscode.Disposable {
        return this.registerCommand('chattymcchatface.sendTestMessage', () => {
            const container = DependencyContainer.getInstance();
            const networkManager = container.getService<INetworkManager>('networkManager');
            
            const testMessage = new TextMessage(
                `Test message from ${vscode.env.machineId} at ${new Date().toISOString()}`
            );
            const success = networkManager.sendMessage(testMessage);
            
            if (success) {
                vscode.window.showInformationMessage('Test message sent!');
            } else {
                vscode.window.showErrorMessage(
                    'Failed to send test message - not connected to a peer or not authenticated'
                );
            }
        });
    }

    /**
     * Registers the start discovery command.
     * @returns The command disposable
     */
    private registerStartDiscoveryCommand(): vscode.Disposable {
        return this.registerCommand('chattymcchatface.startDiscovery', () => {
            const container = DependencyContainer.getInstance();
            const networkManager = container.getService<INetworkManager>('networkManager');
            networkManager.start();
            vscode.window.showInformationMessage('Started network discovery and listening');
        });
    }

    /**
     * Registers the stop discovery command.
     * @returns The command disposable
     */
    private registerStopDiscoveryCommand(): vscode.Disposable {
        return this.registerCommand('chattymcchatface.stopDiscovery', () => {
            const container = DependencyContainer.getInstance();
            const networkManager = container.getService<INetworkManager>('networkManager');
            networkManager.stop();
            vscode.window.showInformationMessage('Stopped network discovery and listening');
        });
    }

    /**
     * Registers the clear chat command.
     * @returns The command disposable
     */
    private registerClearChatCommand(): vscode.Disposable {
        return this.registerCommand('chattymcchatface.clearChat', () => {
            const container = DependencyContainer.getInstance();
            const webviewProvider = container.getService('webviewProvider');
            if (webviewProvider) {
                webviewProvider.clearChat();
                vscode.window.showInformationMessage('Chat cleared');
            }
        });
    }
}
