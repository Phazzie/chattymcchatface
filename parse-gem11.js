const fs = require("fs");
const path = require("path");

// Configuration
const INPUT_FILE = "gem11.txt";
const TEST_MARKER_START = "TEST_FILE:";
const TEST_MARKER_END = "";

// Read the input file
try {
    const content = fs.readFileSync(INPUT_FILE, "utf8");
    console.log(`Successfully read ${INPUT_FILE}`);

    // Parse test files
    const parseTestFiles = (content) => {
        const testFiles = [];
        let currentFile = null;
        let currentContent = [];
        let inTestFile = false;

        // Split content by lines
        const lines = content.split("\n");

        for (const line of lines) {
            if (line.trim().startsWith(TEST_MARKER_START)) {
                // Start of a new test file
                let filePath = line.trim().substring(TEST_MARKER_START.length).trim();
                // Remove any spaces in the file path
                filePath = filePath.replace(/\s+/g, "");
                currentFile = filePath;
                currentContent = [];
                inTestFile = true;
                console.log(`Found file marker: ${filePath}`);
            } else if (line.trim().startsWith(TEST_MARKER_START) && inTestFile) {
                // End of previous file and start of a new one
                testFiles.push({
                    path: currentFile,
                    content: currentContent.join("\n"),
                });
                console.log(`End of file: ${currentFile}`);

                // Start new file
                let filePath = line.trim().substring(TEST_MARKER_START.length).trim();
                // Remove any spaces in the file path
                filePath = filePath.replace(/\s+/g, "");
                currentFile = filePath;
                currentContent = [];
                console.log(`Found file marker: ${filePath}`);
            } else if (inTestFile) {
                // Content of a test file
                currentContent.push(line);
            }
        }

        // Don't forget the last file if we're still processing one
        if (inTestFile && currentFile) {
            testFiles.push({
                path: currentFile,
                content: currentContent.join("\n"),
            });
            console.log(`End of file: ${currentFile}`);
        }

        return testFiles;
    };

    // Save test files
    const saveTestFiles = (testFiles) => {
        for (const file of testFiles) {
            const filePath = file.path;
            const dirPath = path.dirname(filePath);

            // Create directory if it doesn't exist
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                console.log(`Created directory: ${dirPath}`);
            }

            // Write file
            fs.writeFileSync(filePath, file.content);
            console.log(`Created file: ${filePath}`);
        }
    };

    // Main function
    const main = () => {
        console.log(`Parsing test files from ${INPUT_FILE}...`);
        const testFiles = parseTestFiles(content);
        console.log(`Found ${testFiles.length} test files.`);
        saveTestFiles(testFiles);
        console.log("Done!");
    };

    // Run the script
    main();
} catch (error) {
    console.error(`Error processing ${INPUT_FILE}:`, error.message);
}
