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
const ts_mockito_1 = require("ts-mockito");
const dgram = __importStar(require("dgram"));
const udpDiscovery_1 = require("./udpDiscovery");
const constants_1 = require("../constants");
// Mock the dgram module
jest.mock('dgram');
// Mock Socket class from dgram
const mockSocket = {
    on: jest.fn(),
    bind: jest.fn(),
    setBroadcast: jest.fn(),
    send: jest.fn(),
    close: jest.fn(),
    address: jest.fn(() => ({ address: '0.0.0.0', port: constants_1.NETWORK.DISCOVERY_PORT }))
};
// Mock dgram.createSocket
const mockCreateSocket = dgram.createSocket;
mockCreateSocket.mockReturnValue(mockSocket);
describe('UdpDiscovery', () => {
    let udpDiscovery;
    let mockLogger;
    const testInstanceId = 'test-instance-123';
    const peerInstanceId = 'peer-instance-456';
    const peerIp = '192.168.1.100';
    const peerPort = constants_1.NETWORK.CHAT_PORT;
    beforeEach(() => {
        mockLogger = (0, ts_mockito_1.mock)();
        udpDiscovery = new udpDiscovery_1.UdpDiscovery((0, ts_mockito_1.instance)(mockLogger), testInstanceId);
        // Reset mocks before each test
        jest.clearAllMocks();
        (0, ts_mockito_1.reset)(mockLogger);
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
        expect(mockSocket.bind).toHaveBeenCalledWith(constants_1.NETWORK.DISCOVERY_PORT, expect.any(Function));
        expect(mockSocket.setBroadcast).toHaveBeenCalledWith(true);
        expect(setInterval).toHaveBeenCalledWith(expect.any(Function), constants_1.NETWORK.BROADCAST_INTERVAL);
        expect(mockSocket.send).toHaveBeenCalledTimes(1); // Initial broadcast
        (0, ts_mockito_1.verify)(mockLogger.info((0, ts_mockito_1.anything)())).atLeast(1);
    });
    test('start should handle bind error', () => {
        // Arrange
        const bindError = new Error('Bind failed');
        mockSocket.bind.mockImplementation((port, callback) => { throw bindError; }); // Simulate immediate throw
        // Act & Assert
        expect(() => udpDiscovery.start()).not.toThrow(); // Should handle gracefully
        (0, ts_mockito_1.verify)(mockLogger.error('Failed to start UDP discovery', bindError)).once();
        expect(udpDiscovery['udpSocket']).toBeNull();
    });
    test('stop should clear interval and close socket', () => {
        // Arrange
        mockSocket.bind.mockImplementation((port, callback) => callback());
        udpDiscovery.start(); // Start first
        const intervalId = setInterval.mock.results[0].value;
        // Act
        udpDiscovery.stop();
        // Assert
        expect(clearInterval).toHaveBeenCalledWith(intervalId);
        expect(mockSocket.close).toHaveBeenCalledTimes(1);
        expect(udpDiscovery['udpSocket']).toBeNull();
        (0, ts_mockito_1.verify)(mockLogger.info('UDP discovery stopped')).once();
    });
    test('should send discovery broadcast periodically', () => {
        // Arrange
        mockSocket.bind.mockImplementation((port, callback) => callback());
        udpDiscovery.start();
        expect(mockSocket.send).toHaveBeenCalledTimes(1); // Initial broadcast
        // Act
        jest.advanceTimersByTime(constants_1.NETWORK.BROADCAST_INTERVAL);
        // Assert
        expect(mockSocket.send).toHaveBeenCalledTimes(2);
        const [buffer, offset, length, port, address, callback] = mockSocket.send.mock.calls[1];
        const message = JSON.parse(buffer.toString());
        expect(message.type).toBe(constants_1.NETWORK.BROADCAST_TYPES.DISCOVER);
        expect(message.version).toBe(constants_1.PROTOCOL_VERSION);
        expect(message.port).toBe(constants_1.NETWORK.CHAT_PORT);
        expect(message.instanceId).toBe(testInstanceId);
        expect(port).toBe(constants_1.NETWORK.DISCOVERY_PORT);
        expect(address).toBe(constants_1.NETWORK.BROADCAST_ADDRESS);
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
        (0, ts_mockito_1.verify)(mockLogger.error(`UDP socket error: ${testError.message}`)).once();
        expect(clearInterval).toHaveBeenCalled();
        expect(mockSocket.close).toHaveBeenCalled();
        expect(udpDiscovery['udpSocket']).toBeNull();
    });
    test('should ignore own broadcast messages', () => {
        // Arrange
        mockSocket.bind.mockImplementation((port, callback) => callback());
        udpDiscovery.start();
        const messageCallback = mockSocket.on.mock.calls.find(call => call[0] === 'message')[1];
        const ownMessage = {
            type: constants_1.NETWORK.BROADCAST_TYPES.DISCOVER,
            version: constants_1.PROTOCOL_VERSION,
            port: constants_1.NETWORK.CHAT_PORT,
            instanceId: testInstanceId // Same instance ID
        };
        const messageBuffer = Buffer.from(JSON.stringify(ownMessage));
        const rinfo = { address: peerIp, port: constants_1.NETWORK.DISCOVERY_PORT, family: 'IPv4', size: messageBuffer.length };
        // Act
        messageCallback(messageBuffer, rinfo);
        // Assert
        (0, ts_mockito_1.verify)(mockLogger.info((0, ts_mockito_1.anything)())).never(); // Should not log processing of own message
        (0, ts_mockito_1.verify)(mockLogger.warn((0, ts_mockito_1.anything)())).never();
        (0, ts_mockito_1.verify)(mockLogger.error((0, ts_mockito_1.anything)())).never();
        expect(mockSocket.send).toHaveBeenCalledTimes(1); // Only initial broadcast, no response sent
    });
    test('should respond to DISCOVER message from peer', () => {
        // Arrange
        mockSocket.bind.mockImplementation((port, callback) => callback());
        udpDiscovery.start();
        const messageCallback = mockSocket.on.mock.calls.find(call => call[0] === 'message')[1];
        const discoverMessage = {
            type: constants_1.NETWORK.BROADCAST_TYPES.DISCOVER,
            version: constants_1.PROTOCOL_VERSION,
            port: peerPort,
            instanceId: peerInstanceId
        };
        const messageBuffer = Buffer.from(JSON.stringify(discoverMessage));
        const rinfo = { address: peerIp, port: constants_1.NETWORK.DISCOVERY_PORT, family: 'IPv4', size: messageBuffer.length };
        // Act
        messageCallback(messageBuffer, rinfo);
        // Assert
        (0, ts_mockito_1.verify)(mockLogger.info(`Received discovery message from ${peerIp}:${constants_1.NETWORK.DISCOVERY_PORT}`)).once();
        expect(mockSocket.send).toHaveBeenCalledTimes(2); // Initial broadcast + Announcement response
        const [buffer, offset, length, port, address, callback] = mockSocket.send.mock.calls[1];
        const responseMessage = JSON.parse(buffer.toString());
        expect(responseMessage.type).toBe(constants_1.NETWORK.BROADCAST_TYPES.ANNOUNCE);
        expect(responseMessage.instanceId).toBe(testInstanceId);
        expect(port).toBe(constants_1.NETWORK.DISCOVERY_PORT);
        expect(address).toBe(peerIp); // Sent directly to the peer
    });
    test('should emit peerDiscovered on receiving ANNOUNCE message from peer', (done) => {
        // Arrange
        mockSocket.bind.mockImplementation((port, callback) => callback());
        udpDiscovery.start();
        const messageCallback = mockSocket.on.mock.calls.find(call => call[0] === 'message')[1];
        const announceMessage = {
            type: constants_1.NETWORK.BROADCAST_TYPES.ANNOUNCE,
            version: constants_1.PROTOCOL_VERSION,
            port: peerPort,
            instanceId: peerInstanceId
        };
        const messageBuffer = Buffer.from(JSON.stringify(announceMessage));
        const rinfo = { address: peerIp, port: constants_1.NETWORK.DISCOVERY_PORT, family: 'IPv4', size: messageBuffer.length };
        const expectedPeer = {
            ip: peerIp,
            port: peerPort,
            instanceId: peerInstanceId
        };
        udpDiscovery.on('peerDiscovered', (peer) => {
            // Assert
            expect(peer).toEqual(expectedPeer);
            (0, ts_mockito_1.verify)(mockLogger.info(`Received announcement from ${peerIp}:${constants_1.NETWORK.DISCOVERY_PORT}`)).once();
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
        const rinfo = { address: peerIp, port: constants_1.NETWORK.DISCOVERY_PORT, family: 'IPv4', size: invalidJsonBuffer.length };
        // Act
        messageCallback(invalidJsonBuffer, rinfo);
        // Assert
        (0, ts_mockito_1.verify)(mockLogger.error('Error parsing discovery message', (0, ts_mockito_1.anything)())).once();
        // Ensure no response/event emission happened
        expect(mockSocket.send).toHaveBeenCalledTimes(1);
        // No peerDiscovered event should be emitted (can't easily test absence with EventEmitter)
    });
    test('should handle message with incorrect type', () => {
        // Arrange
        mockSocket.bind.mockImplementation((port, callback) => callback());
        udpDiscovery.start();
        const messageCallback = mockSocket.on.mock.calls.find(call => call[0] === 'message')[1];
        const wrongTypeMessage = { type: 'WRONG_TYPE', instanceId: peerInstanceId, port: peerPort, version: constants_1.PROTOCOL_VERSION };
        const messageBuffer = Buffer.from(JSON.stringify(wrongTypeMessage));
        const rinfo = { address: peerIp, port: constants_1.NETWORK.DISCOVERY_PORT, family: 'IPv4', size: messageBuffer.length };
        // Act
        messageCallback(messageBuffer, rinfo);
        // Assert
        (0, ts_mockito_1.verify)(mockLogger.warn(`Unknown discovery message type: WRONG_TYPE from ${peerIp}`)).once();
        expect(mockSocket.send).toHaveBeenCalledTimes(1);
    });
});
//# sourceMappingURL=udpDiscovery.test.js.map