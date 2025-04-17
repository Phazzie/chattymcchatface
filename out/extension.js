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
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const uuid_1 = require("uuid");
const logger_1 = require("./logger");
const webviewProvider_1 = require("./webviewProvider");
const networkManager_1 = require("./network/networkManager");
const udpDiscovery_1 = require("./network/udpDiscovery");
const tcpServer_1 = require("./network/tcpServer");
const tcpClient_1 = require("./network/tcpClient");
const authService_1 = require("./auth/authService");
const authUI_1 = require("./auth/authUI");
const connectionHandlerFactory_1 = require("./network/connectionHandlerFactory");
const codeQuality_1 = require("./codeQuality");
// Global services
let networkManager;
let webviewProvider;
let logger;
// This method is called when your extension is activated
function activate(context) {
    console.log('Activating ChattyMcChatface');
    // Create the logger
    const outputChannel = vscode.window.createOutputChannel('ChattyMcChatface');
    logger = new logger_1.Logger(outputChannel);
    logger.info('Extension activated');
    // Create the webview provider
    webviewProvider = new webviewProvider_1.WebviewProvider(context.extensionUri);
    // Register the webview provider
    const webviewView = vscode.window.registerWebviewViewProvider(webviewProvider_1.WebviewProvider.viewType, webviewProvider);
    context.subscriptions.push(webviewView);
    // Create the auth service
    const authService = new authService_1.AuthService(logger);
    // Create the auth UI (connects to auth service)
    const authUI = new authUI_1.AuthUI(authService);
    // Create the network components
    const instanceId = (0, uuid_1.v4)().substring(0, 8);
    const udpDiscovery = new udpDiscovery_1.UdpDiscovery(logger, instanceId);
    const tcpServer = new tcpServer_1.TcpServer(logger);
    const tcpClient = new tcpClient_1.TcpClient(logger);
    // Create and start the network manager
    networkManager = new networkManager_1.NetworkManager(logger, udpDiscovery, tcpServer, tcpClient, authService, instanceId, connectionHandlerFactory_1.createConnectionHandler // Use our factory function
    );
    // Start network services
    networkManager.start();
    // Set up event handlers for network events
    setupNetworkEvents(networkManager, webviewProvider);
    // Register commands
    registerCommands(context);
    // Register code quality providers
    (0, codeQuality_1.registerCodeQualityProviders)(context);
    // Listen for messages from the webview
    if (webviewProvider) {
        webviewProvider.onDidReceiveMessage(message => {
            if (message.type === 'sendMessage' && networkManager) {
                networkManager.sendMessage(message.text);
            }
        });
    }
}
exports.activate = activate;
function setupNetworkEvents(networkManager, webviewProvider) {
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
function registerCommands(context) {
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
            }
            else {
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
    context.subscriptions.push(helloCommand, openChatCommand, sendMessageCommand, startDiscoveryCommand, stopDiscoveryCommand, clearChatCommand);
}
// This method is called when your extension is deactivated
function deactivate() {
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
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map