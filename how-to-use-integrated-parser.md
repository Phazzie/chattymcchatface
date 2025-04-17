# How to Use the Integrated Test Parser

I've integrated the Gemini test parser into our code quality scripts. This guide explains how to use it to extract test files from Gemini's output files (gem1, gem2, etc., gem9, and untitled6).

## Step 1: Ensure Gemini's Output Files Are in the Right Location

1. Make sure all the files Gemini created (gem1, gem2, etc., gem9, untitled6) are in the project root directory.

2. Verify that these files contain the special markers:
   ```
   ### TEST_FILE: src/test/auth/authService.test.ts
   // Test content here...
   ### END_TEST_FILE
   ```

## Step 2: Run the Parser Script

1. Open a terminal in your project directory

2. Run the parser using npm:
   ```
   npm run parse-tests
   ```

3. The script will automatically:
   - Find all files named gem1, gem2, etc., gem9, and untitled6 in the current directory
   - Extract test files from each one
   - Save them to the appropriate locations

4. If you want to process additional files, you can specify them as arguments:
   ```
   npm run parse-tests -- additional-file1 additional-file2
   ```

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

## Running SOLID Checks

You can also run the SOLID checker to identify code quality issues:

```
npm run check-solid
```

This will analyze your codebase for SOLID violations and file length issues, helping you identify areas that need refactoring.
