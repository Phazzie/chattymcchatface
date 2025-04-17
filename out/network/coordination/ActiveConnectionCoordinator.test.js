"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const ActiveConnectionCoordinator_1 = require("./ActiveConnectionCoordinator");
describe('ActiveConnectionCoordinator', () => {
    // Mock dependencies
    let mockConnectionHandlerFactory;
    let mockLogger;
    let mockAuthService;
    let mockConnectionHandler;
    let mockSocket;
    // Test data
    const testPeer = {
        instanceId: 'test-instance-id',
        ip: '127.0.0.1',
        port: 12345,
        name: 'Test Peer'
    };
    // System under test
    let coordinator;
    beforeEach(() => {
        // Create mocks
        mockConnectionHandler = new events_1.EventEmitter();
        mockConnectionHandler.isAuthenticated = false;
        mockConnectionHandler.sendMessage = jest.fn().mockReturnValue(true);
        mockConnectionHandler.disconnect = jest.fn();
        mockConnectionHandlerFactory = {
            create: jest.fn().mockReturnValue(mockConnectionHandler)
        };
        mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn()
        };
        mockAuthService = new events_1.EventEmitter();
        mockAuthService.startAuthentication = jest.fn();
        mockSocket = new events_1.EventEmitter();
        mockSocket.remoteAddress = '127.0.0.1';
        mockSocket.remotePort = 12345;
        mockSocket.destroy = jest.fn();
        // Create system under test
        coordinator = new ActiveConnectionCoordinator_1.ActiveConnectionCoordinator(mockConnectionHandlerFactory, mockAuthService, mockLogger);
    });
    describe('initiateConnection', () => {
        it('should do nothing if already connected', () => {
            // Arrange
            jest.spyOn(coordinator, 'isConnected').mockReturnValue(true);
            // Act
            coordinator.initiateConnection(testPeer);
            // Assert
            expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('already connected'));
        });
        it('should do nothing if already connecting', () => {
            // Arrange
            jest.spyOn(coordinator, 'isConnected').mockReturnValue(false);
            coordinator['isConnecting'] = true;
            // Act
            coordinator.initiateConnection(testPeer);
            // Assert
            expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('already in progress'));
        });
        it('should emit a connectRequest event', () => {
            // Arrange
            const spy = jest.fn();
            coordinator.on('connectRequest', spy);
            // Act
            coordinator.initiateConnection(testPeer);
            // Assert
            expect(spy).toHaveBeenCalledWith(testPeer);
            expect(coordinator['isConnecting']).toBe(true);
            expect(coordinator['pendingPeer']).toBe(testPeer);
        });
    });
    describe('registerOutgoingConnection', () => {
        it('should do nothing if not connecting', () => {
            // Act
            coordinator.registerOutgoingConnection(mockSocket, testPeer);
            // Assert
            expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('not expecting'));
            expect(mockConnectionHandlerFactory.create).not.toHaveBeenCalled();
        });
        it('should do nothing if peer does not match pending peer', () => {
            // Arrange
            coordinator['isConnecting'] = true;
            coordinator['pendingPeer'] = { ...testPeer, instanceId: 'different-id' };
            // Act
            coordinator.registerOutgoingConnection(mockSocket, testPeer);
            // Assert
            expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('does not match'));
            expect(mockConnectionHandlerFactory.create).not.toHaveBeenCalled();
        });
        it('should create a connection handler and start authentication', () => {
            // Arrange
            coordinator['isConnecting'] = true;
            coordinator['pendingPeer'] = testPeer;
            // Act
            coordinator.registerOutgoingConnection(mockSocket, testPeer);
            // Assert
            expect(mockConnectionHandlerFactory.create).toHaveBeenCalledWith(mockSocket, mockLogger, mockAuthService, true // isInitiator
            );
            expect(coordinator['activeHandler']).toBe(mockConnectionHandler);
            expect(coordinator['connectedPeer']).toBe(testPeer);
            expect(coordinator['isConnecting']).toBe(false);
            expect(coordinator['pendingPeer']).toBeNull();
            // Should set up event handlers
            expect(mockConnectionHandler.on).toHaveBeenCalledWith('message', expect.any(Function));
            expect(mockConnectionHandler.on).toHaveBeenCalledWith('disconnected', expect.any(Function));
            expect(mockConnectionHandler.on).toHaveBeenCalledWith('error', expect.any(Function));
        });
    });
    describe('registerIncomingConnection', () => {
        it('should reject connection if already connected', () => {
            // Arrange
            jest.spyOn(coordinator, 'isConnected').mockReturnValue(true);
            // Act
            coordinator.registerIncomingConnection(mockSocket);
            // Assert
            expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Rejecting incoming'));
            expect(mockSocket.destroy).toHaveBeenCalled();
        });
        it('should reject connection if already connecting', () => {
            // Arrange
            coordinator['isConnecting'] = true;
            // Act
            coordinator.registerIncomingConnection(mockSocket);
            // Assert
            expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Rejecting incoming'));
            expect(mockSocket.destroy).toHaveBeenCalled();
        });
        it('should create a connection handler and start authentication', () => {
            // Act
            coordinator.registerIncomingConnection(mockSocket);
            // Assert
            expect(mockConnectionHandlerFactory.create).toHaveBeenCalledWith(mockSocket, mockLogger, mockAuthService, false // isInitiator
            );
            expect(coordinator['activeHandler']).toBe(mockConnectionHandler);
            // Should set up event handlers
            expect(mockConnectionHandler.on).toHaveBeenCalledWith('message', expect.any(Function));
            expect(mockConnectionHandler.on).toHaveBeenCalledWith('disconnected', expect.any(Function));
            expect(mockConnectionHandler.on).toHaveBeenCalledWith('error', expect.any(Function));
        });
    });
    describe('handleConnectionFailure', () => {
        it('should do nothing if not connecting', () => {
            // Act
            coordinator.handleConnectionFailure(testPeer, new Error('Test error'));
            // Assert
            expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('not expecting'));
        });
        it('should do nothing if peer does not match pending peer', () => {
            // Arrange
            coordinator['isConnecting'] = true;
            coordinator['pendingPeer'] = { ...testPeer, instanceId: 'different-id' };
            // Act
            coordinator.handleConnectionFailure(testPeer, new Error('Test error'));
            // Assert
            expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('does not match'));
        });
        it('should reset connection state and emit failure', () => {
            // Arrange
            const spy = jest.fn();
            coordinator.on('connectionFailed', spy);
            coordinator['isConnecting'] = true;
            coordinator['pendingPeer'] = testPeer;
            // Act
            const error = new Error('Test error');
            coordinator.handleConnectionFailure(testPeer, error);
            // Assert
            expect(coordinator['isConnecting']).toBe(false);
            expect(coordinator['pendingPeer']).toBeNull();
            expect(spy).toHaveBeenCalledWith(testPeer, error);
        });
    });
    describe('disconnect', () => {
        it('should do nothing if not connected', () => {
            // Act
            coordinator.disconnect();
            // Assert
            expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('No active connection'));
        });
        it('should disconnect the active handler and clean up', () => {
            // Arrange
            coordinator['activeHandler'] = mockConnectionHandler;
            coordinator['connectedPeer'] = testPeer;
            // Act
            coordinator.disconnect('Test reason');
            // Assert
            expect(mockConnectionHandler.disconnect).toHaveBeenCalledWith('Test reason');
            expect(coordinator['activeHandler']).toBeNull();
            expect(coordinator['connectedPeer']).toBeNull();
        });
    });
    describe('event handling', () => {
        beforeEach(() => {
            // Set up a connected state
            coordinator['activeHandler'] = mockConnectionHandler;
            coordinator['connectedPeer'] = testPeer;
        });
        it('should forward authenticated event and emit connected', () => {
            // Arrange
            const spy = jest.fn();
            coordinator.on('connected', spy);
            // Act - simulate authentication success
            mockConnectionHandler.isAuthenticated = true;
            mockConnectionHandler.emit('authenticated');
            // Assert
            expect(spy).toHaveBeenCalledWith(testPeer);
        });
        it('should handle disconnected event and clean up', () => {
            // Arrange
            const spy = jest.fn();
            coordinator.on('disconnected', spy);
            // Act - simulate disconnection
            mockConnectionHandler.emit('disconnected', 'Test reason');
            // Assert
            expect(spy).toHaveBeenCalledWith('Test reason');
            expect(coordinator['activeHandler']).toBeNull();
            expect(coordinator['connectedPeer']).toBeNull();
        });
        it('should forward message events', () => {
            // Arrange
            const spy = jest.fn();
            coordinator.on('messageReceived', spy);
            // Act - simulate message
            const testMessage = { type: 'TEST', payload: 'data' };
            mockConnectionHandler.emit('message', testMessage);
            // Assert
            expect(spy).toHaveBeenCalledWith(testMessage);
        });
        it('should handle error events and disconnect', () => {
            // Arrange
            const spy = jest.fn();
            coordinator.on('disconnected', spy);
            // Act - simulate error
            mockConnectionHandler.emit('error', new Error('Test error'));
            // Assert
            expect(mockConnectionHandler.disconnect).toHaveBeenCalled();
            expect(spy).toHaveBeenCalledWith(expect.stringContaining('error'));
            expect(coordinator['activeHandler']).toBeNull();
            expect(coordinator['connectedPeer']).toBeNull();
        });
    });
    describe('getters', () => {
        it('getActiveHandler should return the active handler', () => {
            // Arrange
            coordinator['activeHandler'] = mockConnectionHandler;
            // Act & Assert
            expect(coordinator.getActiveHandler()).toBe(mockConnectionHandler);
        });
        it('getConnectedPeer should return the connected peer', () => {
            // Arrange
            coordinator['connectedPeer'] = testPeer;
            // Act & Assert
            expect(coordinator.getConnectedPeer()).toBe(testPeer);
        });
        it('isConnected should return true when authenticated', () => {
            // Arrange
            coordinator['activeHandler'] = mockConnectionHandler;
            mockConnectionHandler.isAuthenticated = true;
            // Act & Assert
            expect(coordinator.isConnected()).toBe(true);
        });
        it('isConnected should return false when not authenticated', () => {
            // Arrange
            coordinator['activeHandler'] = mockConnectionHandler;
            mockConnectionHandler.isAuthenticated = false;
            // Act & Assert
            expect(coordinator.isConnected()).toBe(false);
        });
        it('isConnected should return false when no active handler', () => {
            // Act & Assert
            expect(coordinator.isConnected()).toBe(false);
        });
    });
});
//# sourceMappingURL=ActiveConnectionCoordinator.test.js.map