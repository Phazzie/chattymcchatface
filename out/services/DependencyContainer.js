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
exports.DependencyContainer = void 0;
const vscode = __importStar(require("vscode"));
const logger_1 = require("../logger");
const authService_1 = require("../auth/authService");
const authUI_1 = require("../auth/authUI");
const udpDiscovery_1 = require("../network/udpDiscovery");
const tcpServer_1 = require("../network/tcpServer");
const tcpClient_1 = require("../network/tcpClient");
const MessageHandler_1 = require("../network/handlers/MessageHandler");
const ConnectionManager_1 = require("../network/ConnectionManager");
const NetworkManagerRefactored_1 = require("../network/NetworkManagerRefactored");
const CommandService_1 = require("./CommandService");
const EventHandlingService_1 = require("./EventHandlingService");
const WebviewProviderImpl_1 = require("../ui/WebviewProviderImpl");
const MessageRenderer_1 = require("../ui/MessageRenderer");
const UIStateManager_1 = require("../ui/UIStateManager");
const UIEventHandler_1 = require("../ui/UIEventHandler");
// New network implementations
const BasicNetworkLifecycleManager_1 = require("../network/lifecycle/BasicNetworkLifecycleManager");
const ConcreteConnectionHandlerFactory_1 = require("../network/factories/ConcreteConnectionHandlerFactory");
const TcpPeerConnector_1 = require("../network/connectors/TcpPeerConnector");
const TcpServerAcceptor_1 = require("../network/acceptors/TcpServerAcceptor");
const UdpDiscoveryEvents_1 = require("../network/discovery/UdpDiscoveryEvents");
// New auth implementations
const NodeTimer_1 = require("../auth/util/NodeTimer");
const AuthProcessFactory_1 = require("../auth/AuthProcessFactory");
const AuthManager_1 = require("../auth/AuthManager");
const uuid_1 = require("uuid");
/**
 * Container for managing dependencies and their lifecycle.
 * Implements the Service Locator pattern.
 */
class DependencyContainer {
    /**
     * Gets the singleton instance of the DependencyContainer.
     */
    static getInstance() {
        if (!DependencyContainer.instance) {
            DependencyContainer.instance = new DependencyContainer();
        }
        return DependencyContainer.instance;
    }
    /**
     * Private constructor to prevent direct instantiation.
     */
    constructor() {
        this.services = new Map();
    }
    /**
     * Initializes all services.
     * @param context The extension context
     */
    initialize(context) {
        // Create the logger
        const outputChannel = vscode.window.createOutputChannel('ChattyMcChatface');
        const logger = new logger_1.Logger(outputChannel);
        this.registerService('logger', logger);
        // Create the event handling service
        const eventHandlingService = new EventHandlingService_1.EventHandlingService();
        this.registerService('eventHandlingService', eventHandlingService);
        // Create the timer for auth processes
        const timer = new NodeTimer_1.NodeTimer();
        this.registerService('timer', timer);
        // Create the auth process factory
        const authProcessFactory = new AuthProcessFactory_1.AuthProcessFactory(timer);
        this.registerService('authProcessFactory', authProcessFactory);
        // Create the auth manager
        const authManager = new AuthManager_1.AuthManager(authProcessFactory, logger);
        this.registerService('authManager', authManager);
        // Create the legacy auth service (for backward compatibility)
        const authService = new authService_1.AuthService(logger);
        this.registerService('authService', authService);
        // Create the auth UI
        const authUI = new authUI_1.AuthUI(authService);
        this.registerService('authUI', authUI);
        // Create the message handler
        const messageHandler = new MessageHandler_1.MessageHandler(logger);
        this.registerService('messageHandler', messageHandler);
        // Create the network components
        const instanceId = (0, uuid_1.v4)().substring(0, 8);
        const udpDiscovery = new udpDiscovery_1.UdpDiscovery(logger, instanceId);
        this.registerService('udpDiscovery', udpDiscovery);
        const tcpServer = new tcpServer_1.TcpServer(logger);
        this.registerService('tcpServer', tcpServer);
        const tcpClient = new tcpClient_1.TcpClient(logger);
        this.registerService('tcpClient', tcpClient);
        // Create the connection handler factory
        const connectionHandlerFactory = new ConcreteConnectionHandlerFactory_1.ConcreteConnectionHandlerFactory();
        this.registerService('connectionHandlerFactory', connectionHandlerFactory);
        // Create the network lifecycle manager
        const lifecycleManager = new BasicNetworkLifecycleManager_1.BasicNetworkLifecycleManager(udpDiscovery, tcpServer, logger);
        this.registerService('lifecycleManager', lifecycleManager);
        // Create the peer connector
        const peerConnector = new TcpPeerConnector_1.TcpPeerConnector(tcpClient, logger);
        this.registerService('peerConnector', peerConnector);
        // Create the incoming connection acceptor
        const incomingAcceptor = new TcpServerAcceptor_1.TcpServerAcceptor(tcpServer, logger);
        this.registerService('incomingAcceptor', incomingAcceptor);
        // Create the discovery events
        const discoveryEvents = new UdpDiscoveryEvents_1.UdpDiscoveryEvents(udpDiscovery, logger);
        this.registerService('discoveryEvents', discoveryEvents);
        // Create the legacy connection manager (for backward compatibility)
        const connectionManager = new ConnectionManager_1.ConnectionManager(logger, authService, messageHandler);
        this.registerService('connectionManager', connectionManager);
        // Create the legacy network manager (for backward compatibility)
        const networkManager = new NetworkManagerRefactored_1.NetworkManagerRefactored(logger, udpDiscovery, tcpServer, tcpClient, authService, connectionManager, instanceId);
        this.registerService('networkManager', networkManager);
        // Create the command service
        const commandService = new CommandService_1.CommandService(context);
        this.registerService('commandService', commandService);
        // Create the UI components
        const webviewProvider = new WebviewProviderImpl_1.WebviewProviderImpl(context.extensionUri, logger);
        this.registerService('webviewProvider', webviewProvider);
        // Register the webview provider with VS Code
        const webviewView = vscode.window.registerWebviewViewProvider(WebviewProviderImpl_1.WebviewProviderImpl.viewType, webviewProvider);
        context.subscriptions.push(webviewView);
        // Create the message renderer
        const messageRenderer = new MessageRenderer_1.MessageRenderer(webviewProvider);
        this.registerService('messageRenderer', messageRenderer);
        // Create the UI state manager
        const uiStateManager = new UIStateManager_1.UIStateManager(webviewProvider);
        this.registerService('uiStateManager', uiStateManager);
        // Create the UI event handler
        const uiEventHandler = new UIEventHandler_1.UIEventHandler(webviewProvider, networkManager);
        this.registerService('uiEventHandler', uiEventHandler);
        // Initialize UI event listeners
        uiEventHandler.initializeEventListeners();
    }
    /**
     * Registers a service with the container.
     * @param key The key to register the service under
     * @param service The service instance
     */
    registerService(key, service) {
        this.services.set(key, service);
    }
    /**
     * Gets a service from the container.
     * @param key The key of the service to get
     * @returns The service instance
     * @throws Error if the service is not registered
     */
    getService(key) {
        const service = this.services.get(key);
        if (!service) {
            throw new Error(`Service '${key}' not registered`);
        }
        return service;
    }
    /**
     * Disposes of all services.
     */
    dispose() {
        for (const [key, service] of this.services.entries()) {
            if (typeof service.dispose === 'function') {
                service.dispose();
            }
        }
        this.services.clear();
    }
}
exports.DependencyContainer = DependencyContainer;
//# sourceMappingURL=DependencyContainer.js.map