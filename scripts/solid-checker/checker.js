/**
 * Main checker class for the SOLID checker
 */

/**
 * SOLID Checker
 */
class SOLIDChecker {
    /**
     * @param {import('./interfaces').IFileSystem} fileSystem - File system
     * @param {import('./interfaces').ILinter} linter - Linter
     * @param {import('./interfaces').IAnalyzer} analyzer - Analyzer
     * @param {import('./interfaces').IReporter} reporter - Reporter
     */
    constructor(fileSystem, linter, analyzer, reporter) {
        this.fileSystem = fileSystem;
        this.linter = linter;
        this.analyzer = analyzer;
        this.reporter = reporter;
    }

    /**
     * Run the checker
     * @param {string} directory - Directory to check
     */
    run(directory) {
        console.log('\nChecking for SOLID violations and file length issues...\n');
        
        // Get all files
        const files = this.fileSystem.getAllFiles(directory);
        const results = [];
        
        // Check each file
        files.forEach(file => {
            const lengthCheck = this.fileSystem.checkFileLength(file);
            const violations = this.linter.getViolations(file);
            
            if (lengthCheck.tooLong || violations.length > 0) {
                results.push({
                    path: file,
                    lineCount: lengthCheck.lineCount,
                    tooLong: lengthCheck.tooLong,
                    violations: violations
                });
            }
        });
        
        // No issues found
        if (results.length === 0) {
            console.log('No SOLID violations or file length issues found!');
            return;
        }
        
        // Report results
        const byViolations = this.analyzer.rankByViolations(results);
        this.reporter.reportViolations(byViolations);
        
        const byROI = this.analyzer.rankByROI(results);
        this.reporter.reportROI(byROI);
    }
}

module.exports = SOLIDChecker;
