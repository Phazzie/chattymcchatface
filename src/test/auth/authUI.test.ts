import * as vscode from 'vscode';
import { AuthUI } from '../../auth/authUI';
import { IAuthService } from '../../interfaces';
import { AUTH } from '../../constants';

describe('AuthUI', () => {
    let authUI: AuthUI;
    let mockAuthService: IAuthService;
    let mockShowInputBox: jest.Mock;
    let mockShowWarningMessage: jest.Mock;
    let connectionId: string;

    beforeEach(() => {
        // Mock auth service
        mockAuthService = {
            on: jest.fn(),
            provideUserInput: jest.fn(),
            emit: jest.fn()
        } as any;

        // Mock VS Code API
        mockShowInputBox = jest.fn();
        mockShowWarningMessage = jest.fn();

        (vscode.window.showInputBox as any) = mockShowInputBox;
        (vscode.window.showWarningMessage as any) = mockShowWarningMessage;

        // Create auth UI
        authUI = new AuthUI(mockAuthService);

        // Set up test connection ID
        connectionId = 'test-connection-id';
    });

    describe('constructor', () => {
        it('should set up event listener for promptForUserInput', () => {
            // The listener is set up in the constructor
            expect(mockAuthService.on).toHaveBeenCalledWith(
                'promptForUserInput',
                expect.any(Function)
            );
        });
    });

    describe('handlePromptRequest', () => {
        it('should call promptForAnimalNames and provide input to auth service', async () => {
            // Mock the promptForAnimalNames method
            const animalNames = ['elephant', 'tiger', 'giraffe'];
            const promptForAnimalNamesSpy = jest.spyOn(authUI, 'promptForAnimalNames')
                .mockResolvedValue(animalNames);

            // Get the promptForUserInput handler
            const handler = (mockAuthService.on as jest.Mock).mock.calls.find(
                call => call[0] === 'promptForUserInput'
            )[1];

            // Call the handler directly
            await handler(connectionId, 'Enter animal names', false);

            // Verify promptForAnimalNames was called
            expect(promptForAnimalNamesSpy).toHaveBeenCalledWith(
                connectionId,
                'Enter animal names',
                false
            );

            // Verify provideUserInput was called with the animal names
            expect(mockAuthService.provideUserInput).toHaveBeenCalledWith(
                connectionId,
                animalNames
            );
        });

        it('should handle null response from promptForAnimalNames', async () => {
            // Mock the promptForAnimalNames method to return null
            jest.spyOn(authUI, 'promptForAnimalNames').mockResolvedValue(null);

            // Get the promptForUserInput handler
            const handler = (mockAuthService.on as jest.Mock).mock.calls.find(
                call => call[0] === 'promptForUserInput'
            )[1];

            // Call the handler directly
            await handler(connectionId, 'Enter animal names', false);

            // Verify provideUserInput was called with null
            expect(mockAuthService.provideUserInput).toHaveBeenCalledWith(
                connectionId,
                null
            );
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
            expect(mockShowInputBox).toHaveBeenCalledTimes(AUTH.REQUIRED_ANIMALS);

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
