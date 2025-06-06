import * as vscode from 'vscode';
import { ILogger } from '../interfaces';
import { Logger } from '../logger';
import { IAuthService } from '../interfaces';
import { AuthService } from '../auth/authService';
import { IAuthUI } from '../interfaces';
import { AuthUI } from '../auth/authUI';
import { IUdpDiscovery } from '../interfaces';
import { UdpDiscovery } from '../network/udpDiscovery';
import { ITcpServer } from '../interfaces';
import { TcpServer } from '../network/tcpServer';
import { ITcpClient } from '../interfaces';
import { TcpClient } from '../network/tcpClient';
import { IMessageHandler } from '../network/interfaces/IMessageHandler';
import { MessageHandler } from '../network/handlers/MessageHandler';
import { IConnectionManager } from '../network/interfaces/IConnectionManager';
import { ConnectionManager } from '../network/ConnectionManager';
import { INetworkManager } from '../network/interfaces/INetworkManager';
import { NetworkManagerRefactored } from '../network/NetworkManagerRefactored';
import { ICommandService } from './interfaces/ICommandService';
import { CommandServiceRefactored } from './CommandServiceRefactored';
import { IEventHandlingService } from './interfaces/IEventHandlingService';
import { EventHandlingService } from './EventHandlingService';
import { IWebviewProvider } from '../ui/interfaces/IWebviewProvider';
import { WebviewProviderImpl } from '../ui/WebviewProviderImpl';
import { IMessageRenderer } from '../ui/interfaces/IMessageRenderer';
import { MessageRenderer } from '../ui/MessageRenderer';
import { IUIStateManager } from '../ui/interfaces/IUIStateManager';
import { UIStateManager } from '../ui/UIStateManager';
import { IUIEventHandler } from '../ui/interfaces/IUIEventHandler';
import { UIEventHandler } from '../ui/UIEventHandler';

// New network interfaces
import { INetworkLifecycleManager } from '../network/interfaces/INetworkLifecycleManager';
import { IConnectionHandlerFactory } from '../network/interfaces/IConnectionHandlerFactory';
import { IActiveConnectionCoordinator } from '../network/interfaces/IActiveConnectionCoordinator';
import { IPeerConnector } from '../network/interfaces/IPeerConnector';
import { IIncomingConnectionAcceptor } from '../network/interfaces/IIncomingConnectionAcceptor';
import { IDiscoveryEvents } from '../network/interfaces/IDiscoveryEvents';

// New network implementations
import { BasicNetworkLifecycleManager } from '../network/lifecycle/BasicNetworkLifecycleManager';
import { ConcreteConnectionHandlerFactory } from '../network/factories/ConcreteConnectionHandlerFactory';
import { TcpPeerConnector } from '../network/connectors/TcpPeerConnector';
import { TcpServerAcceptor } from '../network/acceptors/TcpServerAcceptor';
import { UdpDiscoveryEvents } from '../network/discovery/UdpDiscoveryEvents';
import { AutoConnectDiscoveryCoordinator } from '../network/coordination/AutoConnectDiscoveryCoordinator';
import { IncomingConnectionCoordinator } from '../network/coordination/IncomingConnectionCoordinator';
import { NetworkManagerFacade } from '../network/NetworkManagerFacade';

// New auth interfaces
import { IAuthManager } from '../auth/interfaces/IAuthManager';
import { IAuthProcess } from '../auth/interfaces/IAuthProcess';
import { IAuthProcessFactory } from '../auth/interfaces/IAuthProcessFactory';
import { ITimer } from '../auth/interfaces/ITimer';

// New auth implementations
import { NodeTimer } from '../auth/util/NodeTimer';
import { AuthProcess } from '../auth/AuthProcess';
import { AuthProcessFactory } from '../auth/AuthProcessFactory';
import { AuthManager } from '../auth/AuthManager';

// Message handlers
import { TextMessageHandler } from '../network/handlers/TextMessageHandler';
import { AuthMessageHandler } from '../network/handlers/AuthMessageHandler';
import { SystemMessageHandler } from '../network/handlers/SystemMessageHandler';
import { FileMessageHandlerFacade } from '../network/handlers/FileMessageHandlerFacade';

import { v4 as uuidv4 } from 'uuid';

/**
 * Container for managing dependencies and their lifecycle.
 * Implements the Service Locator pattern.
 */
export class DependencyContainerUpdated {
    private static instance: DependencyContainerUpdated;
    private services: Map<string, any> = new Map();

    /**
     * Gets the singleton instance of the DependencyContainer.
     */
    public static getInstance(): DependencyContainerUpdated {
        if (!DependencyContainerUpdated.instance) {
            DependencyContainerUpdated.instance = new DependencyContainerUpdated();
        }
        return DependencyContainerUpdated.instance;
    }

    /**
     * Private constructor to prevent direct instantiation.
     */
    private constructor() { }

