"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_mockito_1 = require("ts-mockito");
const events_1 = require("events");
const connectionHandler_1 = require("./connectionHandler");
const uuid_1 = require("uuid");
// Mock dependencies
jest.mock('uuid');
const mockUuidv4 = uuid_1.v4;
describe('ConnectionHandler', () => {
    let connectionHandler;
    let mockLogger;
    let mockAuthService;
    let mockSocket;
    const connectionId = 'test-conn-id-123';
    const remoteAddress = '192.168.1.101';
    const remotePort = 12345;
    beforeEach(() => {
        // Set up mocks
        mockLogger = (0, ts_mockito_1.mock)();
        mockAuthService = (0, ts_mockito_1.mock)();
        mockSocket = (0, ts_mockito_1.mock)();
        // Setup required properties on socket mock
        (0, ts_mockito_1.when)(mockSocket.remoteAddress).thenReturn(remoteAddress);
        (0, ts_mockito_1.when)(mockSocket.remotePort).thenReturn(remotePort);
        (0, ts_mockito_1.when)(mockSocket.on).thenReturn(mockSocket);
        (0, ts_mockito_1.when)(mockSocket.once).thenReturn(mockSocket);
        (0, ts_mockito_1.when)(mockSocket.write((0, ts_mockito_1.anything)())).thenReturn(true);
        (0, ts_mockito_1.when)(mockSocket.end()).thenReturn(mockSocket);
        (0, ts_mockito_1.when)(mockSocket.destroy()).thenReturn(mockSocket);
        // Mock UUID generation for consistent test results
        mockUuidv4.mockReturnValue(connectionId);
        // Create the connection handler with mocked dependencies
        connectionHandler = new connectionHandler_1.ConnectionHandler((0, ts_mockito_1.instance)(mockSocket), (0, ts_mockito_1.instance)(mockLogger), (0, ts_mockito_1.instance)(mockAuthService), false // isInitiator = false for most tests
        );
        // Reset mocks before each test
        jest.clearAllMocks();
        (0, ts_mockito_1.reset)(mockLogger);
        (0, ts_mockito_1.reset)(mockAuthService);
        (0, ts_mockito_1.reset)(mockSocket);
    });
    test('constructor should initialize with correct ID and set up socket listeners', () => {
        // Ensure ID is set correctly
        expect(connectionHandler.id).toBe(connectionId);
        // Verify socket event listeners were set up
        (0, ts_mockito_1.verify)(mockSocket.on('data', (0, ts_mockito_1.anything)())).once();
        (0, ts_mockito_1.verify)(mockSocket.on('error', (0, ts_mockito_1.anything)())).once();
        (0, ts_mockito_1.verify)(mockSocket.on('close', (0, ts_mockito_1.anything)())).once();
        // Should log initialization
        (0, ts_mockito_1.verify)(mockLogger.info(`[ConnectionHandler] New connection handler ${connectionId} created for ${remoteAddress}:${remotePort}`)).once();
    });
    test('startAuthentication should call authService.startAuthentication', () => {
        // Create and set up a real EventEmitter for auth events
        const realAuthService = new events_1.EventEmitter();
        realAuthService.startAuthentication = jest.fn();
        realAuthService.handleMessage = jest.fn();
        realAuthService.isAuthenticating = jest.fn();
        realAuthService.isAuthenticated = jest.fn();
        realAuthService.cancelAuthentication = jest.fn();
        realAuthService.cleanupConnection = jest.fn();
        const handler = new connectionHandler_1.ConnectionHandler((0, ts_mockito_1.instance)(mockSocket), (0, ts_mockito_1.instance)(mockLogger), realAuthService, true // isInitiator = true
        );
        // Act
        handler.startAuthentication(true);
        // Assert
        expect(realAuthService.startAuthentication).toHaveBeenCalledWith(connectionId, true, expect.any(Function));
        (0, ts_mockito_1.verify)(mockLogger.info(`[ConnectionHandler] ${connectionId}: Starting authentication as initiator`)).once();
    });
    test('handleData should process incoming data and handle complete messages', () => {
        // Create a handler with mocked auth
        (0, ts_mockito_1.when)(mockAuthService.handleMessage(connectionId, (0, ts_mockito_1.anything)())).thenReturn(false); // Not an auth message
        // Create test data with a complete JSON message
        const testMessage = { type: 'TEST', content: 'Hello world' };
        const dataBuffer = Buffer.from(JSON.stringify(testMessage) + '\n');
        // Set up listener for messageReceived event
        const messageReceivedHandler = jest.fn();
        connectionHandler.on('messageReceived', messageReceivedHandler);
        // Act
        connectionHandler.handleData(dataBuffer);
        // Assert
        (0, ts_mockito_1.verify)(mockAuthService.handleMessage(connectionId, testMessage)).once();
        expect(messageReceivedHandler).toHaveBeenCalledWith(connectionId, testMessage);
    });
    test('handleData should accumulate partial messages until complete', () => {
        // Create a handler with mocked auth
        (0, ts_mockito_1.when)(mockAuthService.handleMessage(connectionId, (0, ts_mockito_1.anything)())).thenReturn(false); // Not an auth message
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
        (0, ts_mockito_1.verify)(mockAuthService.handleMessage(connectionId, (0, ts_mockito_1.anything)())).never();
        expect(messageReceivedHandler).not.toHaveBeenCalled();
        // Act: Send second chunk to complete the message
        connectionHandler.handleData(chunk2);
        // Assert: Now should handle the complete message
        (0, ts_mockito_1.verify)(mockAuthService.handleMessage(connectionId, testMessage)).once();
        expect(messageReceivedHandler).toHaveBeenCalledWith(connectionId, testMessage);
    });
    test('sendMessage should format and send messages over the socket', () => {
        // Create test message
        const testMessage = { type: 'TEST', content: 'Hello world' };
        // Act
        const result = connectionHandler.sendMessage(testMessage);
        // Assert
        (0, ts_mockito_1.verify)(mockSocket.write(JSON.stringify(testMessage) + '\n')).once();
        expect(result).toBe(true);
        (0, ts_mockito_1.verify)(mockLogger.info(`[ConnectionHandler] ${connectionId}: Sent message: ${JSON.stringify(testMessage)}`)).once();
    });
    test('sendMessage should handle errors and return false', () => {
        // Setup socket to throw on write
        (0, ts_mockito_1.when)(mockSocket.write((0, ts_mockito_1.anything)())).thenThrow(new Error('Write error'));
        // Create test message
        const testMessage = { type: 'TEST', content: 'Hello world' };
        // Act
        const result = connectionHandler.sendMessage(testMessage);
        // Assert
        expect(result).toBe(false);
        (0, ts_mockito_1.verify)(mockLogger.error(`[ConnectionHandler] ${connectionId}: Error sending message`, (0, ts_mockito_1.anything)())).once();
    });
    test('close should end the socket and emit disconnected event', (done) => {
        // Setup listener for disconnected event
        connectionHandler.on('disconnected', (id, hadError) => {
            expect(id).toBe(connectionId);
            expect(hadError).toBe(false); // Default is false when not specified
            // Should clean up auth
            (0, ts_mockito_1.verify)(mockAuthService.cleanupConnection(connectionId)).once();
            (0, ts_mockito_1.verify)(mockSocket.end()).once();
            (0, ts_mockito_1.verify)(mockLogger.info(`[ConnectionHandler] ${connectionId}: Connection closed`)).once();
            done();
        });
        // Act
        connectionHandler.close();
    });
    test('socket error should log and trigger authFailed if authenticating', () => {
        // Setup auth service mock
        (0, ts_mockito_1.when)(mockAuthService.isAuthenticating(connectionId)).thenReturn(true);
        // Get the error handler from socket.on('error') call
        const errorHandler = (0, ts_mockito_1.capture)(mockSocket.on).last()[1];
        const testError = new Error('Socket error');
        // Setup listener for authFailed event
        const authFailedHandler = jest.fn();
        connectionHandler.on('authFailed', authFailedHandler);
        // Act: Trigger the error handler
        errorHandler(testError);
        // Assert
        (0, ts_mockito_1.verify)(mockLogger.error(`[ConnectionHandler] ${connectionId}: Socket error`, testError)).once();
        (0, ts_mockito_1.verify)(mockAuthService.cancelAuthentication(connectionId, 'Socket error')).once();
        expect(authFailedHandler).toHaveBeenCalledWith(connectionId, 'Socket error');
    });
    test('when authentication succeeds, should emit authenticated event', (done) => {
        // Create handler with real EventEmitter for auth
        const realAuthService = new events_1.EventEmitter();
        realAuthService.startAuthentication = jest.fn();
        realAuthService.handleMessage = jest.fn();
        realAuthService.isAuthenticating = jest.fn().mockReturnValue(false);
        realAuthService.isAuthenticated = jest.fn().mockReturnValue(true);
        realAuthService.cancelAuthentication = jest.fn();
        realAuthService.cleanupConnection = jest.fn();
        const handler = new connectionHandler_1.ConnectionHandler((0, ts_mockito_1.instance)(mockSocket), (0, ts_mockito_1.instance)(mockLogger), realAuthService, false);
        // Setup listener for authenticated event
        handler.on('authenticated', (id) => {
            expect(id).toBe(connectionId);
            expect(handler.isAuthenticated).toBe(true);
            (0, ts_mockito_1.verify)(mockLogger.info(`[ConnectionHandler] ${connectionId}: Authentication successful`)).once();
            done();
        });
        // Act: Emit auth success event
        realAuthService.emit('authSucceeded', connectionId);
    });
    test('when authentication fails, should emit authFailed event', (done) => {
        // Create handler with real EventEmitter for auth
        const realAuthService = new events_1.EventEmitter();
        realAuthService.startAuthentication = jest.fn();
        realAuthService.handleMessage = jest.fn();
        realAuthService.isAuthenticating = jest.fn();
        realAuthService.isAuthenticated = jest.fn();
        realAuthService.cancelAuthentication = jest.fn();
        realAuthService.cleanupConnection = jest.fn();
        const handler = new connectionHandler_1.ConnectionHandler((0, ts_mockito_1.instance)(mockSocket), (0, ts_mockito_1.instance)(mockLogger), realAuthService, false);
        const failReason = 'Authentication failed: Invalid credentials';
        // Setup listener for authFailed event
        handler.on('authFailed', (id, reason) => {
            expect(id).toBe(connectionId);
            expect(reason).toBe(failReason);
            expect(handler.isAuthenticated).toBe(false);
            (0, ts_mockito_1.verify)(mockLogger.warn(`[ConnectionHandler] ${connectionId}: Authentication failed: ${failReason}`)).once();
            done();
        });
        // Act: Emit auth failed event
        realAuthService.emit('authFailed', connectionId, failReason);
    });
});
//# sourceMappingURL=connectionHandler.test.js.map