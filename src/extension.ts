import * as vscode from 'vscode';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from './logger';
import { WebviewProvider } from './webviewProvider';
import { NetworkManager } from './network/networkManager';
import { UdpDiscovery } from './network/udpDiscovery';
import { TcpServer } from './network/tcpServer';
import { TcpClient } from './network/tcpClient';
import { AuthService } from './auth/authService';
import { AuthUI } from './auth/authUI';
import { createConnectionHandler } from './network/connectionHandlerFactory';
import { registerCodeQualityProviders } from './codeQuality';

// Global services
let networkManager: NetworkManager | undefined;
let webviewProvider: WebviewProvider | undefined;
let logger: Logger | undefined;

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
	console.log('Activating ChattyMcChatface');

	// Create the logger
	const outputChannel = vscode.window.createOutputChannel('ChattyMcChatface');
	logger = new Logger(outputChannel);
	logger.info('Extension activated');

	// Create the webview provider
	webviewProvider = new WebviewProvider(context.extensionUri);

	// Register the webview provider
	const webviewView = vscode.window.registerWebviewViewProvider(
		WebviewProvider.viewType,
		webviewProvider
	);
	context.subscriptions.push(webviewView);

	// Create the auth service
	const authService = new AuthService(logger);

	// Create the auth UI (connects to auth service)
	const authUI = new AuthUI(authService);

	// Create the network components
	const instanceId = uuidv4().substring(0, 8);
	const udpDiscovery = new UdpDiscovery(logger, instanceId);
	const tcpServer = new TcpServer(logger);
	const tcpClient = new TcpClient(logger);

	// Create and start the network manager
	networkManager = new NetworkManager(
		logger,
		udpDiscovery,
		tcpServer,
		tcpClient,
		authService,
		instanceId,
		createConnectionHandler // Use our factory function
	);

	// Start network services
	networkManager.start();

	// Set up event handlers for network events
	setupNetworkEvents(networkManager, webviewProvider);

	// Register commands
	registerCommands(context);

	// Register code quality providers
	registerCodeQualityProviders(context);

	// Listen for messages from the webview
	if (webviewProvider) {
		webviewProvider.onDidReceiveMessage(message => {
			if (message.type === 'sendMessage' && networkManager) {
				networkManager.sendMessage(message.text);
			}
		});
	}
}

function setupNetworkEvents(networkManager: NetworkManager, webviewProvider: WebviewProvider | undefined) {
	networkManager.on('peerDiscovered', (peer) => {
		vscode.window.showInformationMessage(`Discovered peer: ${peer.ip}:${peer.port}`);
	});

	networkManager.on('connected', (peer) => {
		vscode.window.showInformationMessage(`Connected to peer: ${peer.ip}:${peer.port}`);
		if (webviewProvider) {
			webviewProvider.updateConnectionStatus(true);
			webviewProvider.sendSystemMessage(`Connected to peer: ${peer.ip}:${peer.port}`);
		}
	});

	networkManager.on('authFailed', (reason) => {
		vscode.window.showErrorMessage(`Authentication failed: ${reason}`);
		if (webviewProvider) {
			webviewProvider.sendSystemMessage(`Authentication failed: ${reason}`);
		}
	});

	networkManager.on('disconnected', (reason) => {
		const message = reason
			? `Disconnected from peer: ${reason}`
			: 'Disconnected from peer';

		vscode.window.showInformationMessage(message);
		if (webviewProvider) {
			webviewProvider.sendSystemMessage(message);
			webviewProvider.updateConnectionStatus(false);
		}
	});

	networkManager.on('messageReceived', (message) => {
		if (webviewProvider) {
			webviewProvider.sendMessage(message);
		}
	});
}

function registerCommands(context: vscode.ExtensionContext) {
	// Hello world command (for testing)
	let helloCommand = vscode.commands.registerCommand('chattymcchatface.helloWorld', () => {
		vscode.window.showInformationMessage('Hello from ChattyMcChatface!');
	});

	// Open chat panel command
	let openChatCommand = vscode.commands.registerCommand('chattymcchatface.openChat', () => {
		if (webviewProvider) {
			const panel = webviewProvider.createChatPanel();
			// Update connection status on open
			if (networkManager) {
				const isConnected = networkManager['connectionHandler']?.isAuthenticated || false;
				webviewProvider.updateConnectionStatus(isConnected);
			}
		}
	});

	// Send test message command
	let sendMessageCommand = vscode.commands.registerCommand('chattymcchatface.sendTestMessage', () => {
		if (networkManager) {
			const success = networkManager.sendMessage(`Test message from ${vscode.env.machineId} at ${new Date().toISOString()}`);
			if (success) {
				vscode.window.showInformationMessage('Test message sent!');
			} else {
				vscode.window.showErrorMessage('Failed to send test message - not connected to a peer or not authenticated');
			}
		}
	});

	// Start discovery command
	let startDiscoveryCommand = vscode.commands.registerCommand('chattymcchatface.startDiscovery', () => {
		if (networkManager) {
			networkManager.start();
			vscode.window.showInformationMessage('Started network discovery and listening');
		}
	});

	// Stop discovery command
	let stopDiscoveryCommand = vscode.commands.registerCommand('chattymcchatface.stopDiscovery', () => {
		if (networkManager) {
			networkManager.stop();
			vscode.window.showInformationMessage('Stopped network discovery and listening');
		}
	});

	// Clear chat command
	let clearChatCommand = vscode.commands.registerCommand('chattymcchatface.clearChat', () => {
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

// This method is called when your extension is deactivated
export function deactivate() {
	// Stop the network manager if it exists
	if (networkManager) {
		networkManager.stop();
		networkManager = undefined;
	}

	// Dispose of the webview provider
	if (webviewProvider) {
		webviewProvider.dispose();
		webviewProvider = undefined;
	}

	if (logger) {
		logger.info('Extension deactivated');
		logger = undefined;
	}
}