import { mock, instance, verify, when, anything, reset, capture } from 'ts-mockito';
import { EventEmitter } from 'events';
import * as dgram from 'dgram';
import { UdpDiscovery } from './udpDiscovery';
import { ILogger, DiscoveredPeer, IUdpDiscovery } from '../interfaces';
import { NETWORK, PROTOCOL_VERSION } from '../constants';

// Mock the dgram module
jest.mock('dgram');

// Mock Socket class from dgram
const mockSocket = {
    on: jest.fn(),
    bind: jest.fn(),
    setBroadcast: jest.fn(),
    send: jest.fn(),
    close: jest.fn(),
    address: jest.fn(() => ({ address: '0.0.0.0', port: NETWORK.DISCOVERY_PORT }))
};

// Mock dgram.createSocket
const mockCreateSocket = dgram.createSocket as jest.Mock;
mockCreateSocket.mockReturnValue(mockSocket);

describe('UdpDiscovery', () => {
    let udpDiscovery: UdpDiscovery;
    let mockLogger: ILogger;
    const testInstanceId = 'test-instance-123';
    const peerInstanceId = 'peer-instance-456';
    const peerIp = '192.168.1.100';
    const peerPort = NETWORK.CHAT_PORT;

    beforeEach(() => {
        mockLogger = mock<ILogger>();
        udpDiscovery = new UdpDiscovery(instance(mockLogger), testInstanceId);

        // Reset mocks before each test
        jest.clearAllMocks();
        reset(mockLogger);

        // Mock timers
        jest.useFakeTimers();
    });

    afterEach(() => {
        // Restore timers
        jest.useRealTimers();
        // Ensure socket is closed if created
        if (udpDiscovery['udpSocket']) {
            udpDiscovery.stop();
        }
    });

    test('start should create UDP socket, bind, set broadcast, and start interval', () => {
        // Arrange
        mockSocket.bind.mockImplementation((port, callback) => callback());

        // Act
        udpDiscovery.start();

        // Assert
        expect(dgram.createSocket).toHaveBeenCalledWith({ type: 'udp4', reuseAddr: true });
        expect(mockSocket.on).toHaveBeenCalledWith('error', expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith('message', expect.any(Function));
        expect(mockSocket.bind).toHaveBeenCalledWith(NETWORK.DISCOVERY_PORT, expect.any(Function));
        expect(mockSocket.setBroadcast).toHaveBeenCalledWith(true);
        expect(setInterval).toHaveBeenCalledWith(expect.any(Function), NETWORK.BROADCAST_INTERVAL);
        expect(mockSocket.send).toHaveBeenCalledTimes(1); // Initial broadcast
        verify(mockLogger.info(anything())).atLeast(1);
    });

    test('start should handle bind error', () => {
        // Arrange
        const bindError = new Error('Bind failed');
        mockSocket.bind.mockImplementation((port, callback) => { throw bindError; }); // Simulate immediate throw

        // Act & Assert
        expect(() => udpDiscovery.start()).not.toThrow(); // Should handle gracefully
        verify(mockLogger.error('Failed to start UDP discovery', bindError)).once();
        expect(udpDiscovery['udpSocket']).toBeNull();
    });

    test('stop should clear interval and close socket', () => {
        // Arrange
        mockSocket.bind.mockImplementation((port, callback) => callback());
        udpDiscovery.start(); // Start first
        const intervalId = (setInterval as jest.Mock).mock.results[0].value;

        // Act
        udpDiscovery.stop();

        // Assert
        expect(clearInterval).toHaveBeenCalledWith(intervalId);
        expect(mockSocket.close).toHaveBeenCalledTimes(1);
        expect(udpDiscovery['udpSocket']).toBeNull();
        verify(mockLogger.info('UDP discovery stopped')).once();
    });

    test('should send discovery broadcast periodically', () => {
        // Arrange
        mockSocket.bind.mockImplementation((port, callback) => callback());
        udpDiscovery.start();
        expect(mockSocket.send).toHaveBeenCalledTimes(1); // Initial broadcast

        // Act
        jest.advanceTimersByTime(NETWORK.BROADCAST_INTERVAL);

        // Assert
        expect(mockSocket.send).toHaveBeenCalledTimes(2);
        const [buffer, offset, length, port, address, callback] = mockSocket.send.mock.calls[1];
        const message = JSON.parse(buffer.toString());
        expect(message.type).toBe(NETWORK.BROADCAST_TYPES.DISCOVER);
        expect(message.version).toBe(PROTOCOL_VERSION);
        expect(message.port).toBe(NETWORK.CHAT_PORT);
        expect(message.instanceId).toBe(testInstanceId);
        expect(port).toBe(NETWORK.DISCOVERY_PORT);
        expect(address).toBe(NETWORK.BROADCAST_ADDRESS);
    });

    test('should handle socket error and stop discovery', () => {
        // Arrange
        mockSocket.bind.mockImplementation((port, callback) => callback());
        udpDiscovery.start();
        const errorCallback = mockSocket.on.mock.calls.find(call => call[0] === 'error')[1];
        const testError = new Error('Socket error');

        // Act
        errorCallback(testError);

        // Assert
        verify(mockLogger.error(`UDP socket error: ${testError.message}`)).once();
        expect(clearInterval).toHaveBeenCalled();
        expect(mockSocket.close).toHaveBeenCalled();
        expect(udpDiscovery['udpSocket']).toBeNull();
    });

    test('should ignore own broadcast messages', () => {
        // Arrange
        mockSocket.bind.mockImplementation((port, callback) => callback());
        udpDiscovery.start();
        const messageCallback = mockSocket.on.mock.calls.find(call => call[0] === 'message')[1];
        const ownMessage: DiscoveryMessage = {
            type: NETWORK.BROADCAST_TYPES.DISCOVER,
            version: PROTOCOL_VERSION,
            port: NETWORK.CHAT_PORT,
            instanceId: testInstanceId // Same instance ID
        };
        const messageBuffer = Buffer.from(JSON.stringify(ownMessage));
        const rinfo = { address: peerIp, port: NETWORK.DISCOVERY_PORT, family: 'IPv4', size: messageBuffer.length };

        // Act
        messageCallback(messageBuffer, rinfo);

        // Assert
        verify(mockLogger.info(anything())).never(); // Should not log processing of own message
        verify(mockLogger.warn(anything())).never();
        verify(mockLogger.error(anything())).never();
        expect(mockSocket.send).toHaveBeenCalledTimes(1); // Only initial broadcast, no response sent
    });

    test('should respond to DISCOVER message from peer', () => {
        // Arrange
        mockSocket.bind.mockImplementation((port, callback) => callback());
        udpDiscovery.start();
        const messageCallback = mockSocket.on.mock.calls.find(call => call[0] === 'message')[1];
        const discoverMessage: DiscoveryMessage = {
            type: NETWORK.BROADCAST_TYPES.DISCOVER,
            version: PROTOCOL_VERSION,
            port: peerPort,
            instanceId: peerInstanceId
        };
        const messageBuffer = Buffer.from(JSON.stringify(discoverMessage));
        const rinfo = { address: peerIp, port: NETWORK.DISCOVERY_PORT, family: 'IPv4', size: messageBuffer.length };

        // Act
        messageCallback(messageBuffer, rinfo);

        // Assert
        verify(mockLogger.info(`Received discovery message from ${peerIp}:${NETWORK.DISCOVERY_PORT}`)).once();
        expect(mockSocket.send).toHaveBeenCalledTimes(2); // Initial broadcast + Announcement response
        const [buffer, offset, length, port, address, callback] = mockSocket.send.mock.calls[1];
        const responseMessage = JSON.parse(buffer.toString());
        expect(responseMessage.type).toBe(NETWORK.BROADCAST_TYPES.ANNOUNCE);
        expect(responseMessage.instanceId).toBe(testInstanceId);
        expect(port).toBe(NETWORK.DISCOVERY_PORT);
        expect(address).toBe(peerIp); // Sent directly to the peer
    });

    test('should emit peerDiscovered on receiving ANNOUNCE message from peer', (done) => {
        // Arrange
        mockSocket.bind.mockImplementation((port, callback) => callback());
        udpDiscovery.start();
        const messageCallback = mockSocket.on.mock.calls.find(call => call[0] === 'message')[1];
        const announceMessage: DiscoveryMessage = {
            type: NETWORK.BROADCAST_TYPES.ANNOUNCE,
            version: PROTOCOL_VERSION,
            port: peerPort,
            instanceId: peerInstanceId
        };
        const messageBuffer = Buffer.from(JSON.stringify(announceMessage));
        const rinfo = { address: peerIp, port: NETWORK.DISCOVERY_PORT, family: 'IPv4', size: messageBuffer.length };

        const expectedPeer: DiscoveredPeer = {
            ip: peerIp,
            port: peerPort,
            instanceId: peerInstanceId
        };

        udpDiscovery.on('peerDiscovered', (peer) => {
            // Assert
            expect(peer).toEqual(expectedPeer);
            verify(mockLogger.info(`Received announcement from ${peerIp}:${NETWORK.DISCOVERY_PORT}`)).once();
            done();
        });

        // Act
        messageCallback(messageBuffer, rinfo);
    });

    test('should handle invalid JSON message', () => {
        // Arrange
        mockSocket.bind.mockImplementation((port, callback) => callback());
        udpDiscovery.start();
        const messageCallback = mockSocket.on.mock.calls.find(call => call[0] === 'message')[1];
        const invalidJsonBuffer = Buffer.from('{\"type\": \"invalid');
        const rinfo = { address: peerIp, port: NETWORK.DISCOVERY_PORT, family: 'IPv4', size: invalidJsonBuffer.length };

        // Act
        messageCallback(invalidJsonBuffer, rinfo);

        // Assert
        verify(mockLogger.error('Error parsing discovery message', anything())).once();
        // Ensure no response/event emission happened
        expect(mockSocket.send).toHaveBeenCalledTimes(1);
        // No peerDiscovered event should be emitted (can't easily test absence with EventEmitter)
    });

    test('should handle message with incorrect type', () => {
        // Arrange
        mockSocket.bind.mockImplementation((port, callback) => callback());
        udpDiscovery.start();
        const messageCallback = mockSocket.on.mock.calls.find(call => call[0] === 'message')[1];
        const wrongTypeMessage = { type: 'WRONG_TYPE', instanceId: peerInstanceId, port: peerPort, version: PROTOCOL_VERSION };
        const messageBuffer = Buffer.from(JSON.stringify(wrongTypeMessage));
        const rinfo = { address: peerIp, port: NETWORK.DISCOVERY_PORT, family: 'IPv4', size: messageBuffer.length };

        // Act
        messageCallback(messageBuffer, rinfo);

        // Assert
        verify(mockLogger.warn(`Unknown discovery message type: WRONG_TYPE from ${peerIp}`)).once();
        expect(mockSocket.send).toHaveBeenCalledTimes(1);
    });
});

// Minimal DiscoveryMessage interface for tests
interface DiscoveryMessage {
    type: string;
    version: number;
    port: number;
    instanceId: string;
}
