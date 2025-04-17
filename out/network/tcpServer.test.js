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
const tcpServer_1 = require("./tcpServer");
const constants_1 = require("../constants");
// Mock the net module
jest.mock('net');
// Mock Server and Socket classes from net
const mockNetServer = {
    listen: jest.fn(),
    close: jest.fn(),
    on: jest.fn(),
    address: jest.fn(() => ({ port: constants_1.NETWORK.CHAT_PORT, address: '0.0.0.0' }))
};
const mockNetSocket = {
    remoteAddress: '192.168.1.101',
    remotePort: 54321
};
// Mock net.createServer
const mockCreateServer = net.createServer;
mockCreateServer.mockReturnValue(mockNetServer);
describe('TcpServer', () => {
    let tcpServer;
    let mockLogger;
    beforeEach(() => {
        mockLogger = (0, ts_mockito_1.mock)();
        tcpServer = new tcpServer_1.TcpServer((0, ts_mockito_1.instance)(mockLogger));
        // Reset mocks before each test
        jest.clearAllMocks();
        (0, ts_mockito_1.reset)(mockLogger);
        // Reset mockNetServer listeners specifically
        mockNetServer.on.mockClear();
        mockNetServer.listen.mockClear();
        mockNetServer.close.mockClear();
    });
    afterEach(() => {
        // Ensure server is stopped if created
        if (tcpServer['tcpServer']) {
            tcpServer.stop();
        }
    });
    test('start should create net.Server, set up listeners, and call listen', () => {
        // Arrange
        mockNetServer.listen.mockImplementation((port, callback) => callback());
        // Act
        tcpServer.start();
        // Assert
        expect(net.createServer).toHaveBeenCalledTimes(1);
        expect(mockNetServer.on).toHaveBeenCalledWith('connection', expect.any(Function));
        expect(mockNetServer.on).toHaveBeenCalledWith('error', expect.any(Function));
        expect(mockNetServer.on).toHaveBeenCalledWith('close', expect.any(Function));
        expect(mockNetServer.listen).toHaveBeenCalledWith(constants_1.NETWORK.CHAT_PORT, expect.any(Function));
        (0, ts_mockito_1.verify)(mockLogger.info(`[TcpServer] TCP server listening on port ${constants_1.NETWORK.CHAT_PORT}`)).once();
    });
    test('start should log error if listen fails', () => {
        // Arrange
        const listenError = new Error('EADDRINUSE');
        mockNetServer.listen.mockImplementation((port, callback) => {
            // Simulate error event being emitted instead of calling callback
            const errorCallback = mockNetServer.on.mock.calls.find(call => call[0] === 'error')[1];
            errorCallback(listenError);
        });
        // Act
        tcpServer.start();
        // Assert
        expect(mockNetServer.listen).toHaveBeenCalledWith(constants_1.NETWORK.CHAT_PORT, expect.any(Function));
        (0, ts_mockito_1.verify)(mockLogger.error('[TcpServer] TCP server error', listenError)).once();
        // Ensure server instance is cleaned up
        expect(tcpServer['tcpServer']).toBeNull();
    });
    test('start should handle immediate error during createServer', () => {
        // Arrange
        const createError = new Error('Create failed');
        mockCreateServer.mockImplementationOnce(() => { throw createError; });
        // Act & Assert
        expect(() => tcpServer.start()).not.toThrow(); // Should handle gracefully
        (0, ts_mockito_1.verify)(mockLogger.error('[TcpServer] Failed to create TCP server', createError)).once();
        expect(tcpServer['tcpServer']).toBeNull();
    });
    test('stop should call close on the server if it exists', () => {
        // Arrange
        mockNetServer.listen.mockImplementation((port, callback) => callback());
        tcpServer.start(); // Start first
        expect(tcpServer['tcpServer']).not.toBeNull();
        // Act
        tcpServer.stop();
        // Assert
        expect(mockNetServer.close).toHaveBeenCalledTimes(1);
        // The 'close' event handler should set tcpServer['tcpServer'] to null
        const closeCallback = mockNetServer.on.mock.calls.find(call => call[0] === 'close')[1];
        closeCallback(); // Manually trigger close event handler
        expect(tcpServer['tcpServer']).toBeNull();
        (0, ts_mockito_1.verify)(mockLogger.info('[TcpServer] TCP server stopped.')).once();
    });
    test('stop should do nothing if server is not running', () => {
        // Act
        tcpServer.stop();
        // Assert
        expect(mockNetServer.close).not.toHaveBeenCalled();
        (0, ts_mockito_1.verify)(mockLogger.info((0, ts_mockito_1.anything)())).never(); // No stop message if not started
    });
    test('should emit incomingConnection when a connection is received', (done) => {
        // Arrange
        mockNetServer.listen.mockImplementation((port, callback) => callback());
        tcpServer.start();
        const connectionCallback = mockNetServer.on.mock.calls.find(call => call[0] === 'connection')[1];
        tcpServer.on('incomingConnection', (socket) => {
            // Assert
            expect(socket).toBe(mockNetSocket);
            (0, ts_mockito_1.verify)(mockLogger.info(`[TcpServer] Incoming connection from ${mockNetSocket.remoteAddress}:${mockNetSocket.remotePort}`)).once();
            done();
        });
        // Act: Simulate a connection event
        connectionCallback(mockNetSocket);
    });
    test('should handle server error event', () => {
        // Arrange
        mockNetServer.listen.mockImplementation((port, callback) => callback());
        tcpServer.start();
        const errorCallback = mockNetServer.on.mock.calls.find(call => call[0] === 'error')[1];
        const testError = new Error('Test server error');
        // Act
        errorCallback(testError);
        // Assert
        (0, ts_mockito_1.verify)(mockLogger.error('[TcpServer] TCP server error', testError)).once();
        // Check if stop() logic was triggered (server instance becomes null)
        expect(tcpServer['tcpServer']).toBeNull();
    });
    test('should handle server close event', () => {
        // Arrange
        mockNetServer.listen.mockImplementation((port, callback) => callback());
        tcpServer.start();
        const closeCallback = mockNetServer.on.mock.calls.find(call => call[0] === 'close')[1];
        // Act
        closeCallback();
        // Assert
        (0, ts_mockito_1.verify)(mockLogger.info('[TcpServer] TCP server stopped.')).once();
        expect(tcpServer['tcpServer']).toBeNull();
    });
});
//# sourceMappingURL=tcpServer.test.js.map