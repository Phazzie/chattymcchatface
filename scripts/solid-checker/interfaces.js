/**
 * Interfaces for the SOLID checker components
 */

/**
 * @typedef {Object} FileInfo
 * @property {string} path - File path
 * @property {number} lineCount - Number of lines in the file
 * @property {boolean} tooLong - Whether the file exceeds the maximum length
 */

/**
 * @typedef {Object} Violation
 * @property {string} rule - ESLint rule ID
 * @property {string} message - Violation message
 * @property {number} line - Line number
 * @property {number} column - Column number
 */

/**
 * @typedef {Object} FileResult
 * @property {string} path - File path
 * @property {number} lineCount - Number of lines in the file
 * @property {boolean} tooLong - Whether the file exceeds the maximum length
 * @property {Violation[]} violations - List of violations
 * @property {number} [roi] - Return on Investment score
 */

/**
 * @typedef {Object} IFileSystem
 * @property {function(string): string[]} getAllFiles - Get all files in a directory
 * @property {function(string): FileInfo} checkFileLength - Check file length
 */

/**
 * @typedef {Object} ILinter
 * @property {function(string): Violation[]} getViolations - Get violations for a file
 */

/**
 * @typedef {Object} IAnalyzer
 * @property {function(FileResult[]): FileResult[]} rankByViolations - Rank files by violation count
 * @property {function(FileResult[]): FileResult[]} rankByROI - Rank files by ROI
 */

/**
 * @typedef {Object} IReporter
 * @property {function(FileResult[]): void} reportViolations - Report violations
 * @property {function(FileResult[]): void} reportROI - Report ROI ranking
 */

/**
 * @typedef {Object} IConfig
 * @property {number} maxFileLength - Maximum file length
 * @property {RegExp[]} excludePatterns - Patterns to exclude
 */

module.exports = {
    // Just exports the typedefs for documentation
};
