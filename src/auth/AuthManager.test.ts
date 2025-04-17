import { EventEmitter } from 'events';
import { AuthManager } from './AuthManager';
import { IAuthProcess } from './interfaces/IAuthProcess';
import { IAuthProcessFactory } from './interfaces/IAuthProcessFactory';
import { ILogger } from '../interfaces';

describe('AuthManager', () => {
    // Mock dependencies
    let mockAuthProcessFactory: jest.Mocked<IAuthProcessFactory>;
    let mockLogger: jest.Mocked<ILogger>;
    let mockAuthProcess: jest.Mocked<IAuthProcess>;
    let mockSendMessage: jest.Mock;
    
    // System under test
    let authManager: AuthManager;
    
    // Test data
    const testConnectionId = 'test-connection-id';
    const testIsInitiator = true;
    const testMessage = { type: 'AUTH_REQ' };
    const testReason = 'Test failure reason';
    
    beforeEach(() => {
        // Create mocks
        mockAuthProcess = new EventEmitter() as jest.Mocked<IAuthProcess>;
        mockAuthProcess.start = jest.fn();
        mockAuthProcess.handleMessage = jest.fn();
        mockAuthProcess.abort = jest.fn();
        mockAuthProcess.getConnectionId = jest.fn().mockReturnValue(testConnectionId);
        
        mockAuthProcessFactory = {
            create: jest.fn().mockReturnValue(mockAuthProcess),
        };
        
        mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        };
        
        mockSendMessage = jest.fn().mockReturnValue(true);
        
        // Create system under test
        authManager = new AuthManager(mockAuthProcessFactory, mockLogger);
    });
    
    describe('startAuthentication', () => {
        it('should create a new auth process with the provided parameters', () => {
            // Act
            authManager.startAuthentication(testConnectionId, testIsInitiator, mockSendMessage);
            
            // Assert
            expect(mockAuthProcessFactory.create).toHaveBeenCalledWith(
                testConnectionId,
                testIsInitiator,
                mockSendMessage,
                mockLogger
            );
        });
        
        it('should start the created auth process', () => {
            // Act
            authManager.startAuthentication(testConnectionId, testIsInitiator, mockSendMessage);
            
            // Assert
            expect(mockAuthProcess.start).toHaveBeenCalledTimes(1);
        });
        
        it('should clean up any existing process for the same connection ID', () => {
            // Arrange
            authManager.startAuthentication(testConnectionId, testIsInitiator, mockSendMessage);
            
            // Act
            authManager.startAuthentication(testConnectionId, testIsInitiator, mockSendMessage);
            
            // Assert
            expect(mockAuthProcess.abort).toHaveBeenCalledTimes(1);
            expect(mockAuthProcess.abort).toHaveBeenCalledWith(expect.stringContaining('cleanup'));
        });
        
        it('should forward authenticated event from the auth process', () => {
            // Arrange
            const spy = jest.fn();
            authManager.on('authenticated', spy);
            authManager.startAuthentication(testConnectionId, testIsInitiator, mockSendMessage);
            
            // Act
            mockAuthProcess.emit('authenticated', testConnectionId);
            
            // Assert
            expect(spy).toHaveBeenCalledWith(testConnectionId);
        });
        
        it('should forward failed event from the auth process', () => {
            // Arrange
            const spy = jest.fn();
            authManager.on('authFailed', spy);
            authManager.startAuthentication(testConnectionId, testIsInitiator, mockSendMessage);
            
            // Act
            mockAuthProcess.emit('failed', testConnectionId, testReason);
            
            // Assert
            expect(spy).toHaveBeenCalledWith(testConnectionId, testReason);
        });
        
        it('should remove the process from the map when authentication succeeds', () => {
            // Arrange
            authManager.startAuthentication(testConnectionId, testIsInitiator, mockSendMessage);
            
            // Act
            mockAuthProcess.emit('authenticated', testConnectionId);
            
            // Assert - Try to handle a message for the removed process
            authManager.handleMessage(testConnectionId, testMessage);
            expect(mockAuthProcess.handleMessage).not.toHaveBeenCalled();
        });
        
        it('should remove the process from the map when authentication fails', () => {
            // Arrange
            authManager.startAuthentication(testConnectionId, testIsInitiator, mockSendMessage);
            
            // Act
            mockAuthProcess.emit('failed', testConnectionId, testReason);
            
            // Assert - Try to handle a message for the removed process
            authManager.handleMessage(testConnectionId, testMessage);
            expect(mockAuthProcess.handleMessage).not.toHaveBeenCalled();
        });
    });
    
    describe('handleMessage', () => {
        it('should forward the message to the correct auth process', () => {
            // Arrange
            authManager.startAuthentication(testConnectionId, testIsInitiator, mockSendMessage);
            
            // Act
            authManager.handleMessage(testConnectionId, testMessage);
            
            // Assert
            expect(mockAuthProcess.handleMessage).toHaveBeenCalledWith(testMessage);
        });
        
        it('should log a warning if no auth process exists for the connection ID', () => {
            // Act
            authManager.handleMessage('non-existent-id', testMessage);
            
            // Assert
            expect(mockLogger.warn).toHaveBeenCalledWith(expect.stringContaining('unknown/inactive'));
        });
        
        it('should handle parsing errors and abort the auth process', () => {
            // Arrange
            authManager.startAuthentication(testConnectionId, testIsInitiator, mockSendMessage);
            const parseError = new Error('Parse error');
            mockAuthProcess.handleMessage.mockImplementation(() => { throw parseError; });
            
            // Act
            authManager.handleMessage(testConnectionId, testMessage);
            
            // Assert
            expect(mockLogger.error).toHaveBeenCalledWith(expect.stringContaining('Failed to parse'), expect.anything());
            expect(mockAuthProcess.abort).toHaveBeenCalledWith(expect.stringContaining('Invalid message'));
        });
    });
    
    describe('cleanupConnection', () => {
        it('should abort the auth process for the specified connection ID', () => {
            // Arrange
            authManager.startAuthentication(testConnectionId, testIsInitiator, mockSendMessage);
            
            // Act
            authManager.cleanupConnection(testConnectionId);
            
            // Assert
            expect(mockAuthProcess.abort).toHaveBeenCalledWith(expect.stringContaining('cleanup'));
        });
        
        it('should remove all listeners from the auth process', () => {
            // Arrange
            authManager.startAuthentication(testConnectionId, testIsInitiator, mockSendMessage);
            jest.spyOn(mockAuthProcess, 'removeAllListeners');
            
            // Act
            authManager.cleanupConnection(testConnectionId);
            
            // Assert
            expect(mockAuthProcess.removeAllListeners).toHaveBeenCalled();
        });
        
        it('should remove the process from the map', () => {
            // Arrange
            authManager.startAuthentication(testConnectionId, testIsInitiator, mockSendMessage);
            
            // Act
            authManager.cleanupConnection(testConnectionId);
            
            // Assert - Try to handle a message for the removed process
            authManager.handleMessage(testConnectionId, testMessage);
            expect(mockAuthProcess.handleMessage).not.toHaveBeenCalled();
        });
        
        it('should do nothing if no auth process exists for the connection ID', () => {
            // Act
            authManager.cleanupConnection('non-existent-id');
            
            // Assert
            expect(mockLogger.info).not.toHaveBeenCalled();
        });
    });
});
