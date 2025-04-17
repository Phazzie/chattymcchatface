import * as vscode from 'vscode';
import { DependencyContainer } from './services/DependencyContainer';
import { INetworkManager } from './network/interfaces/INetworkManager';
import { ICommandService } from './services/interfaces/ICommandService';
import { IEventHandlingService } from './services/interfaces/IEventHandlingService';
import { ILogger } from './interfaces';
import { IWebviewProvider } from './ui/interfaces/IWebviewProvider';
import { IUIEventHandler } from './ui/interfaces/IUIEventHandler';
import { IUIStateManager } from './ui/interfaces/IUIStateManager';
import { registerCodeQualityProviders } from './codeQuality';

/**
 * This method is called when your extension is activated.
 * Implements the Dependency Inversion Principle by using interfaces instead of concrete classes.
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('Activating ChattyMcChatface');

    // Initialize the dependency container
    const container = DependencyContainer.getInstance();
    container.initialize(context);

    // Get services from the container
    const logger = container.getService<ILogger>('logger');
    logger.info('Extension activated');

    // Get the network manager and start it
    const networkManager = container.getService<INetworkManager>('networkManager');
    networkManager.start();

    // Get UI components
    const webviewProvider = container.getService<IWebviewProvider>('webviewProvider');
    const uiEventHandler = container.getService<IUIEventHandler>('uiEventHandler');
    const uiStateManager = container.getService<IUIStateManager>('uiStateManager');

    // Set up event handlers for network events
    setupNetworkEvents(networkManager, webviewProvider);

    // Register commands
    const commandService = container.getService<ICommandService>('commandService');
    commandService.registerAllCommands(context);

    // Register code quality providers
    registerCodeQualityProviders(context);
}

/**
 * Sets up event handlers for network events.
 * @param networkManager The network manager
 * @param webviewProvider The webview provider
 */
function setupNetworkEvents(networkManager: INetworkManager, webviewProvider: IWebviewProvider) {
    networkManager.on('peerDiscovered', (peer) => {
        vscode.window.showInformationMessage(`Discovered peer: ${peer.ip}:${peer.port}`);
    });

    networkManager.on('connected', (peer) => {
        vscode.window.showInformationMessage(`Connected to peer: ${peer.ip}:${peer.port}`);
        webviewProvider.updateConnectionStatus(true);
        webviewProvider.sendSystemMessage(`Connected to peer: ${peer.ip}:${peer.port}`);
    });

    networkManager.on('authFailed', (reason) => {
        vscode.window.showErrorMessage(`Authentication failed: ${reason}`);
        webviewProvider.sendSystemMessage(`Authentication failed: ${reason}`);
    });

    networkManager.on('disconnected', (reason) => {
        const message = reason
            ? `Disconnected from peer: ${reason}`
            : 'Disconnected from peer';

        vscode.window.showInformationMessage(message);
        webviewProvider.sendSystemMessage(message);
        webviewProvider.updateConnectionStatus(false);
    });

    networkManager.on('messageReceived', (connectionId, message) => {
        webviewProvider.sendMessage(message);
    });
}

/**
 * This method is called when your extension is deactivated.
 */
export function deactivate() {
    // Get the dependency container
    const container = DependencyContainer.getInstance();

    try {
        // Get the logger
        const logger = container.getService<ILogger>('logger');
        logger.info('Extension deactivating');

        // Get the network manager and stop it
        const networkManager = container.getService<INetworkManager>('networkManager');
        networkManager.stop();

        // Dispose of the webview provider
        const webviewProvider = container.getService<IWebviewProvider>('webviewProvider');
        webviewProvider.dispose();

        // Dispose of the container itself
        container.dispose();

        logger.info('Extension deactivated');
    } catch (error) {
        console.error('Error during deactivation:', error);
    }
}
