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
exports.DRYCodeActionProvider = void 0;
const vscode = __importStar(require("vscode"));
/**
 * Code action provider that detects duplicated code blocks
 */
class DRYCodeActionProvider {
    /**
     * Provide code actions for the given document
     */
    provideCodeActions(document) {
        const text = document.getText();
        const actions = [];
        // Split the document into lines
        const lines = text.split('\n');
        // Look for blocks of 3+ identical or similar lines
        // This is a simplified approach - real duplication detection is more complex
        for (let i = 0; i < lines.length - 3; i++) {
            for (let j = i + 3; j < lines.length - 3; j++) {
                // Check if we have 3+ identical or very similar lines
                let matchingLines = 0;
                while (j + matchingLines < lines.length &&
                    this.areSimilarLines(lines[i + matchingLines], lines[j + matchingLines])) {
                    matchingLines++;
                    // Don't check too many lines to keep performance reasonable
                    if (matchingLines >= 5)
                        break;
                }
                if (matchingLines >= 3) {
                    const startPos1 = new vscode.Position(i, 0);
                    const endPos1 = new vscode.Position(i + matchingLines, 0);
                    const range1 = new vscode.Range(startPos1, endPos1);
                    const startPos2 = new vscode.Position(j, 0);
                    const endPos2 = new vscode.Position(j + matchingLines, 0);
                    const range2 = new vscode.Range(startPos2, endPos2);
                    const action = new vscode.CodeAction(`DRY: Duplicate code block (${matchingLines} lines)`, vscode.CodeActionKind.Refactor);
                    action.command = {
                        command: 'chattymcchatface.extractDuplicateCode',
                        title: 'Extract Duplicate Code',
                        arguments: [document.uri, [range1, range2]]
                    };
                    actions.push(action);
                    // Skip ahead to avoid overlapping matches
                    i += matchingLines - 1;
                    break;
                }
            }
        }
        return actions;
    }
    /**
     * Check if two lines are similar enough to be considered duplicates
     * This is a simple implementation - a real one would be more sophisticated
     */
    areSimilarLines(line1, line2) {
        // Ignore whitespace differences
        const trimmed1 = line1.trim();
        const trimmed2 = line2.trim();
        // Exact match
        if (trimmed1 === trimmed2) {
            return true;
        }
        // Very similar (e.g., only variable names differ)
        // This is a simplified check - real implementation would be more sophisticated
        if (trimmed1.length > 0 && trimmed2.length > 0) {
            // Check if the lines have the same structure ignoring variable names
            const pattern1 = this.getLinePattern(trimmed1);
            const pattern2 = this.getLinePattern(trimmed2);
            return pattern1 === pattern2;
        }
        return false;
    }
    /**
     * Get a pattern representation of a line, ignoring specific identifiers
     */
    getLinePattern(line) {
        // Replace identifiers with placeholders
        // This is a simplified approach
        return line
            .replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, 'ID')
            .replace(/\s+/g, ' ')
            .replace(/"[^"]*"/g, 'STR')
            .replace(/'[^']*'/g, 'STR');
    }
}
exports.DRYCodeActionProvider = DRYCodeActionProvider;
//# sourceMappingURL=duplicationProvider.js.map