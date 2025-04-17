/**
 * Analyzer for the SOLID checker
 */

/**
 * @implements {import('./interfaces').IAnalyzer}
 */
class Analyzer {
    /**
     * Map rule IDs to SOLID principles
     * @param {string} ruleId - ESLint rule ID
     * @returns {string} SOLID principle
     */
    mapRuleToSOLID(ruleId) {
        const mapping = {
            '0/single-responsibility': 'SRP',
            'max-lines': 'SRP',
            'max-lines-per-function': 'SRP',
            'max-classes-per-file': 'SRP',
            
            '0/interface-segregation': 'ISP',
            '@typescript-eslint/no-empty-interface': 'ISP',
            
            '0/dependency-inversion': 'DIP',
            '@typescript-eslint/no-var-requires': 'DIP',
            'no-new': 'DIP',
            
            '@typescript-eslint/no-explicit-any': 'OCP',
            'sonarjs/no-switch': 'OCP',
            
            '@typescript-eslint/explicit-module-boundary-types': 'LSP',
            '@typescript-eslint/no-non-null-assertion': 'LSP',
            
            'complexity': 'KISS',
            'max-depth': 'KISS',
            'max-params': 'KISS',
            
            'sonarjs/no-identical-functions': 'DRY',
            'sonarjs/no-duplicate-string': 'DRY'
        };
        
        return mapping[ruleId] || 'Other';
    }

    /**
     * Group violations by principle
     * @param {import('./interfaces').Violation[]} violations - List of violations
     * @returns {Object.<string, number>} Violations grouped by principle
     */
    groupByPrinciple(violations) {
        const byPrinciple = {};
        
        violations.forEach(v => {
            const principle = this.mapRuleToSOLID(v.rule);
            byPrinciple[principle] = (byPrinciple[principle] || 0) + 1;
        });
        
        return byPrinciple;
    }

    /**
     * Generate recommendation based on violations
     * @param {import('./interfaces').FileResult} result - File result
     * @returns {string} Recommendation
     */
    generateRecommendation(result) {
        const violations = result.violations;
        
        if (violations.some(v => this.mapRuleToSOLID(v.rule) === 'SRP')) {
            return 'Split into smaller classes with focused responsibilities';
        } else if (violations.some(v => this.mapRuleToSOLID(v.rule) === 'DIP')) {
            return 'Use dependency injection instead of direct instantiation';
        } else if (violations.some(v => this.mapRuleToSOLID(v.rule) === 'OCP')) {
            return 'Replace type checking with polymorphism';
        } else if (violations.some(v => this.mapRuleToSOLID(v.rule) === 'ISP')) {
            return 'Break down large interfaces into smaller, focused ones';
        } else if (violations.some(v => this.mapRuleToSOLID(v.rule) === 'DRY')) {
            return 'Extract duplicated code into reusable methods';
        } else if (result.tooLong) {
            return 'Split file into smaller modules';
        }
        
        return 'Address specific linting issues';
    }

    /**
     * Rank files by violation count
     * @param {import('./interfaces').FileResult[]} results - File results
     * @returns {import('./interfaces').FileResult[]} Ranked results
     */
    rankByViolations(results) {
        return [...results].sort((a, b) => b.violations.length - a.violations.length);
    }

    /**
     * Rank files by ROI (Return on Investment)
     * @param {import('./interfaces').FileResult[]} results - File results
     * @returns {import('./interfaces').FileResult[]} Ranked results
     */
    rankByROI(results) {
        const withROI = results.map(r => ({
            ...r,
            roi: r.violations.length / r.lineCount
        }));
        
        return withROI.sort((a, b) => b.roi - a.roi);
    }
}

module.exports = Analyzer;