    /**
     * Initializes all services.
     * @param context The extension context
     */
    public initialize(context: vscode.ExtensionContext): void {
        // Create the logger
        const outputChannel = vscode.window.createOutputChannel('ChattyMcChatface');
        const logger = new Logger(outputChannel);
        this.registerService<ILogger>('logger', logger);

        // Create the event handling service
        const eventHandlingService = new EventHandlingService();
        this.registerService<IEventHandlingService>('eventHandlingService', eventHandlingService);

        // Create the timer for auth processes
        const timer = new NodeTimer();
        this.registerService<ITimer>('timer', timer);

        // Create the auth process factory
        const authProcessFactory = new AuthProcessFactory(timer);
        this.registerService<IAuthProcessFactory>('authProcessFactory', authProcessFactory);

        // Create the auth manager
        const authManager = new AuthManager(authProcessFactory, logger);
        this.registerService<IAuthManager>('authManager', authManager);

        // Create the legacy auth service (for backward compatibility)
        const authService = new AuthService(logger);
        this.registerService<IAuthService>('authService', authService);

        // Create the auth UI
        const authUI = new AuthUI(authService);
        this.registerService<IAuthUI>('authUI', authUI);

        // Create the message handler
        const messageHandler = new MessageHandler(logger);
        this.registerService<IMessageHandler>('messageHandler', messageHandler);

        // Create the specialized message handlers
        const textMessageHandler = new TextMessageHandler(logger, messageHandler);
        this.registerService('textMessageHandler', textMessageHandler);

        const authMessageHandler = new AuthMessageHandler(logger, authService, messageHandler);
        this.registerService('authMessageHandler', authMessageHandler);

        const systemMessageHandler = new SystemMessageHandler(logger, messageHandler);
        this.registerService('systemMessageHandler', systemMessageHandler);

        const fileMessageHandler = new FileMessageHandlerFacade(logger, messageHandler);
        this.registerService('fileMessageHandler', fileMessageHandler);

        // Create the network components
        const instanceId = uuidv4().substring(0, 8);
        const udpDiscovery = new UdpDiscovery(logger, instanceId);
        this.registerService<IUdpDiscovery>('udpDiscovery', udpDiscovery);

        const tcpServer = new TcpServer(logger);
        this.registerService<ITcpServer>('tcpServer', tcpServer);

        const tcpClient = new TcpClient(logger);
        this.registerService<ITcpClient>('tcpClient', tcpClient);

        // Create the connection handler factory
        const connectionHandlerFactory = new ConcreteConnectionHandlerFactory();
        this.registerService<IConnectionHandlerFactory>('connectionHandlerFactory', connectionHandlerFactory);

        // Create the network lifecycle manager
        const lifecycleManager = new BasicNetworkLifecycleManager(udpDiscovery, tcpServer, logger);
        this.registerService<INetworkLifecycleManager>('lifecycleManager', lifecycleManager);

        // Create the peer connector
        const peerConnector = new TcpPeerConnector(tcpClient, logger);
        this.registerService<IPeerConnector>('peerConnector', peerConnector);

        // Create the incoming connection acceptor
        const incomingAcceptor = new TcpServerAcceptor(tcpServer, logger);
        this.registerService<IIncomingConnectionAcceptor>('incomingAcceptor', incomingAcceptor);

        // Create the discovery events
        const discoveryEvents = new UdpDiscoveryEvents(udpDiscovery, logger);
        this.registerService<IDiscoveryEvents>('discoveryEvents', discoveryEvents);

        // Create the legacy connection manager (for backward compatibility)
        const connectionManager = new ConnectionManager(logger, authService, messageHandler);
        this.registerService<IConnectionManager>('connectionManager', connectionManager);

        // Create the legacy network manager (for backward compatibility)
        const networkManager = new NetworkManagerRefactored(
            logger,
            udpDiscovery,
            tcpServer,
            tcpClient,
            authService,
            connectionManager,
            instanceId
        );
        this.registerService<INetworkManager>('networkManager', networkManager);

        // Create the command service
        const commandService = new CommandServiceRefactored(context);
        this.registerService<ICommandService>('commandService', commandService);

        // Create the UI components
        const webviewProvider = new WebviewProviderImpl(context.extensionUri, logger);
        this.registerService<IWebviewProvider>('webviewProvider', webviewProvider);

        // Register the webview provider with VS Code
        const webviewView = vscode.window.registerWebviewViewProvider(
            WebviewProviderImpl.viewType,
            webviewProvider
        );
        context.subscriptions.push(webviewView);

        // Create the message renderer
        const messageRenderer = new MessageRenderer(webviewProvider);
        this.registerService<IMessageRenderer>('messageRenderer', messageRenderer);

        // Create the UI state manager
        const uiStateManager = new UIStateManager(webviewProvider);
        this.registerService<IUIStateManager>('uiStateManager', uiStateManager);

        // Create the UI event handler
        const uiEventHandler = new UIEventHandler(webviewProvider, networkManager);
        this.registerService<IUIEventHandler>('uiEventHandler', uiEventHandler);

        // Initialize UI event listeners
        uiEventHandler.initializeEventListeners();

        // Register all commands
        commandService.registerAllCommands(context);
    }

    /**
     * Registers a service with the container.
     * @param key The key to register the service under
     * @param service The service instance
     */
    public registerService<T>(key: string, service: T): void {
        this.services.set(key, service);
    }

    /**
     * Gets a service from the container.
     * @param key The key of the service to get
     * @returns The service instance
     * @throws Error if the service is not registered
     */
    public getService<T>(key: string): T {
        const service = this.services.get(key);
        if (!service) {
            throw new Error(`Service '${key}' not registered`);
        }
        return service as T;
    }

    /**
     * Disposes of all services.
     */
    public dispose(): void {
        for (const [key, service] of this.services.entries()) {
            if (typeof service.dispose === 'function') {
                service.dispose();
            }
        }
        this.services.clear();
    }
}
