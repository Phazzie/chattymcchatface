/**
 * Reporter for the SOLID checker
 */

/**
 * @implements {import('./interfaces').IReporter}
 */
class Reporter {
    /**
     * @param {import('./interfaces').IAnalyzer} analyzer - Analyzer
     */
    constructor(analyzer) {
        this.analyzer = analyzer;
        this.colors = {
            reset: '\x1b[0m',
            red: '\x1b[31m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            magenta: '\x1b[35m',
            cyan: '\x1b[36m',
            white: '\x1b[37m'
        };
    }

    /**
     * Report violations
     * @param {import('./interfaces').FileResult[]} results - File results
     */
    reportViolations(results) {
        console.log(`${this.colors.magenta}Files with SOLID violations or length issues:${this.colors.reset}\n`);
        
        results.forEach((result, index) => {
            console.log(`${this.colors.cyan}${index + 1}. ${result.path}${this.colors.reset}`);
            console.log(`   Lines: ${result.lineCount}${result.tooLong ? 
                ` ${this.colors.red}(exceeds limit)${this.colors.reset}` : ''}`);
            
            if (result.violations.length > 0) {
                console.log(`   Violations: ${result.violations.length}`);
                
                // Group violations by principle
                const byPrinciple = this.analyzer.groupByPrinciple(result.violations);
                
                console.log('   Breakdown:');
                Object.keys(byPrinciple).forEach(principle => {
                    console.log(`     - ${principle}: ${byPrinciple[principle]}`);
                });
                
                // Show most critical violation
                if (result.violations.length > 0) {
                    const critical = result.violations[0];
                    console.log(`   Critical issue: ${this.colors.yellow}${critical.message}${this.colors.reset} (${critical.rule})`);
                }
            }
            
            console.log('');
        });
    }

    /**
     * Report ROI ranking
     * @param {import('./interfaces').FileResult[]} results - File results
     */
    reportROI(results) {
        console.log(`${this.colors.magenta}Files ranked by Return on Investment (ROI):${this.colors.reset}\n`);
        
        results.forEach((result, index) => {
            console.log(`${this.colors.cyan}${index + 1}. ${result.path}${this.colors.reset}`);
            console.log(`   ROI Score: ${(result.roi * 100).toFixed(2)}`);
            console.log(`   Estimated hours to fix: ${Math.ceil(result.violations.length / 3)}`);
            console.log(`   Impact score: ${Math.min(10, Math.ceil(result.violations.length / 2))}/10`);
            
            // Generate recommendation
            const recommendation = this.analyzer.generateRecommendation(result);
            console.log(`   Recommendation: ${this.colors.green}${recommendation}${this.colors.reset}`);
            console.log('');
        });
    }
}

module.exports = Reporter;
