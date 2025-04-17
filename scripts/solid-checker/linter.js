/**
 * Linter for the SOLID checker
 */
const { execSync } = require('child_process');

/**
 * @implements {import('./interfaces').ILinter}
 */
class Linter {
    /**
     * Get SOLID violations for a file
     * @param {string} filePath - File path
     * @returns {import('./interfaces').Violation[]} List of violations
     */
    getViolations(filePath) {
        try {
            const output = execSync(`npx eslint ${filePath} --format json`, 
                { encoding: 'utf8' });
            const results = JSON.parse(output);
            
            if (results.length === 0) {
                return [];
            }
            
            const violations = results[0].messages.filter(msg => {
                // Filter for SOLID-related rules
                return (
                    msg.ruleId === '0/single-responsibility' ||
                    msg.ruleId === '0/interface-segregation' ||
                    msg.ruleId === '0/dependency-inversion' ||
                    msg.ruleId === 'max-lines' ||
                    msg.ruleId === 'max-lines-per-function' ||
                    msg.ruleId === 'complexity' ||
                    msg.ruleId === 'max-depth' ||
                    msg.ruleId === 'max-params' ||
                    msg.ruleId === 'sonarjs/no-identical-functions' ||
                    msg.ruleId === '@typescript-eslint/no-explicit-any' ||
                    msg.ruleId === 'no-new'
                );
            });
            
            return violations.map(v => ({
                rule: v.ruleId,
                message: v.message,
                line: v.line,
                column: v.column
            }));
        } catch (error) {
            console.error(`Error running ESLint on ${filePath}:`, error.message);
            return [];
        }
    }
}

module.exports = Linter;
