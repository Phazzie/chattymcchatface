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
const DependencyContainer_1 = require("./services/DependencyContainer");
const codeQuality_1 = require("./codeQuality");
/**
 * This method is called when your extension is activated.
 * Implements the Dependency Inversion Principle by using interfaces instead of concrete classes.
 */
function activate(context) {
    console.log('Activating ChattyMcChatface');
    // Initialize the dependency container
    const container = DependencyContainer_1.DependencyContainer.getInstance();
    container.initialize(context);
    // Get services from the container
    const logger = container.getService('logger');
    logger.info('Extension activated');
    // Get the network manager and start it
    const networkManager = container.getService('networkManager');
    networkManager.start();
    // Get UI components
    const webviewProvider = container.getService('webviewProvider');
    const uiEventHandler = container.getService('uiEventHandler');
    const uiStateManager = container.getService('uiStateManager');
    // Set up event handlers for network events
    setupNetworkEvents(networkManager, webviewProvider);
    // Register commands
    const commandService = container.getService('commandService');
    commandService.registerAllCommands(context);
    // Register code quality providers
    (0, codeQuality_1.registerCodeQualityProviders)(context);
}
exports.activate = activate;
/**
 * Sets up event handlers for network events.
 * @param networkManager The network manager
 * @param webviewProvider The webview provider
 */
function setupNetworkEvents(networkManager, webviewProvider) {
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
function deactivate() {
    // Get the dependency container
    const container = DependencyContainer_1.DependencyContainer.getInstance();
    try {
        // Get the logger
        const logger = container.getService('logger');
        logger.info('Extension deactivating');
        // Get the network manager and stop it
        const networkManager = container.getService('networkManager');
        networkManager.stop();
        // Dispose of the webview provider
        const webviewProvider = container.getService('webviewProvider');
        webviewProvider.dispose();
        // Dispose of the container itself
        container.dispose();
        logger.info('Extension deactivated');
    }
    catch (error) {
        console.error('Error during deactivation:', error);
    }
}
exports.deactivate = deactivate;
//# sourceMappingURL=extensionRefactored.js.map