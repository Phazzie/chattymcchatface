import { mock, instance, verify, when, anything, reset, capture } from 'ts-mockito';
import { EventEmitter } from 'events';
import * as net from 'net';
import { TcpClient } from './tcpClient';
import { ILogger, ITcpClient, DiscoveredPeer } from '../interfaces';
import { NETWORK } from '../constants';

// Mock the net module
jest.mock('net');

// Mock Socket class from net
const mockNetSocket = {
    connect: jest.fn(),
    setTimeout: jest.fn(),
    on: jest.fn(),
    end: jest.fn(),
    destroy: jest.fn(),
    remoteAddress: '192.168.1.101',
    remotePort: 54321
};

// Mock net.Socket constructor
const mockSocketConstructor = net.Socket as jest.Mock;
mockSocketConstructor.mockImplementation(() => mockNetSocket);

describe('TcpClient', () => {
    let tcpClient: ITcpClient;
    let mockLogger: ILogger;
    const testPeer: DiscoveredPeer = {
        ip: '192.168.1.101',
        port: NETWORK.CHAT_PORT,
        instanceId: 'peer-123'
    };

    beforeEach(() => {
        mockLogger = mock<ILogger>();
        tcpClient = new TcpClient(instance(mockLogger));

        // Reset mocks before each test
        jest.clearAllMocks();
        reset(mockLogger);

        // Reset mockNetSocket listeners specifically
        mockNetSocket.on.mockClear();
        mockNetSocket.connect.mockClear();
        mockNetSocket.setTimeout.mockClear();
        mockNetSocket.end.mockClear();
    });

    test('connect should create Socket, set timeout, set up listeners, and call connect', () => {
        // Act
        tcpClient.connect(testPeer);

        // Assert
        expect(net.Socket).toHaveBeenCalledTimes(1);
        expect(mockNetSocket.setTimeout).toHaveBeenCalledWith(NETWORK.CONNECTION_TIMEOUT);
        expect(mockNetSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
        expect(mockNetSocket.on).toHaveBeenCalledWith('timeout', expect.any(Function));
        expect(mockNetSocket.on).toHaveBeenCalledWith('error', expect.any(Function));
        expect(mockNetSocket.on).toHaveBeenCalledWith('close', expect.any(Function));
        expect(mockNetSocket.connect).toHaveBeenCalledWith(testPeer.port, testPeer.ip);
        verify(mockLogger.info(`[TcpClient] Connecting to ${testPeer.ip}:${testPeer.port}...`)).once();
    });

    test('connect should emit connectionEstablished on successful connection', (done) => {
        // Arrange
        tcpClient.connect(testPeer);
        const connectCallback = mockNetSocket.on.mock.calls.find(call => call[0] === 'connect')[1];

        tcpClient.on('connectionEstablished', (socket, peer) => {
            // Assert
            expect(socket).toBe(mockNetSocket);
            expect(peer).toEqual(testPeer);
            verify(mockLogger.info(`[TcpClient] Connected to ${testPeer.ip}:${testPeer.port}`)).once();
            done();
        });

        // Act: Simulate a connect event
        connectCallback();
    });

    test('connect should handle timeout, destroy socket, and emit connectionFailed', (done) => {
        // Arrange
        tcpClient.connect(testPeer);
        const timeoutCallback = mockNetSocket.on.mock.calls.find(call => call[0] === 'timeout')[1];

        tcpClient.on('connectionFailed', (peer, error) => {
            // Assert
            expect(peer).toEqual(testPeer);
            expect(error.message).toContain('timed out');
            expect(mockNetSocket.destroy).toHaveBeenCalledTimes(1);
            verify(mockLogger.warn(`[TcpClient] Connection to ${testPeer.ip}:${testPeer.port} timed out`)).once();
            done();
        });

        // Act: Simulate a timeout event
        timeoutCallback();
    });

    test('connect should handle error and emit connectionFailed', (done) => {
        // Arrange
        tcpClient.connect(testPeer);
        const errorCallback = mockNetSocket.on.mock.calls.find(call => call[0] === 'error')[1];
        const testError = new Error('Test connection error');

        tcpClient.on('connectionFailed', (peer, error) => {
            // Assert
            expect(peer).toEqual(testPeer);
            expect(error).toBe(testError);
            verify(mockLogger.error(`[TcpClient] Error connecting to ${testPeer.ip}:${testPeer.port}`, testError)).once();
            done();
        });

        // Act: Simulate an error event
        errorCallback(testError);
    });

    test('connect should handle close event before connection', () => {
        // Arrange
        tcpClient.connect(testPeer);
        const closeCallback = mockNetSocket.on.mock.calls.find(call => call[0] === 'close')[1];
        const hadError = true;

        // Act: Simulate a close event
        closeCallback(hadError);

        // Assert
        verify(mockLogger.info(`[TcpClient] Connection closed ${hadError ? 'with error' : ''}`)).once();
        // No events should be emitted as we're simulating close before connect
    });

    test('connect should do nothing if already connecting', () => {
        // Arrange: First connection attempt
        tcpClient.connect(testPeer);
        expect(net.Socket).toHaveBeenCalledTimes(1);
        mockSocketConstructor.mockClear();

        // Act: Second connection attempt
        tcpClient.connect(testPeer);

        // Assert: Socket constructor should not be called again
        expect(net.Socket).not.toHaveBeenCalled();
        verify(mockLogger.warn(`[TcpClient] Already connecting to a peer, ignoring connection to ${testPeer.ip}:${testPeer.port}`)).once();
    });

    test('disconnect should end the socket if connected', () => {
        // Arrange: Connect and simulate successful connection
        tcpClient.connect(testPeer);
        const connectCallback = mockNetSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
        connectCallback();

        // Act
        tcpClient.disconnect();

        // Assert
        expect(mockNetSocket.end).toHaveBeenCalledTimes(1);
        verify(mockLogger.info('[TcpClient] Disconnecting from peer')).once();
    });

    test('disconnect should do nothing if not connected', () => {
        // Act: Disconnect without connecting first
        tcpClient.disconnect();

        // Assert
        expect(mockNetSocket.end).not.toHaveBeenCalled();
        verify(mockLogger.info('[TcpClient] Not connected to any peer')).once();
    });
});