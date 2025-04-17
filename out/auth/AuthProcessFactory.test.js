"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AuthProcessFactory_1 = require("./AuthProcessFactory");
const AuthProcess_1 = require("./AuthProcess");
describe('AuthProcessFactory', () => {
    // Mock dependencies
    let mockTimer;
    let mockLogger;
    let mockSendMessage;
    // System under test
    let factory;
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
        factory = new AuthProcessFactory_1.AuthProcessFactory(mockTimer);
    });
    describe('create', () => {
        it('should create an AuthProcess instance', () => {
            // Act
            const result = factory.create(testConnectionId, testIsInitiator, mockSendMessage, mockLogger);
            // Assert
            expect(result).toBeInstanceOf(AuthProcess_1.AuthProcess);
        });
        it('should pass all parameters to the AuthProcess constructor', () => {
            // Arrange
            const spy = jest.spyOn(AuthProcess_1.AuthProcess.prototype, 'getConnectionId');
            // Act
            const result = factory.create(testConnectionId, testIsInitiator, mockSendMessage, mockLogger);
            // Assert
            expect(result.getConnectionId()).toBe(testConnectionId);
            expect(spy).toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=AuthProcessFactory.test.js.map