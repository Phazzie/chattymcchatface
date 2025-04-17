import * as vscode from 'vscode';
import { DependencyContainerUpdated } from './services/DependencyContainerUpdated';
import { INetworkManager } from './network/interfaces/INetworkManager';
import { IWebviewProvider } from './ui/interfaces/IWebviewProvider';
import { ILogger } from './interfaces';
import { IEventHandlingService } from './services/interfaces/IEventHandlingService';
import { registerCodeQualityProviders } from './codeQuality';

/**
 * This method is called when your extension is activated.
 * It initializes all services and sets up event handlers.
 */
export function activate(context: vscode.ExtensionContext) {
	console.log('Activating ChattyMcChatface');

	// Get the dependency container
	const container = DependencyContainerUpdated.getInstance();

	// Initialize all services
	container.initialize(context);

	// Get required services
	const logger = container.getService<ILogger>('logger');
	const networkManager = container.getService<INetworkManager>('networkManager');
	const webviewProvider = container.getService<IWebviewProvider>('webviewProvider');
	const eventHandlingService = container.getService<IEventHandlingService>('eventHandlingService');

	// Log activation
	logger.info('Extension activated');

	// Set up event handlers for network events
	setupNetworkEvents(networkManager, webviewProvider, logger);

	// Register code quality providers
	registerCodeQualityProviders(context);

	// Listen for messages from the webview
	setupWebviewMessageHandling(webviewProvider, networkManager, logger);

	// Start network services
	networkManager.start();
}

/**
 * Sets up event handlers for network events.
 */
function setupNetworkEvents(
	networkManager: INetworkManager,
	webviewProvider: IWebviewProvider,
	logger: ILogger
) {
	networkManager.on('peerDiscovered', (peer) => {
		vscode.window.showInformationMessage(`Discovered peer: ${peer.ip}:${peer.port}`);
		logger.info(`Discovered peer: ${peer.ip}:${peer.port}`);
	});

	networkManager.on('connected', (peer) => {
		vscode.window.showInformationMessage(`Connected to peer: ${peer.ip}:${peer.port}`);
		webviewProvider.updateConnectionStatus(true);
		webviewProvider.sendSystemMessage(`Connected to peer: ${peer.ip}:${peer.port}`);
		logger.info(`Connected to peer: ${peer.ip}:${peer.port}`);
	});

	networkManager.on('authFailed', (reason) => {
		vscode.window.showErrorMessage(`Authentication failed: ${reason}`);
		webviewProvider.sendSystemMessage(`Authentication failed: ${reason}`);
		logger.error(`Authentication failed: ${reason}`);
	});

	networkManager.on('disconnected', (reason) => {
		const message = reason
			? `Disconnected from peer: ${reason}`
			: 'Disconnected from peer';

		vscode.window.showInformationMessage(message);
		webviewProvider.sendSystemMessage(message);
		webviewProvider.updateConnectionStatus(false);
		logger.info(message);
	});

	networkManager.on('messageReceived', (message) => {
		webviewProvider.sendMessage(message);
		logger.info(`Received message: ${JSON.stringify(message)}`);
	});
}

/**
 * Sets up message handling from the webview.
 */
function setupWebviewMessageHandling(
	webviewProvider: IWebviewProvider,
	networkManager: INetworkManager,
	logger: ILogger
) {
	webviewProvider.onDidReceiveMessage(message => {
		if (message.type === 'sendMessage') {
			logger.info(`Sending message: ${message.text}`);
			networkManager.sendMessage(message.text);
		}
	});
}

/**
 * This method is called when your extension is deactivated.
 * It disposes of all services.
 */
export function deactivate() {
	// Get the dependency container
	const container = DependencyContainerUpdated.getInstance();

	try {
		// Get the logger before disposing
		const logger = container.getService<ILogger>('logger');
		logger.info('Extension deactivating...');

		// Get the network manager before disposing
		const networkManager = container.getService<INetworkManager>('networkManager');
		networkManager.stop();

		// Dispose of all services
		container.dispose();

		logger.info('Extension deactivated');
	} catch (error) {
		console.error('Error during deactivation:', error);
	}
}
