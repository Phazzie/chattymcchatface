import { BasicNetworkLifecycleManager } from './BasicNetworkLifecycleManager';
import { IUdpDiscovery, ITcpServer, ILogger } from '../../interfaces';

describe('BasicNetworkLifecycleManager', () => {
    // Mock dependencies
    let mockUdpDiscovery: jest.Mocked<IUdpDiscovery>;
    let mockTcpServer: jest.Mocked<ITcpServer>;
    let mockLogger: jest.Mocked<ILogger>;
    
    // System under test
    let lifecycleManager: BasicNetworkLifecycleManager;
    
    beforeEach(() => {
        // Create mocks
        mockUdpDiscovery = {
            start: jest.fn(),
            stop: jest.fn(),
            on: jest.fn().mockReturnThis(),
            once: jest.fn().mockReturnThis(),
            off: jest.fn().mockReturnThis(),
            removeListener: jest.fn().mockReturnThis(),
            addListener: jest.fn().mockReturnThis(),
            removeAllListeners: jest.fn().mockReturnThis(),
            setMaxListeners: jest.fn().mockReturnThis(),
            getMaxListeners: jest.fn().mockReturnValue(10),
            listeners: jest.fn().mockReturnValue([]),
            rawListeners: jest.fn().mockReturnValue([]),
            emit: jest.fn().mockReturnValue(true),
            listenerCount: jest.fn().mockReturnValue(0),
            prependListener: jest.fn().mockReturnThis(),
            prependOnceListener: jest.fn().mockReturnThis(),
            eventNames: jest.fn().mockReturnValue([]),
        };
        
        mockTcpServer = {
            start: jest.fn(),
            stop: jest.fn(),
            on: jest.fn().mockReturnThis(),
            once: jest.fn().mockReturnThis(),
            off: jest.fn().mockReturnThis(),
            removeListener: jest.fn().mockReturnThis(),
            addListener: jest.fn().mockReturnThis(),
            removeAllListeners: jest.fn().mockReturnThis(),
            setMaxListeners: jest.fn().mockReturnThis(),
            getMaxListeners: jest.fn().mockReturnValue(10),
            listeners: jest.fn().mockReturnValue([]),
            rawListeners: jest.fn().mockReturnValue([]),
            emit: jest.fn().mockReturnValue(true),
            listenerCount: jest.fn().mockReturnValue(0),
            prependListener: jest.fn().mockReturnThis(),
            prependOnceListener: jest.fn().mockReturnThis(),
            eventNames: jest.fn().mockReturnValue([]),
        };
        
        mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };
        
        // Create system under test
        lifecycleManager = new BasicNetworkLifecycleManager(
            mockUdpDiscovery,
            mockTcpServer,
            mockLogger
        );
    });
    
    describe('start', () => {
        it('should start the TCP server and UDP discovery', () => {
            // Act
            lifecycleManager.start();
            
            // Assert
            expect(mockTcpServer.start).toHaveBeenCalledTimes(1);
            expect(mockUdpDiscovery.start).toHaveBeenCalledTimes(1);
            expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Started'));
        });
        
        it('should start the TCP server before UDP discovery', () => {
            // Act
            lifecycleManager.start();
            
            // Assert
            expect(mockTcpServer.start.mock.invocationCallOrder[0])
                .toBeLessThan(mockUdpDiscovery.start.mock.invocationCallOrder[0]);
        });
        
        it('should stop services and throw if TCP server fails to start', () => {
            // Arrange
            const error = new Error('TCP server start failed');
            mockTcpServer.start.mockImplementation(() => { throw error; });
            
            // Act & Assert
            expect(() => lifecycleManager.start()).toThrow(error);
            expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Error starting'), expect.anything());
            expect(mockUdpDiscovery.stop).toHaveBeenCalledTimes(1);
            expect(mockTcpServer.stop).toHaveBeenCalledTimes(1);
        });
        
        it('should stop services and throw if UDP discovery fails to start', () => {
            // Arrange
            const error = new Error('UDP discovery start failed');
            mockUdpDiscovery.start.mockImplementation(() => { throw error; });
            
            // Act & Assert
            expect(() => lifecycleManager.start()).toThrow(error);
            expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Error starting'), expect.anything());
            expect(mockUdpDiscovery.stop).toHaveBeenCalledTimes(1);
            expect(mockTcpServer.stop).toHaveBeenCalledTimes(1);
        });
    });
    
    describe('stop', () => {
        it('should stop the UDP discovery and TCP server', () => {
            // Act
            lifecycleManager.stop();
            
            // Assert
            expect(mockUdpDiscovery.stop).toHaveBeenCalledTimes(1);
            expect(mockTcpServer.stop).toHaveBeenCalledTimes(1);
            expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Stopped'));
        });
        
        it('should stop the UDP discovery before TCP server', () => {
            // Act
            lifecycleManager.stop();
            
            // Assert
            expect(mockUdpDiscovery.stop.mock.invocationCallOrder[0])
                .toBeLessThan(mockTcpServer.stop.mock.invocationCallOrder[0]);
        });
        
        it('should log error but continue if UDP discovery fails to stop', () => {
            // Arrange
            const error = new Error('UDP discovery stop failed');
            mockUdpDiscovery.stop.mockImplementation(() => { throw error; });
            
            // Act
            lifecycleManager.stop();
            
            // Assert
            expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Error stopping'), expect.anything());
            expect(mockTcpServer.stop).toHaveBeenCalledTimes(1);
        });
        
        it('should log error but continue if TCP server fails to stop', () => {
            // Arrange
            const error = new Error('TCP server stop failed');
            mockTcpServer.stop.mockImplementation(() => { throw error; });
            
            // Act
            lifecycleManager.stop();
            
            // Assert
            expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Error stopping'), expect.anything());
            expect(mockUdpDiscovery.stop).toHaveBeenCalledTimes(1);
        });
    });
});
