/**
 * File system operations for the SOLID checker
 */
const fs = require('fs');
const path = require('path');

/**
 * @implements {import('./interfaces').IFileSystem}
 */
class FileSystem {
    /**
     * @param {import('./interfaces').IConfig} config
     */
    constructor(config) {
        this.config = config;
    }

    /**
     * Check if a file should be excluded based on patterns
     * @param {string} filePath - File path
     * @returns {boolean} Whether the file should be excluded
     */
    shouldExclude(filePath) {
        return this.config.excludePatterns.some(pattern => pattern.test(filePath));
    }

    /**
     * Get all TypeScript and JavaScript files in the project
     * @param {string} dir - Directory to search
     * @param {string[]} [fileList=[]] - Accumulated file list
     * @returns {string[]} List of file paths
     */
    getAllFiles(dir, fileList = []) {
        const files = fs.readdirSync(dir);
        
        files.forEach(file => {
            const filePath = path.join(dir, file);
            
            if (this.shouldExclude(filePath)) {
                return;
            }
            
            if (fs.statSync(filePath).isDirectory()) {
                this.getAllFiles(filePath, fileList);
            } else if (filePath.endsWith('.ts') || filePath.endsWith('.js')) {
                fileList.push(filePath);
            }
        });
        
        return fileList;
    }

    /**
     * Check file length
     * @param {string} filePath - File path
     * @returns {import('./interfaces').FileInfo} File info
     */
    checkFileLength(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        return {
            path: filePath,
            lineCount: lines.length,
            tooLong: lines.length > this.config.maxFileLength
        };
    }
}

module.exports = FileSystem;
