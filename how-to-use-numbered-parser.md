# How to Use the Numbered Files Parser

This guide explains how to use the parser script to extract test files from Gemini's numbered output files (gem1, gem2, etc.).

## Step 1: Ensure Gemini's Output Files Are in the Right Location

1. Make sure all the files Gemini created (gem1, gem2, etc.) are in the project root directory.

2. Verify that these files contain the special markers:
   ```
   ### TEST_FILE: src/test/auth/authService.test.ts
   // Test content here...
   ### END_TEST_FILE
   ```

## Step 2: Run the Parser Script

1. Open a terminal in your project directory

2. Run the parser:
   ```
   node parse-gemini-numbered-files.js
   ```

3. The script will automatically:
   - Find all files named gem1, gem2, etc. in the current directory
   - Extract test files from each one
   - Save them to the appropriate locations

## Step 3: Verify the Results

1. Check that the test files have been created in the correct locations:
   - Authentication tests should be in `src/test/auth/`
   - File sharing tests should be in `src/test/fileSharing/`

2. Review the generated tests and make any necessary adjustments

## Troubleshooting

If you encounter any issues:

1. **No gem files found**: Make sure the files are named exactly gem1, gem2, etc. (no file extension) and are in the project root directory

2. **No test files found**: Check that Gemini's output includes the special markers:
   ```
   ### TEST_FILE: path/to/file.ts
   // Test content
   ### END_TEST_FILE
   ```

3. **Error creating directories**: Make sure you have write permissions for the project directory

## Next Steps

After extracting the tests:

1. Review the test files to ensure they meet your requirements
2. Start implementing the components based on the tests
3. Run the tests as you implement to ensure your code meets the requirements
