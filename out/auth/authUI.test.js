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
const vscode = __importStar(require("vscode"));
const ts_mockito_1 = require("ts-mockito");
const events_1 = require("events");
const authUI_1 = require("./authUI");
const constants_1 = require("../constants");
// Mock IAuthService using EventEmitter for event handling
class MockAuthService extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this.startAuthentication = jest.fn();
        this.handleMessage = jest.fn();
        this.isAuthenticating = jest.fn();
        this.isAuthenticated = jest.fn();
        this.cancelAuthentication = jest.fn();
        this.cleanupConnection = jest.fn();
        // Need to implement provideUserInput for the test
        this.provideUserInput = jest.fn();
    }
}
// Mock vscode.window.showInputBox
const mockShowInputBox = jest.fn();
// Use jest.spyOn for mocking parts of the vscode API
let showInputBoxSpy;
describe('AuthUI', () => {
    let authUI;
    let mockAuthService;
    const connectionId = 'test-conn-ui-123';
    const promptMessage = 'Enter animal names';
    beforeEach(() => {
        mockAuthService = new MockAuthService();
        // Reset and setup the spy for vscode.window.showInputBox before each test
        showInputBoxSpy = jest.spyOn(vscode.window, 'showInputBox').mockImplementation(mockShowInputBox);
        // Instantiate AuthUI with the mocked service
        // The constructor should set up the listener
        authUI = new authUI_1.AuthUI(mockAuthService);
    });
    afterEach(() => {
        // Restore the original implementation
        showInputBoxSpy.mockRestore();
        (0, ts_mockito_1.reset)(mockAuthService.provideUserInput); // Reset the mock function calls
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
        expect(mockShowInputBox).toHaveBeenCalledTimes(constants_1.AUTH.REQUIRED_ANIMALS);
        expect(mockShowInputBox).toHaveBeenNthCalledWith(1, expect.objectContaining({ prompt: `${promptMessage} (1/${constants_1.AUTH.REQUIRED_ANIMALS})` }));
        expect(mockShowInputBox).toHaveBeenNthCalledWith(2, expect.objectContaining({ prompt: `${promptMessage} (2/${constants_1.AUTH.REQUIRED_ANIMALS})` }));
        expect(mockShowInputBox).toHaveBeenNthCalledWith(3, expect.objectContaining({ prompt: `${promptMessage} (3/${constants_1.AUTH.REQUIRED_ANIMALS})` }));
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
        expect(mockShowInputBox).toHaveBeenCalledTimes(constants_1.AUTH.REQUIRED_ANIMALS);
        // Check if provideUserInput was called correctly
        expect(mockAuthService.provideUserInput).toHaveBeenCalledTimes(1);
        expect(mockAuthService.provideUserInput).toHaveBeenCalledWith(connectionId, expectedNames);
    });
});
//# sourceMappingURL=authUI.test.js.map