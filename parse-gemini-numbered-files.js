/**
 * Gemini Test Output Parser for Numbered Files
 * 
 * This script parses test files from Gemini's output files (gem1, gem2, etc.)
 * and saves them to the appropriate locations.
 * 
 * Usage: node parse-gemini-numbered-files.js
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
    // Look for gem1, gem2, etc. files in the current directory
    const files = fs.readdirSync('.');
    const gemFiles = files.filter(file => /^gem\d+$/.test(file));
    
    if (gemFiles.length === 0) {
        console.error('No gem files found. Please make sure files named gem1, gem2, etc. exist in the current directory.');
        process.exit(1);
    }
    
    console.log(`Found ${gemFiles.length} gem files: ${gemFiles.join(', ')}`);
    
    // Process each gem file
    gemFiles.forEach(file => {
        processFile(file);
    });
    
    console.log('Done!');
}

main();
