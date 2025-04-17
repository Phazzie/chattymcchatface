import * as vscode from 'vscode';

/**
 * Code action provider that detects duplicated code blocks
 */
export class DRYCodeActionProvider implements vscode.CodeActionProvider {
    /**
     * Provide code actions for the given document
     */
    provideCodeActions(document: vscode.TextDocument): vscode.CodeAction[] {
        const text = document.getText();
        const actions: vscode.CodeAction[] = [];
        
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
                    if (matchingLines >= 5) break;
                }
                
                if (matchingLines >= 3) {
                    const startPos1 = new vscode.Position(i, 0);
                    const endPos1 = new vscode.Position(i + matchingLines, 0);
                    const range1 = new vscode.Range(startPos1, endPos1);
                    
                    const startPos2 = new vscode.Position(j, 0);
                    const endPos2 = new vscode.Position(j + matchingLines, 0);
                    const range2 = new vscode.Range(startPos2, endPos2);
                    
                    const action = new vscode.CodeAction(
                        `DRY: Duplicate code block (${matchingLines} lines)`,
                        vscode.CodeActionKind.Refactor
                    );
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
    private areSimilarLines(line1: string, line2: string): boolean {
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
    private getLinePattern(line: string): string {
        // Replace identifiers with placeholders
        // This is a simplified approach
        return line
            .replace(/[a-zA-Z_][a-zA-Z0-9_]*/g, 'ID')
            .replace(/\s+/g, ' ')
            .replace(/"[^"]*"/g, 'STR')
            .replace(/'[^']*'/g, 'STR');
    }
}
