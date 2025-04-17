// jest.config.js
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: "ts-jest", // Use the ts-jest preset
    testEnvironment: "node", // Specify the test environment (node is common for backend/CLI)
    testMatch: [
        // Patterns Jest uses to detect test files
        "**/test/**/*.test.ts", // Look for .test.ts files in any 'test' subdirectory
        "**/?(*.)+(spec|test).ts", // Look for .spec.ts or .test.ts files anywhere
    ],
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"], // File extensions Jest should handle
    // Optional: If you use path aliases in tsconfig.json, configure moduleNameMapper
    // moduleNameMapper: {
    //   '^@/(.*)$': '<rootDir>/src/$1', // Example alias
    // },
    // Optional: Configure coverage reporting
    // collectCoverage: true,
    // coverageDirectory: "coverage",
    // coverageProvider: "v8", // or "babel"
};
