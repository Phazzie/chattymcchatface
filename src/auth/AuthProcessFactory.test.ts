import { AuthProcessFactory } from './AuthProcessFactory';
import { AuthProcess } from './AuthProcess';
import { ITimer } from './interfaces/ITimer';
import { ILogger } from '../interfaces';

describe('AuthProcessFactory', () => {
    // Mock dependencies
    let mockTimer: jest.Mocked<ITimer>;
    let mockLogger: jest.Mocked<ILogger>;
    let mockSendMessage: jest.Mock;
    
    // System under test
    let factory: AuthProcessFactory;
    
    // Test data
    const testConnectionId = 'test-connection-id';
    const testIsInitiator = true;
    
    beforeEach(() => {
        // Create mocks
        mockTimer = {
            set: jest.fn(),
            clear: jest.fn()
        };
        
        mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn()
        };
        
        mockSendMessage = jest.fn().mockReturnValue(true);
        
        // Create system under test
        factory = new AuthProcessFactory(mockTimer);
    });
    
    describe('create', () => {
        it('should create an AuthProcess instance', () => {
            // Act
            const result = factory.create(
                testConnectionId,
                testIsInitiator,
                mockSendMessage,
                mockLogger
            );
            
            // Assert
            expect(result).toBeInstanceOf(AuthProcess);
        });
        
        it('should pass all parameters to the AuthProcess constructor', () => {
            // Arrange
            const spy = jest.spyOn(AuthProcess.prototype, 'getConnectionId');
            
            // Act
            const result = factory.create(
                testConnectionId,
                testIsInitiator,
                mockSendMessage,
                mockLogger
            );
            
            // Assert
            expect(result.getConnectionId()).toBe(testConnectionId);
            expect(spy).toHaveBeenCalled();
        });
    });
});
