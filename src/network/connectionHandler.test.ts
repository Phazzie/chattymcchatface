import { mock, instance, verify, when, anything, reset, capture } from 'ts-mockito';
import { EventEmitter } from 'events';
import * as net from 'net';
import { ConnectionHandler } from './connectionHandler';
import { ILogger, IAuthService, IConnectionHandler } from '../interfaces';
import { v4 as uuidv4 } from 'uuid';

// Mock dependencies
jest.mock('uuid');
const mockUuidv4 = uuidv4 as jest.Mock;

describe('ConnectionHandler', () => {
    let connectionHandler: IConnectionHandler;
    let mockLogger: ILogger;
    let mockAuthService: IAuthService;
    let mockSocket: net.Socket;
    const connectionId = 'test-conn-id-123';
    const remoteAddress = '192.168.1.101';
    const remotePort = 12345;

    beforeEach(() => {
        // Set up mocks
        mockLogger = mock<ILogger>();
        mockAuthService = mock<IAuthService>();
        mockSocket = mock<net.Socket>();

        // Setup required properties on socket mock
        when(mockSocket.remoteAddress).thenReturn(remoteAddress);
        when(mockSocket.remotePort).thenReturn(remotePort);
        when(mockSocket.on).thenReturn(mockSocket as any);
        when(mockSocket.once).thenReturn(mockSocket as any);
        when(mockSocket.write(anything())).thenReturn(true);
        when(mockSocket.end()).thenReturn(mockSocket as any);
        when(mockSocket.destroy()).thenReturn(mockSocket as any);

        // Mock UUID generation for consistent test results
        mockUuidv4.mockReturnValue(connectionId);

        // Create the connection handler with mocked dependencies
        connectionHandler = new ConnectionHandler(
            instance(mockSocket),
            instance(mockLogger),
            instance(mockAuthService),
            false // isInitiator = false for most tests
        );

        // Reset mocks before each test
        jest.clearAllMocks();
        reset(mockLogger);
        reset(mockAuthService);
        reset(mockSocket);
    });

    test('constructor should initialize with correct ID and set up socket listeners', () => {
        // Ensure ID is set correctly
        expect(connectionHandler.id).toBe(connectionId);

        // Verify socket event listeners were set up
        verify(mockSocket.on('data', anything())).once();
        verify(mockSocket.on('error', anything())).once();
        verify(mockSocket.on('close', anything())).once();

        // Should log initialization
        verify(mockLogger.info(`[ConnectionHandler] New connection handler ${connectionId} created for ${remoteAddress}:${remotePort}`)).once();
    });

    test('startAuthentication should call authService.startAuthentication', () => {
        // Create and set up a real EventEmitter for auth events
        const realAuthService = new EventEmitter() as IAuthService;
        realAuthService.startAuthentication = jest.fn();
        realAuthService.handleMessage = jest.fn();
        realAuthService.isAuthenticating = jest.fn();
        realAuthService.isAuthenticated = jest.fn();
        realAuthService.cancelAuthentication = jest.fn();
        realAuthService.cleanupConnection = jest.fn();

        const handler = new ConnectionHandler(
            instance(mockSocket),
            instance(mockLogger),
            realAuthService,
            true // isInitiator = true
        );

        // Act
        handler.startAuthentication(true);

        // Assert
        expect(realAuthService.startAuthentication).toHaveBeenCalledWith(
            connectionId,
            true,
            expect.any(Function)
        );

        verify(mockLogger.info(`[ConnectionHandler] ${connectionId}: Starting authentication as initiator`)).once();
    });

    test('handleData should process incoming data and handle complete messages', () => {
        // Create a handler with mocked auth
        when(mockAuthService.handleMessage(connectionId, anything())).thenReturn(false); // Not an auth message

        // Create test data with a complete JSON message
        const testMessage = { type: 'TEST', content: 'Hello world' };
        const dataBuffer = Buffer.from(JSON.stringify(testMessage) + '\n');

        // Set up listener for messageReceived event
        const messageReceivedHandler = jest.fn();
        connectionHandler.on('messageReceived', messageReceivedHandler);

        // Act
        connectionHandler.handleData(dataBuffer);

        // Assert
        verify(mockAuthService.handleMessage(connectionId, testMessage)).once();
        expect(messageReceivedHandler).toHaveBeenCalledWith(connectionId, testMessage);
    });

    test('handleData should accumulate partial messages until complete', () => {
        // Create a handler with mocked auth
        when(mockAuthService.handleMessage(connectionId, anything())).thenReturn(false); // Not an auth message

        // Set up listener for messageReceived event
        const messageReceivedHandler = jest.fn();
        connectionHandler.on('messageReceived', messageReceivedHandler);

        // Send a message in chunks
        const testMessage = { type: 'TEST', content: 'Hello world' };
        const fullMessage = JSON.stringify(testMessage) + '\n';
        const chunk1 = Buffer.from(fullMessage.substring(0, 10));
        const chunk2 = Buffer.from(fullMessage.substring(10));

        // Act: Send first chunk
        connectionHandler.handleData(chunk1);

        // Assert: Should not trigger message handling yet
        verify(mockAuthService.handleMessage(connectionId, anything())).never();
        expect(messageReceivedHandler).not.toHaveBeenCalled();

        // Act: Send second chunk to complete the message
        connectionHandler.handleData(chunk2);

        // Assert: Now should handle the complete message
        verify(mockAuthService.handleMessage(connectionId, testMessage)).once();
        expect(messageReceivedHandler).toHaveBeenCalledWith(connectionId, testMessage);
    });

    test('sendMessage should format and send messages over the socket', () => {
        // Create test message
        const testMessage = { type: 'TEST', content: 'Hello world' };

        // Act
        const result = connectionHandler.sendMessage(testMessage);

        // Assert
        verify(mockSocket.write(JSON.stringify(testMessage) + '\n')).once();
        expect(result).toBe(true);
        verify(mockLogger.info(`[ConnectionHandler] ${connectionId}: Sent message: ${JSON.stringify(testMessage)}`)).once();
    });

    test('sendMessage should handle errors and return false', () => {
        // Setup socket to throw on write
        when(mockSocket.write(anything())).thenThrow(new Error('Write error'));

        // Create test message
        const testMessage = { type: 'TEST', content: 'Hello world' };

        // Act
        const result = connectionHandler.sendMessage(testMessage);

        // Assert
        expect(result).toBe(false);
        verify(mockLogger.error(`[ConnectionHandler] ${connectionId}: Error sending message`, anything())).once();
    });

    test('close should end the socket and emit disconnected event', (done) => {
        // Setup listener for disconnected event
        connectionHandler.on('disconnected', (id, hadError) => {
            expect(id).toBe(connectionId);
            expect(hadError).toBe(false); // Default is false when not specified

            // Should clean up auth
            verify(mockAuthService.cleanupConnection(connectionId)).once();
            verify(mockSocket.end()).once();
            verify(mockLogger.info(`[ConnectionHandler] ${connectionId}: Connection closed`)).once();

            done();
        });

        // Act
        connectionHandler.close();
    });

    test('socket error should log and trigger authFailed if authenticating', () => {
        // Setup auth service mock
        when(mockAuthService.isAuthenticating(connectionId)).thenReturn(true);

        // Get the error handler from socket.on('error') call
        const errorHandler = capture(mockSocket.on).last()[1];
        const testError = new Error('Socket error');

        // Setup listener for authFailed event
        const authFailedHandler = jest.fn();
        connectionHandler.on('authFailed', authFailedHandler);

        // Act: Trigger the error handler
        errorHandler(testError);

        // Assert
        verify(mockLogger.error(`[ConnectionHandler] ${connectionId}: Socket error`, testError)).once();
        verify(mockAuthService.cancelAuthentication(connectionId, 'Socket error')).once();
        expect(authFailedHandler).toHaveBeenCalledWith(connectionId, 'Socket error');
    });

    test('when authentication succeeds, should emit authenticated event', (done) => {
        // Create handler with real EventEmitter for auth
        const realAuthService = new EventEmitter() as IAuthService;
        realAuthService.startAuthentication = jest.fn();
        realAuthService.handleMessage = jest.fn();
        realAuthService.isAuthenticating = jest.fn().mockReturnValue(false);
        realAuthService.isAuthenticated = jest.fn().mockReturnValue(true);
        realAuthService.cancelAuthentication = jest.fn();
        realAuthService.cleanupConnection = jest.fn();

        const handler = new ConnectionHandler(
            instance(mockSocket),
            instance(mockLogger),
            realAuthService,
            false
        );

        // Setup listener for authenticated event
        handler.on('authenticated', (id) => {
            expect(id).toBe(connectionId);
            expect(handler.isAuthenticated).toBe(true);
            verify(mockLogger.info(`[ConnectionHandler] ${connectionId}: Authentication successful`)).once();
            done();
        });

        // Act: Emit auth success event
        realAuthService.emit('authSucceeded', connectionId);
    });

    test('when authentication fails, should emit authFailed event', (done) => {
        // Create handler with real EventEmitter for auth
        const realAuthService = new EventEmitter() as IAuthService;
        realAuthService.startAuthentication = jest.fn();
        realAuthService.handleMessage = jest.fn();
        realAuthService.isAuthenticating = jest.fn();
        realAuthService.isAuthenticated = jest.fn();
        realAuthService.cancelAuthentication = jest.fn();
        realAuthService.cleanupConnection = jest.fn();

        const handler = new ConnectionHandler(
            instance(mockSocket),
            instance(mockLogger),
            realAuthService,
            false
        );

        const failReason = 'Authentication failed: Invalid credentials';

        // Setup listener for authFailed event
        handler.on('authFailed', (id, reason) => {
            expect(id).toBe(connectionId);
            expect(reason).toBe(failReason);
            expect(handler.isAuthenticated).toBe(false);
            verify(mockLogger.warn(`[ConnectionHandler] ${connectionId}: Authentication failed: ${failReason}`)).once();
            done();
        });

        // Act: Emit auth failed event
        realAuthService.emit('authFailed', connectionId, failReason);
    });
});