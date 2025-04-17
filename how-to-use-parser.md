# How to Use the Test Parser

This guide explains how to use the parser script to extract test files from Gemini's output.

## Step 1: Get Gemini's Output

1. Send the prompts to Gemini:
   - Use `gemini-auth-tests-prompt.md` for authentication tests
   - Use `gemini-file-sharing-tests-prompt.md` for file sharing tests

2. Save Gemini's responses to files:
   - Save the authentication tests response to `auth-tests.md`
   - Save the file sharing tests response to `file-sharing-tests.md`

## Step 2: Run the Parser Script

1. Open a terminal in your project directory

2. Run the parser on the authentication tests:
   ```
   node parse-gemini-tests.js auth-tests.md
   ```

3. Run the parser on the file sharing tests:
   ```
   node parse-gemini-tests.js file-sharing-tests.md
   ```

## Step 3: Verify the Results

1. Check that the test files have been created in the correct locations:
   - Authentication tests should be in `src/test/auth/`
   - File sharing tests should be in `src/test/fileSharing/`

2. Review the generated tests and make any necessary adjustments

## Troubleshooting

If you encounter any issues:

1. **Parser can't find the file**: Make sure you're running the command from the project root directory

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
