# File Sharing System Tests for ChattyMcChatface

I need you to create comprehensive tests for the file sharing system (Step 5) of ChattyMcChatface, a VS Code extension that enables peer-to-peer chat between VS Code instances. The file sharing system will allow users to send and receive files.

## Requirements

1. Follow Test-Driven Development (TDD) principles
2. Ensure tests encourage SOLID principles in implementation
3. Implementation files should be ≤80 lines
4. Mock all external dependencies
5. Cover all edge cases and error scenarios

## File Sharing System Overview

The file sharing system will consist of:

1. **FileService**: Handles file operations (selection, reading, writing)
2. **FileTransferProtocol**: Manages the file transfer protocol messages
3. **FileUI**: Handles user interface for file sharing
4. **Integration with NetworkManager**: For sending/receiving file chunks

## Test Structure

For each component, provide:
- Setup with proper mocking
- Multiple test cases covering normal and edge cases
- Clear assertions
- Cleanup if necessary

## Special Output Format

Format your output with special markers so my parser can extract the test files:

```
### TEST_FILE: src/test/fileSharing/fileService.test.ts
// Test content here...
### END_TEST_FILE

### TEST_FILE: src/test/fileSharing/fileTransferProtocol.test.ts
// Test content here...
### END_TEST_FILE
```

## Example Test Pattern

Here's an example from an existing test file:

```typescript
import { Socket } from 'net';
import { AuthHandler } from '../../auth/authHandler';

describe('AuthHandler', () => {
    let authHandler: AuthHandler;
    let mockSocket: jest.Mocked<Socket>;
    
    beforeEach(() => {
        mockSocket = {
            on: jest.fn(),
            off: jest.fn(),
            write: jest.fn(),
            // Other methods...
        } as any;
        
        authHandler = new AuthHandler(mockSocket);
    });
    
    describe('cleanup', () => {
        it('should remove all event listeners', () => {
            authHandler.cleanup();
            expect(mockSocket.off).toHaveBeenCalledWith('error', expect.any(Function));
        });
    });
    
    // More tests...
});
```

## Required Test Files

Please create the following test files:

1. `src/test/fileSharing/fileService.test.ts`
   - Tests for file selection, reading, writing
   - Handling large files
   - Error scenarios (file not found, permission issues)

2. `src/test/fileSharing/fileTransferProtocol.test.ts`
   - Protocol message format and validation
   - Chunking and reassembly
   - Progress tracking
   - Error handling and recovery

3. `src/test/fileSharing/fileUI.test.ts`
   - UI interactions
   - Progress display
   - Error messages
   - Confirmation dialogs

4. `src/test/fileSharing/integration.test.ts`
   - End-to-end file transfer tests
   - Integration with NetworkManager
   - Multiple file transfers
   - Cancellation scenarios

## File Sharing Protocol Details

The file sharing protocol should include these message types:
- FILE_TRANSFER_REQUEST: Initiates a file transfer
- FILE_TRANSFER_ACCEPT: Accepts a file transfer
- FILE_TRANSFER_REJECT: Rejects a file transfer
- FILE_CHUNK: Contains a chunk of file data
- FILE_TRANSFER_PROGRESS: Reports transfer progress
- FILE_TRANSFER_COMPLETE: Indicates transfer completion
- FILE_TRANSFER_ERROR: Reports transfer errors
- FILE_TRANSFER_CANCEL: Cancels an ongoing transfer

Each message should include appropriate metadata (file name, size, chunk index, etc.).

Thank you for your help in creating these tests!
