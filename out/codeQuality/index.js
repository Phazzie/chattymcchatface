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
exports.registerCodeQualityProviders = void 0;
const vscode = __importStar(require("vscode"));
const duplicationProvider_1 = require("./dry/duplicationProvider");
/**
 * Register all code quality providers
 */
function registerCodeQualityProviders(context) {
    // Register DRY code duplication provider
    context.subscriptions.push(vscode.languages.registerCodeActionProvider({ pattern: '**/*.{ts,js}' }, new duplicationProvider_1.DRYCodeActionProvider(), { providedCodeActionKinds: [vscode.CodeActionKind.Refactor] }));
    // Register command to handle the code action
    context.subscriptions.push(vscode.commands.registerCommand('chattymcchatface.extractDuplicateCode', handleExtractDuplicateCode));
}
exports.registerCodeQualityProviders = registerCodeQualityProviders;
/**
 * Handle the extract duplicate code command
 */
async function handleExtractDuplicateCode(uri, ranges) {
    try {
        const document = await vscode.workspace.openTextDocument(uri);
        // Get the duplicated code from the first range
        const duplicatedCode = document.getText(ranges[0]);
        // Create a webview panel to show the suggestion
        const panel = vscode.window.createWebviewPanel('dryRefactoring', 'DRY: Extract Duplicate Code', vscode.ViewColumn.Beside, { enableScripts: true });
        // Generate a method name suggestion based on the code
        const methodName = suggestMethodName(duplicatedCode);
        // Create the webview content
        panel.webview.html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>DRY: Extract Duplicate Code</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        padding: 20px;
                    }
                    pre {
                        background-color: var(--vscode-editor-background);
                        padding: 10px;
                        border-radius: 5px;
                        overflow: auto;
                    }
                    .suggestion {
                        margin-top: 20px;
                        padding: 10px;
                        background-color: var(--vscode-editor-inactiveSelectionBackground);
                        border-radius: 5px;
                    }
                </style>
            </head>
            <body>
                <h1>DRY Principle: Don't Repeat Yourself</h1>
                
                <p>Duplicated code was detected in your file. Consider extracting this code into a reusable method:</p>
                
                <h2>Duplicated Code:</h2>
                <pre>${escapeHtml(duplicatedCode)}</pre>
                
                <div class="suggestion">
                    <h2>Suggestion:</h2>
                    <p>Extract this code into a method named <code>${methodName}</code>:</p>
                    <pre>
function ${methodName}() {
${duplicatedCode.split('\n').map(line => '    ' + line).join('\n')}
}
                    </pre>
                    
                    <p>Then replace each occurrence with a call to this method.</p>
                </div>
                
                <h2>Why This Matters:</h2>
                <ul>
                    <li><strong>Maintainability:</strong> When you need to change this logic, you only need to change it in one place.</li>
                    <li><strong>Readability:</strong> Your code becomes more concise and easier to understand.</li>
                    <li><strong>Bug Prevention:</strong> Fixes in one place automatically apply to all occurrences.</li>
                </ul>
            </body>
            </html>
        `;
    }
    catch (error) {
        vscode.window.showErrorMessage(`Error processing duplicate code: ${error}`);
    }
}
/**
 * Suggest a method name based on the code content
 */
function suggestMethodName(code) {
    // This is a simplified implementation
    // A real implementation would analyze the code more thoroughly
    // Look for common patterns that might indicate purpose
    if (code.includes('if') && code.includes('return')) {
        return 'validateCondition';
    }
    if (code.includes('fetch') || code.includes('http')) {
        return 'fetchData';
    }
    if (code.includes('log') || code.includes('console')) {
        return 'logInformation';
    }
    // Default to a generic name
    return 'extractedMethod';
}
/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
//# sourceMappingURL=index.js.map