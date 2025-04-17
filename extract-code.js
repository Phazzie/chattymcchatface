const fs = require('fs');
const path = require('path');

// Configuration
const INPUT_FILE = 'gem11.txt';
const CODE_BLOCK_START = '```typescript';
const CODE_BLOCK_END = '```';
const FILE_PATH_PATTERN = /TEST_FILE:\s*([\w\/\.]+)/;

// Read the input file
try {
    const content = fs.readFileSync(INPUT_FILE, 'utf8');
    console.log(`Successfully read ${INPUT_FILE}`);

    // Parse code blocks
    const parseCodeBlocks = (content) => {
        const codeBlocks = [];
        let inCodeBlock = false;
        let currentPath = null;
        let currentContent = [];
        let lineBeforeCodeBlock = '';

        // Split content by lines
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Check for file path pattern in the line before a code block
            if (line.startsWith(CODE_BLOCK_START)) {
                const pathMatch = FILE_PATH_PATTERN.exec(lineBeforeCodeBlock);
                if (pathMatch) {
                    currentPath = pathMatch[1].trim().replace(/\s+/g, '');
                    currentContent = [];
                    inCodeBlock = true;
                    console.log(`Found code block for file: ${currentPath}`);
                }
            } 
            // Check for end of code block
            else if (line === CODE_BLOCK_END && inCodeBlock) {
                codeBlocks.push({
                    path: currentPath,
                    content: currentContent.join('\n')
                });
                inCodeBlock = false;
                currentPath = null;
                console.log(`End of code block`);
            }
            // Collect content if in a code block
            else if (inCodeBlock) {
                // Skip the first line which is usually empty or contains 'typescript'
                if (currentContent.length > 0 || line.trim() !== '' && !line.includes('typescript')) {
                    currentContent.push(lines[i]); // Use original line with indentation
                }
            }
            // Store the current line to check for file path pattern
            else {
                lineBeforeCodeBlock = line;
            }
        }

        return codeBlocks;
    };

    // Save code blocks to files
    const saveCodeBlocks = (codeBlocks) => {
        for (const block of codeBlocks) {
            if (!block.path) {
                console.log('Skipping code block with no path');
                continue;
            }

            const filePath = block.path;
            const dirPath = path.dirname(filePath);

            // Create directory if it doesn't exist
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                console.log(`Created directory: ${dirPath}`);
            }

            // Write file
            fs.writeFileSync(filePath, block.content);
            console.log(`Created file: ${filePath}`);
        }
    };

    // Main function
    const main = () => {
        console.log(`Parsing code blocks from ${INPUT_FILE}...`);
        const codeBlocks = parseCodeBlocks(content);
        console.log(`Found ${codeBlocks.length} code blocks.`);
        saveCodeBlocks(codeBlocks);
        console.log('Done!');
    };

    // Run the script
    main();
} catch (error) {
    console.error(`Error processing ${INPUT_FILE}:`, error.message);
}
