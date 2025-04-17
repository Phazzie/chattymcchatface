import { mock, instance, verify, when, anything, reset, capture } from 'ts-mockito';
import { EventEmitter } from 'events';
import * as net from 'net';
import { NetworkManager } from './networkManager';
import {
    ILogger,
    IUdpDiscovery,
    ITcpServer,
    ITcpClient,
    IAuthService,
    IConnectionHandler,
    INetworkManager,
    DiscoveredPeer
} from '../interfaces';

// Mock dependencies
class MockEventEmitter extends EventEmitter {
    start = jest.fn();
    stop = jest.fn();
    connect = jest.fn();
    disconnect = jest.fn();
    sendMessage = jest.fn();
    handleMessage = jest.fn();
    startAuthentication = jest.fn();
    isAuthenticated = jest.fn();
    close = jest.fn();
    // Add other common methods
}

describe('NetworkManager', () => {
    let networkManager: INetworkManager;
    let mockLogger: ILogger;
    let mockUdpDiscovery: IUdpDiscovery;
    let mockTcpServer: ITcpServer;
    let mockTcpClient: ITcpClient;
    let mockAuthService: IAuthService;
    let mockConnectionHandler: IConnectionHandler;
    let mockSocket: net.Socket;

    const instanceId = 'test-instance-id';
    const testPeer: DiscoveredPeer = {
        ip: '192.168.1.100',
        port: 12345,
        instanceId: 'peer-123'
    };
    const connectionId = 'conn-123';

    beforeEach(() => {
        // Create mocks
        mockLogger = mock<ILogger>();
        mockUdpDiscovery = new MockEventEmitter() as unknown as IUdpDiscovery;
        mockTcpServer = new MockEventEmitter() as unknown as ITcpServer;
        mockTcpClient = new MockEventEmitter() as unknown as ITcpClient;
        mockAuthService = new MockEventEmitter() as unknown as IAuthService;
        mockConnectionHandler = new MockEventEmitter() as unknown as IConnectionHandler;
        mockSocket = mock<net.Socket>();

        // Configure mocks
        when(mockConnectionHandler.id).thenReturn(connectionId);
        when(mockConnectionHandler.isAuthenticated).thenReturn(false);
        when(mockConnectionHandler.remoteAddress).thenReturn('192.168.1.100');

        // Create NetworkManager with mocked dependencies
        const networkManagerFactory = (createHandler?: boolean) => {
            const manager = new NetworkManager(
                instance(mockLogger),
                mockUdpDiscovery,
                mockTcpServer,
                mockTcpClient,
                mockAuthService,
                instanceId
            );

            // If requested, create a test connection
            if (createHandler) {
                // @ts-ignore - Directly set private member for testing
                manager['connectionHandler'] = mockConnectionHandler;
            }

            return manager;
        };

        networkManager = networkManagerFactory();

        // Reset mocks
        jest.clearAllMocks();
        reset(mockLogger);
        reset(mockSocket);
    });

    test('start should initialize both discovery and TCP server', () => {
        // Act
        networkManager.start();

        // Assert
        expect(mockUdpDiscovery.start).toHaveBeenCalledTimes(1);
        expect(mockTcpServer.start).toHaveBeenCalledTimes(1);
        verify(mockLogger.info('[NetworkManager] Started network services')).once();
    });

    test('stop should stop all services and clean up connections', () => {
        // Arrange - Create a manager with an active connection
        const managerWithConnection = new NetworkManager(
            instance(mockLogger),
            mockUdpDiscovery,
            mockTcpServer,
            mockTcpClient,
            mockAuthService,
            instanceId
        );
        // @ts-ignore - Directly set private member for testing
        managerWithConnection['connectionHandler'] = mockConnectionHandler;

        // Act
        managerWithConnection.stop();

        // Assert
        expect(mockUdpDiscovery.stop).toHaveBeenCalledTimes(1);
        expect(mockTcpServer.stop).toHaveBeenCalledTimes(1);
        expect(mockConnectionHandler.close).toHaveBeenCalledTimes(1);
        verify(mockLogger.info('[NetworkManager] Stopped network services')).once();
    });

    test('should handle peer discovery event', (done) => {
        // Set up event handler
        networkManager.on('peerDiscovered', (peer) => {
            expect(peer).toEqual(testPeer);
            done();
        });

        // Act - Simulate peerDiscovered event from UDP discovery
        mockUdpDiscovery.emit('peerDiscovered', testPeer);
    });

    test('should handle incoming connection from TCP server', () => {
        // Create factory function for ConnectionHandler
        const mockConnectionHandlerFactory = jest.fn(() => mockConnectionHandler);

        // Create manager that uses our factory
        const manager = new NetworkManager(
            instance(mockLogger),
            mockUdpDiscovery,
            mockTcpServer,
            mockTcpClient,
            mockAuthService,
            instanceId,
            mockConnectionHandlerFactory
        );

        // Act - Simulate incoming connection
        mockTcpServer.emit('incomingConnection', instance(mockSocket));

        // Assert
        expect(mockConnectionHandlerFactory).toHaveBeenCalledWith(
            instance(mockSocket),
            instance(mockLogger),
            mockAuthService,
            false
        );
        expect(mockConnectionHandler.startAuthentication).toHaveBeenCalledWith(false);
    });

    test('should handle successful client connection', () => {
        // Create factory function for ConnectionHandler
        const mockConnectionHandlerFactory = jest.fn(() => mockConnectionHandler);

        // Create manager that uses our factory
        const manager = new NetworkManager(
            instance(mockLogger),
            mockUdpDiscovery,
            mockTcpServer,
            mockTcpClient,
            mockAuthService,
            instanceId,
            mockConnectionHandlerFactory
        );

        // Act - Simulate successful connection from client to peer
        mockTcpClient.emit('connectionEstablished', instance(mockSocket), testPeer);

        // Assert
        expect(mockConnectionHandlerFactory).toHaveBeenCalledWith(
            instance(mockSocket),
            instance(mockLogger),
            mockAuthService,
            true
        );
        expect(mockConnectionHandler.startAuthentication).toHaveBeenCalledWith(true);
    });

    test('should handle connection authentication success', (done) => {
        // Arrange - Create manager with mock connection
        const manager = new NetworkManager(
            instance(mockLogger),
            mockUdpDiscovery,
            mockTcpServer,
            mockTcpClient,
            mockAuthService,
            instanceId
        );
        // @ts-ignore - Set private members for testing
        manager['connectionHandler'] = mockConnectionHandler;
        manager['connectedPeer'] = testPeer;

        // Set up event handler
        manager.on('connected', (peer) => {
            expect(peer).toEqual(testPeer);
            done();
        });

        // Act - Simulate authentication success
        mockConnectionHandler.emit('authenticated', connectionId);
    });

    test('should handle connection authentication failure', (done) => {
        // Arrange - Create manager with mock connection
        const manager = new NetworkManager(
            instance(mockLogger),
            mockUdpDiscovery,
            mockTcpServer,
            mockTcpClient,
            mockAuthService,
            instanceId
        );
        // @ts-ignore - Set private members for testing
        manager['connectionHandler'] = mockConnectionHandler;
        manager['connectedPeer'] = testPeer;

        const failReason = 'Authentication failed: Invalid credentials';

        // Set up event handler
        manager.on('authFailed', (reason) => {
            expect(reason).toBe(failReason);
            // @ts-ignore - Verify connection was cleaned up
            expect(manager['connectionHandler']).toBeNull();
            // @ts-ignore - Verify peer was cleaned up
            expect(manager['connectedPeer']).toBeNull();
            done();
        });

        // Act - Simulate authentication failure
        mockConnectionHandler.emit('authFailed', connectionId, failReason);
    });

    test('should handle connection disconnection', (done) => {
        // Arrange - Create manager with mock connection
        const manager = new NetworkManager(
            instance(mockLogger),
            mockUdpDiscovery,
            mockTcpServer,
            mockTcpClient,
            mockAuthService,
            instanceId
        );
        // @ts-ignore - Set private members for testing
        manager['connectionHandler'] = mockConnectionHandler;
        manager['connectedPeer'] = testPeer;

        // Set up event handler
        manager.on('disconnected', () => {
            // @ts-ignore - Verify connection was cleaned up
            expect(manager['connectionHandler']).toBeNull();
            // @ts-ignore - Verify peer was cleaned up
            expect(manager['connectedPeer']).toBeNull();
            done();
        });

        // Act - Simulate disconnection
        mockConnectionHandler.emit('disconnected', connectionId, false);
    });

    test('sendMessage should forward message to connection handler if authenticated', () => {
        // Arrange - Create manager with authenticated connection
        const manager = new NetworkManager(
            instance(mockLogger),
            mockUdpDiscovery,
            mockTcpServer,
            mockTcpClient,
            mockAuthService,
            instanceId
        );
        when(mockConnectionHandler.isAuthenticated).thenReturn(true);
        when(mockConnectionHandler.sendMessage(anything())).thenReturn(true);
        // @ts-ignore - Set private members for testing
        manager['connectionHandler'] = mockConnectionHandler;

        const testMessage = 'Test message';

        // Act
        const result = manager.sendMessage(testMessage);

        // Assert
        expect(result).toBe(true);
        verify(mockConnectionHandler.sendMessage(testMessage)).once();
    });

    test('sendMessage should return false if no connection or not authenticated', () => {
        // Act
        const result = networkManager.sendMessage('Test message');

        // Assert
        expect(result).toBe(false);
        verify(mockLogger.warn('[NetworkManager] Cannot send message: Not connected or not authenticated')).once();
    });

    test('should handle message received from connection', (done) => {
        // Arrange - Create manager with mock connection
        const manager = new NetworkManager(
            instance(mockLogger),
            mockUdpDiscovery,
            mockTcpServer,
            mockTcpClient,
            mockAuthService,
            instanceId
        );
        // @ts-ignore - Set private members for testing
        manager['connectionHandler'] = mockConnectionHandler;

        const testMessage = { type: 'TEST', content: 'Hello world' };

        // Set up event handler
        manager.on('messageReceived', (message) => {
            expect(message).toEqual(testMessage);
            done();
        });

        // Act - Simulate message received
        mockConnectionHandler.emit('messageReceived', connectionId, testMessage);
    });
});