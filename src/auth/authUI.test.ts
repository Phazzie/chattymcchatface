import * as vscode from 'vscode';
import { mock, instance, verify, when, anything, capture, reset } from 'ts-mockito';
import { EventEmitter } from 'events';
import { AuthUI } from './authUI';
import { IAuthService, IAuthUI } from '../interfaces';
import { AUTH } from '../constants';

// Mock IAuthService using EventEmitter for event handling
class MockAuthService extends EventEmitter implements IAuthService {
    startAuthentication = jest.fn();
    handleMessage = jest.fn();
    isAuthenticating = jest.fn();
    isAuthenticated = jest.fn();
    cancelAuthentication = jest.fn();
    cleanupConnection = jest.fn();
    // Need to implement provideUserInput for the test
    provideUserInput = jest.fn();
}

// Mock vscode.window.showInputBox
const mockShowInputBox = jest.fn();
// Use jest.spyOn for mocking parts of the vscode API
let showInputBoxSpy: jest.SpyInstance;

describe('AuthUI', () => {
    let authUI: IAuthUI;
    let mockAuthService: MockAuthService;

    const connectionId = 'test-conn-ui-123';
    const promptMessage = 'Enter animal names';

    beforeEach(() => {
        mockAuthService = new MockAuthService();
        // Reset and setup the spy for vscode.window.showInputBox before each test
        showInputBoxSpy = jest.spyOn(vscode.window, 'showInputBox').mockImplementation(mockShowInputBox);

        // Instantiate AuthUI with the mocked service
        // The constructor should set up the listener
        authUI = new AuthUI(mockAuthService);
    });

    afterEach(() => {
        // Restore the original implementation
        showInputBoxSpy.mockRestore();
        reset(mockAuthService.provideUserInput); // Reset the mock function calls
        mockAuthService.removeAllListeners(); // Clean up listeners
    });

    test('should call showInputBox required times when promptForUserInput is emitted', async () => {
        // Arrange
        const expectedNames = ['Lion', 'Tiger', 'Bear'];
        mockShowInputBox
            .mockResolvedValueOnce(expectedNames[0])
            .mockResolvedValueOnce(expectedNames[1])
            .mockResolvedValueOnce(expectedNames[2]);

        // Act: Simulate the event emission from AuthService
        mockAuthService.emit('promptForUserInput', connectionId, promptMessage, false);

        // Allow promises to resolve
        await Promise.resolve(); // Wait for the async promptForAnimalNames to potentially start
        await Promise.resolve(); // Additional wait might be needed depending on implementation details
        await Promise.resolve();

        // Assert
        expect(mockShowInputBox).toHaveBeenCalledTimes(AUTH.REQUIRED_ANIMALS);
        expect(mockShowInputBox).toHaveBeenNthCalledWith(1, expect.objectContaining({ prompt: `${promptMessage} (1/${AUTH.REQUIRED_ANIMALS})` }));
        expect(mockShowInputBox).toHaveBeenNthCalledWith(2, expect.objectContaining({ prompt: `${promptMessage} (2/${AUTH.REQUIRED_ANIMALS})` }));
        expect(mockShowInputBox).toHaveBeenNthCalledWith(3, expect.objectContaining({ prompt: `${promptMessage} (3/${AUTH.REQUIRED_ANIMALS})` }));
    });

    test('should call authService.provideUserInput with collected names on success', async () => {
        // Arrange
        const expectedNames = ['Lion', 'Tiger', 'Bear'];
        mockShowInputBox
            .mockResolvedValueOnce(expectedNames[0])
            .mockResolvedValueOnce(expectedNames[1])
            .mockResolvedValueOnce(expectedNames[2]);

        // Act
        mockAuthService.emit('promptForUserInput', connectionId, promptMessage, false);
        await Promise.resolve(); // Allow async operations to proceed
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve(); // Extra tick to ensure provideUserInput is called


        // Assert
        expect(mockAuthService.provideUserInput).toHaveBeenCalledTimes(1);
        expect(mockAuthService.provideUserInput).toHaveBeenCalledWith(connectionId, expectedNames);
    });

    test('should call authService.provideUserInput with null if user cancels first input', async () => {
        // Arrange
        mockShowInputBox.mockResolvedValueOnce(undefined); // Simulate cancellation

        // Act
        mockAuthService.emit('promptForUserInput', connectionId, promptMessage, false);
        await Promise.resolve();
        await Promise.resolve();

        // Assert
        expect(mockShowInputBox).toHaveBeenCalledTimes(1);
        expect(mockAuthService.provideUserInput).toHaveBeenCalledTimes(1);
        expect(mockAuthService.provideUserInput).toHaveBeenCalledWith(connectionId, null);
    });

    test('should call authService.provideUserInput with null if user cancels subsequent input', async () => {
        // Arrange
        mockShowInputBox
            .mockResolvedValueOnce('Lion')
            .mockResolvedValueOnce(undefined); // Simulate cancellation on the second input

        // Act
        mockAuthService.emit('promptForUserInput', connectionId, promptMessage, false);
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();

        // Assert
        expect(mockShowInputBox).toHaveBeenCalledTimes(2);
        expect(mockAuthService.provideUserInput).toHaveBeenCalledTimes(1);
        expect(mockAuthService.provideUserInput).toHaveBeenCalledWith(connectionId, null);
    });

    test('should trim whitespace from user input', async () => {
        // Arrange
        const inputNames = ['  Lion ', ' Tiger', 'Bear  '];
        const expectedNames = ['Lion', 'Tiger', 'Bear'];
        mockShowInputBox
            .mockResolvedValueOnce(inputNames[0])
            .mockResolvedValueOnce(inputNames[1])
            .mockResolvedValueOnce(inputNames[2]);

        // Act
        mockAuthService.emit('promptForUserInput', connectionId, promptMessage, false);
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();

        // Assert
        expect(mockAuthService.provideUserInput).toHaveBeenCalledTimes(1);
        expect(mockAuthService.provideUserInput).toHaveBeenCalledWith(connectionId, expectedNames);
    });

    test('should handle prompt for validation correctly', async () => {
        // Arrange
        const expectedNames = ['Lion', 'Tiger', 'Bear'];
        mockShowInputBox
            .mockResolvedValueOnce(expectedNames[0])
            .mockResolvedValueOnce(expectedNames[1])
            .mockResolvedValueOnce(expectedNames[2]);

        // Act: Simulate the event emission from AuthService for validation
        mockAuthService.emit('promptForUserInput', connectionId, promptMessage, true); // isValidation = true

        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();
        await Promise.resolve();

        // Assert
        // Check if showInputBox was called with validation context (though the prompt message might be the same)
        expect(mockShowInputBox).toHaveBeenCalledTimes(AUTH.REQUIRED_ANIMALS);
        // Check if provideUserInput was called correctly
        expect(mockAuthService.provideUserInput).toHaveBeenCalledTimes(1);
        expect(mockAuthService.provideUserInput).toHaveBeenCalledWith(connectionId, expectedNames);
    });

});
