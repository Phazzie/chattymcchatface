import * as vscode from 'vscode';
import { IAuthService, IAuthUI } from '../interfaces';
import { AUTH } from '../constants';

/**
 * Handles the VS Code UI interactions for authentication, specifically prompting for animal names.
 */
export class AuthUI implements IAuthUI {
    private readonly authService: IAuthService;

    /**
     * Creates an instance of AuthUI.
     * @param authService The authentication service to interact with.
     */
    constructor(authService: IAuthService) {
        this.authService = authService;
        // Listen for prompts from the AuthService
        this.authService.on('promptForUserInput', this.handlePromptRequest.bind(this));
    }

    /**
     * Handles the 'promptForUserInput' event from the AuthService.
     * @param connectionId The ID of the connection requiring input.
     * @param promptMessage The base message for the input prompt.
     * @param isValidation Indicates if this is for initial input or validation.
     */
    private async handlePromptRequest(connectionId: string, promptMessage: string, isValidation: boolean): Promise<void> {
        const animalNames = await this.promptForAnimalNames(connectionId, promptMessage, isValidation);
        // Pass the result (or null if cancelled) back to the AuthService
        this.authService.provideUserInput(connectionId, animalNames);
    }

    /**
     * Prompts the user iteratively for the required number of animal names using vscode.window.showInputBox.
     * @param connectionId The ID of the connection (used for context, though not directly in the prompt here).
     * @param promptMessage The base message for the input prompt.
     * @param isValidation Indicates if this is for initial input or validation (not directly used in prompt logic here, but available).
     * @returns A promise that resolves to an array of animal names (trimmed) or null if the user cancels at any point.
     */
    public async promptForAnimalNames(connectionId: string, promptMessage: string, isValidation: boolean): Promise<string[] | null> {
        const animalNames: string[] = [];
        for (let i = 1; i <= AUTH.REQUIRED_ANIMALS; i++) {
            const animalName = await vscode.window.showInputBox({
                prompt: `${promptMessage} (${i}/${AUTH.REQUIRED_ANIMALS})`,
                placeHolder: 'e.g., Elephant',
                ignoreFocusOut: true, // Keep prompt open even if focus moves
                password: false // Ensure input is visible
            });

            if (animalName === undefined) {
                // User cancelled (Escape key or closed the prompt)
                return null;
            }

            const trimmedName = animalName.trim();
            if (!trimmedName) {
                // User entered empty string - treat as cancellation or prompt again? Treat as cancel for simplicity.
                // Alternatively, could show an error and re-prompt for the same step.
                vscode.window.showWarningMessage('Animal name cannot be empty. Authentication cancelled.');
                return null;
            }

            animalNames.push(trimmedName);
        }
        return animalNames;
    }
}
