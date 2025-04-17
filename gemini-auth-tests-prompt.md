# Authentication System Tests for ChattyMcChatface

I need you to create comprehensive tests for the authentication system of ChattyMcChatface, a VS Code extension that enables peer-to-peer chat between VS Code instances. The authentication system uses a challenge-response mechanism with animal names.

## Requirements

1. Follow Test-Driven Development (TDD) principles
2. Ensure tests encourage SOLID principles in implementation
3. Implementation files should be ≤80 lines
4. Mock all external dependencies
5. Cover all edge cases and error scenarios

## Authentication System Overview

The authentication system consists of:

1. **AuthService**: Manages the authentication process and state
2. **AuthUI**: Handles user input for authentication
3. **Protocol Messages**: AUTH_REQ, AUTH_RESP, AUTH_SUCCESS, AUTH_FAIL

## Test Structure

For each component, provide:
- Setup with proper mocking
- Multiple test cases covering normal and edge cases
- Clear assertions
- Cleanup if necessary

## Special Output Format

Format your output with special markers so my parser can extract the test files:

```
### TEST_FILE: src/test/auth/authService.test.ts
// Test content here...
### END_TEST_FILE

### TEST_FILE: src/test/auth/authUI.test.ts
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

1. `src/test/auth/authService.test.ts`
2. `src/test/auth/authUI.test.ts`
3. `src/test/auth/authProtocol.test.ts`
4. `src/test/auth/integration.test.ts`

Each test file should thoroughly test its respective component, including:
- State transitions
- Error handling
- Input validation
- Event handling
- Protocol message processing

Thank you for your help in creating these tests!
