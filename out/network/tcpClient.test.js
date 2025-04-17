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
const net = __importStar(require("net"));
const tcpClient_1 = require("./tcpClient");
const constants_1 = require("../constants");
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
const mockSocketConstructor = net.Socket;
mockSocketConstructor.mockImplementation(() => mockNetSocket);
describe('TcpClient', () => {
    let tcpClient;
    let mockLogger;
    const testPeer = {
        ip: '192.168.1.101',
        port: constants_1.NETWORK.CHAT_PORT,
        instanceId: 'peer-123'
    };
    beforeEach(() => {
        mockLogger = (0, ts_mockito_1.mock)();
        tcpClient = new tcpClient_1.TcpClient((0, ts_mockito_1.instance)(mockLogger));
        // Reset mocks before each test
        jest.clearAllMocks();
        (0, ts_mockito_1.reset)(mockLogger);
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
        expect(mockNetSocket.setTimeout).toHaveBeenCalledWith(constants_1.NETWORK.CONNECTION_TIMEOUT);
        expect(mockNetSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
        expect(mockNetSocket.on).toHaveBeenCalledWith('timeout', expect.any(Function));
        expect(mockNetSocket.on).toHaveBeenCalledWith('error', expect.any(Function));
        expect(mockNetSocket.on).toHaveBeenCalledWith('close', expect.any(Function));
        expect(mockNetSocket.connect).toHaveBeenCalledWith(testPeer.port, testPeer.ip);
        (0, ts_mockito_1.verify)(mockLogger.info(`[TcpClient] Connecting to ${testPeer.ip}:${testPeer.port}...`)).once();
    });
    test('connect should emit connectionEstablished on successful connection', (done) => {
        // Arrange
        tcpClient.connect(testPeer);
        const connectCallback = mockNetSocket.on.mock.calls.find(call => call[0] === 'connect')[1];
        tcpClient.on('connectionEstablished', (socket, peer) => {
            // Assert
            expect(socket).toBe(mockNetSocket);
            expect(peer).toEqual(testPeer);
            (0, ts_mockito_1.verify)(mockLogger.info(`[TcpClient] Connected to ${testPeer.ip}:${testPeer.port}`)).once();
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
            (0, ts_mockito_1.verify)(mockLogger.warn(`[TcpClient] Connection to ${testPeer.ip}:${testPeer.port} timed out`)).once();
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
            (0, ts_mockito_1.verify)(mockLogger.error(`[TcpClient] Error connecting to ${testPeer.ip}:${testPeer.port}`, testError)).once();
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
        (0, ts_mockito_1.verify)(mockLogger.info(`[TcpClient] Connection closed ${hadError ? 'with error' : ''}`)).once();
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
        (0, ts_mockito_1.verify)(mockLogger.warn(`[TcpClient] Already connecting to a peer, ignoring connection to ${testPeer.ip}:${testPeer.port}`)).once();
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
        (0, ts_mockito_1.verify)(mockLogger.info('[TcpClient] Disconnecting from peer')).once();
    });
    test('disconnect should do nothing if not connected', () => {
        // Act: Disconnect without connecting first
        tcpClient.disconnect();
        // Assert
        expect(mockNetSocket.end).not.toHaveBeenCalled();
        (0, ts_mockito_1.verify)(mockLogger.info('[TcpClient] Not connected to any peer')).once();
    });
});
//# sourceMappingURL=tcpClient.test.js.map