/**
 * Enhanced Gemini Test Output Parser
 * 
 * This script parses test files from all possible Gemini output files:
 * - gem1, gem2, etc.
 * - gem9 (if it exists)
 * - untitled6 (if it exists)
 * - Any other files specified as command line arguments
 * 
 * Usage: node scripts/parse-gemini-tests.js [additional-files...]
 */

const fs = require('fs');
const path = require('path');

// Configuration
const TEST_MARKER_START = '### TEST_FILE:';
const TEST_MARKER_END = '### END_TEST_FILE';
const DEFAULT_TEST_DIR = 'src/test';

/**
 * Parse test files from Gemini's output
 * @param {string} content - The content to parse
 * @returns {Array<{path: string, content: string}>} - Array of test files
 */
function parseTestFiles(content) {
    const testFiles = [];
    const lines = content.split('\n');
    
    let currentFile = null;
    let currentContent = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (line.startsWith(TEST_MARKER_START)) {
            // Start of a new test file
            if (currentFile) {
                // Save the previous file
                testFiles.push({
                    path: currentFile,
                    content: currentContent.join('\n')
                });
            }
            
            // Extract the file path
            currentFile = line.substring(TEST_MARKER_START.length).trim();
            currentContent = [];
        } else if (line === TEST_MARKER_END) {
            // End of the current test file
            if (currentFile) {
                testFiles.push({
                    path: currentFile,
                    content: currentContent.join('\n')
                });
                currentFile = null;
                currentContent = [];
            }
        } else if (currentFile) {
            // Add line to current file content
            currentContent.push(line);
        }
    }
    
    // Handle the case where the file ends without a TEST_MARKER_END
    if (currentFile) {
        testFiles.push({
            path: currentFile,
            content: currentContent.join('\n')
        });
    }
    
    return testFiles;
}

/**
 * Save test files to disk
 * @param {Array<{path: string, content: string}>} testFiles - Array of test files
 */
function saveTestFiles(testFiles) {
    testFiles.forEach(file => {
        const filePath = file.path;
        const dirPath = path.dirname(filePath);
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        
        // Write file
        fs.writeFileSync(filePath, file.content);
        console.log(`Saved test file: ${filePath}`);
    });
}

/**
 * Process a single Gemini output file
 * @param {string} filePath - Path to the Gemini output file
 */
function processFile(filePath) {
    console.log(`Processing ${filePath}...`);
    
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`File ${filePath} does not exist, skipping.`);
            return;
        }
        
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Parse test files
        const testFiles = parseTestFiles(content);
        console.log(`Found ${testFiles.length} test files in ${filePath}`);
        
        // Save test files
        saveTestFiles(testFiles);
    } catch (error) {
        console.error(`Error processing ${filePath}: ${error.message}`);
    }
}

/**
 * Main function
 */
function main() {
    // Get additional files from command line arguments
    const additionalFiles = process.argv.slice(2);
    
    // Look for gem1, gem2, etc. files in the current directory
    const files = fs.readdirSync('.');
    const gemFiles = files.filter(file => /^gem\d+$/.test(file));
    
    // Add specific files we want to check
    const specificFiles = ['gem9', 'untitled6'];
    
    // Combine all files to process
    const allFiles = [...gemFiles, ...specificFiles, ...additionalFiles];
    const uniqueFiles = [...new Set(allFiles)]; // Remove duplicates
    
    if (uniqueFiles.length === 0) {
        console.error('No files to process. Please make sure files named gem1, gem2, etc., gem9, or untitled6 exist in the current directory, or specify files as command line arguments.');
        process.exit(1);
    }
    
    console.log(`Found ${uniqueFiles.length} files to process: ${uniqueFiles.join(', ')}`);
    
    // Process each file
    uniqueFiles.forEach(file => {
        processFile(file);
    });
    
    console.log('Done!');
}

// If this script is run directly, execute main()
if (require.main === module) {
    main();
}

// Export functions for use in other scripts
module.exports = {
    parseTestFiles,
    saveTestFiles,
    processFile
};
