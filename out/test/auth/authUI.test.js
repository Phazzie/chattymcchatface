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
const authUI_1 = require("../../auth/authUI");
const constants_1 = require("../../constants");
describe('AuthUI', () => {
    let authUI;
    let mockAuthService;
    let mockShowInputBox;
    let mockShowWarningMessage;
    let connectionId;
    beforeEach(() => {
        // Mock auth service
        mockAuthService = {
            on: jest.fn(),
            provideUserInput: jest.fn(),
            emit: jest.fn()
        };
        // Mock VS Code API
        mockShowInputBox = jest.fn();
        mockShowWarningMessage = jest.fn();
        vscode.window.showInputBox = mockShowInputBox;
        vscode.window.showWarningMessage = mockShowWarningMessage;
        // Create auth UI
        authUI = new authUI_1.AuthUI(mockAuthService);
        // Set up test connection ID
        connectionId = 'test-connection-id';
    });
    describe('constructor', () => {
        it('should set up event listener for promptForUserInput', () => {
            // The listener is set up in the constructor
            expect(mockAuthService.on).toHaveBeenCalledWith('promptForUserInput', expect.any(Function));
        });
    });
    describe('handlePromptRequest', () => {
        it('should call promptForAnimalNames and provide input to auth service', async () => {
            // Mock the promptForAnimalNames method
            const animalNames = ['elephant', 'tiger', 'giraffe'];
            const promptForAnimalNamesSpy = jest.spyOn(authUI, 'promptForAnimalNames')
                .mockResolvedValue(animalNames);
            // Get the promptForUserInput handler
            const handler = mockAuthService.on.mock.calls.find(call => call[0] === 'promptForUserInput')[1];
            // Call the handler directly
            await handler(connectionId, 'Enter animal names', false);
            // Verify promptForAnimalNames was called
            expect(promptForAnimalNamesSpy).toHaveBeenCalledWith(connectionId, 'Enter animal names', false);
            // Verify provideUserInput was called with the animal names
            expect(mockAuthService.provideUserInput).toHaveBeenCalledWith(connectionId, animalNames);
        });
        it('should handle null response from promptForAnimalNames', async () => {
            // Mock the promptForAnimalNames method to return null
            jest.spyOn(authUI, 'promptForAnimalNames').mockResolvedValue(null);
            // Get the promptForUserInput handler
            const handler = mockAuthService.on.mock.calls.find(call => call[0] === 'promptForUserInput')[1];
            // Call the handler directly
            await handler(connectionId, 'Enter animal names', false);
            // Verify provideUserInput was called with null
            expect(mockAuthService.provideUserInput).toHaveBeenCalledWith(connectionId, null);
        });
    });
    describe('promptForAnimalNames', () => {
        it('should prompt for the required number of animal names', async () => {
            // Mock showInputBox to return valid animal names
            mockShowInputBox.mockResolvedValueOnce('elephant')
                .mockResolvedValueOnce('tiger')
                .mockResolvedValueOnce('giraffe');
            const result = await authUI.promptForAnimalNames(connectionId, 'Enter animal names', false);
            // Verify showInputBox was called the correct number of times
            expect(mockShowInputBox).toHaveBeenCalledTimes(constants_1.AUTH.REQUIRED_ANIMALS);
            // Verify the result contains the expected animal names
            expect(result).toEqual(['elephant', 'tiger', 'giraffe']);
        });
        it('should return null if user cancels input', async () => {
            // Mock showInputBox to return undefined (user cancelled)
            mockShowInputBox.mockResolvedValueOnce('elephant')
                .mockResolvedValueOnce(undefined);
            const result = await authUI.promptForAnimalNames(connectionId, 'Enter animal names', false);
            // Verify the result is null
            expect(result).toBeNull();
        });
        it('should return null and show warning if user enters empty string', async () => {
            // Mock showInputBox to return empty string
            mockShowInputBox.mockResolvedValueOnce('elephant')
                .mockResolvedValueOnce('');
            const result = await authUI.promptForAnimalNames(connectionId, 'Enter animal names', false);
            // Verify warning was shown
            expect(mockShowWarningMessage).toHaveBeenCalled();
            // Verify the result is null
            expect(result).toBeNull();
        });
    });
});
//# sourceMappingURL=authUI.test.js.map