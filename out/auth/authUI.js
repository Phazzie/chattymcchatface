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
exports.AuthUI = void 0;
const vscode = __importStar(require("vscode"));
const constants_1 = require("../constants");
/**
 * Handles the VS Code UI interactions for authentication, specifically prompting for animal names.
 */
class AuthUI {
    /**
     * Creates an instance of AuthUI.
     * @param authService The authentication service to interact with.
     */
    constructor(authService) {
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
    async handlePromptRequest(connectionId, promptMessage, isValidation) {
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
    async promptForAnimalNames(connectionId, promptMessage, isValidation) {
        const animalNames = [];
        for (let i = 1; i <= constants_1.AUTH.REQUIRED_ANIMALS; i++) {
            const animalName = await vscode.window.showInputBox({
                prompt: `${promptMessage} (${i}/${constants_1.AUTH.REQUIRED_ANIMALS})`,
                placeHolder: 'e.g., Elephant',
                ignoreFocusOut: true,
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
exports.AuthUI = AuthUI;
//# sourceMappingURL=authUI.js.map