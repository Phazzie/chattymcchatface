/**
 * Entry point for the SOLID checker
 *
 * This script checks for SOLID violations and file length issues in the codebase.
 * It follows SOLID principles itself:
 * - Single Responsibility: Each class has one responsibility
 * - Open/Closed: Extensible through interfaces
 * - Liskov Substitution: Components are interchangeable
 * - Interface Segregation: Focused interfaces
 * - Dependency Inversion: Dependencies injected
 */

// Import dependencies
const config = require("./solid-checker/config");
const FileSystem = require("./solid-checker/file-system");
const Linter = require("./solid-checker/linter");
const Analyzer = require("./solid-checker/analyzer");
const Reporter = require("./solid-checker/reporter");
const SOLIDChecker = require("./solid-checker/checker");
const geminiParser = require("./parse-gemini-tests");

// Process command line arguments
const args = process.argv.slice(2);
const command = args[0] || "check-solid";

// Main function to handle different commands
async function main() {
    switch (command) {
        case "parse-tests":
            console.log("Parsing Gemini test files...");
            // Look for gem1, gem2, etc. files in the current directory
            const files = require("fs").readdirSync(".");
            const gemFiles = files.filter((file) => /^gem\d+$/.test(file));
            const specificFiles = ["gem9", "untitled6"];
            const filesToProcess = [...gemFiles, ...specificFiles, ...args.slice(1)];

            if (filesToProcess.length === 0) {
                console.error(
                    "No files to process. Please make sure files named gem1, gem2, etc. exist."
                );
                process.exit(1);
            }

            filesToProcess.forEach((file) => {
                geminiParser.processFile(file);
            });
            break;

        case "check-solid":
        default:
            console.log("Running SOLID checker...");
            // Create instances
            const fileSystem = new FileSystem(config);
            const linter = new Linter();
            const analyzer = new Analyzer();
            const reporter = new Reporter(analyzer);

            // Create and run the checker
            const checker = new SOLIDChecker(fileSystem, linter, analyzer, reporter);
            checker.run("src");
            break;
    }
}

// Run the main function
main().catch((error) => {
    console.error("Error:", error);
    process.exit(1);
});
