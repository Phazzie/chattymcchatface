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
import { CommandService } from './CommandService';
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
import { v4 as uuidv4 } from 'uuid';

/**
 * Container for managing dependencies and their lifecycle.
 * Implements the Service Locator pattern.
 */
export class DependencyContainer {
    private static instance: DependencyContainer;
    private services: Map<string, any> = new Map();

    /**
     * Gets the singleton instance of the DependencyContainer.
     */
    public static getInstance(): DependencyContainer {
        if (!DependencyContainer.instance) {
            DependencyContainer.instance = new DependencyContainer();
        }
        return DependencyContainer.instance;
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

        // Create the auth service
        const authService = new AuthService(logger);
        this.registerService<IAuthService>('authService', authService);

        // Create the auth UI
        const authUI = new AuthUI(authService);
        this.registerService<IAuthUI>('authUI', authUI);

        // Create the message handler
        const messageHandler = new MessageHandler(logger);
        this.registerService<IMessageHandler>('messageHandler', messageHandler);

        // Create the network components
        const instanceId = uuidv4().substring(0, 8);
        const udpDiscovery = new UdpDiscovery(logger, instanceId);
        this.registerService<IUdpDiscovery>('udpDiscovery', udpDiscovery);

        const tcpServer = new TcpServer(logger);
        this.registerService<ITcpServer>('tcpServer', tcpServer);

        const tcpClient = new TcpClient(logger);
        this.registerService<ITcpClient>('tcpClient', tcpClient);

        // Create the connection manager
        const connectionManager = new ConnectionManager(logger, authService, messageHandler);
        this.registerService<IConnectionManager>('connectionManager', connectionManager);

        // Create the network manager
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
        const commandService = new CommandService(context);
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
