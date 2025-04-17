# ChattyMcChatface Project Checklist

This document outlines the detailed steps for both Gemini's test generation and Claude's refactoring work.

## Gemini's Tasks: Test Generation

### Authentication System Tests
- [ ] Create `src/test/auth/authService.test.ts`
  - [ ] Test state transitions
  - [ ] Test error handling
  - [ ] Test input validation
  - [ ] Test event handling
  - [ ] Test protocol message processing

- [ ] Create `src/test/auth/authUI.test.ts`
  - [ ] Test UI interactions
  - [ ] Test input validation
  - [ ] Test error messages
  - [ ] Test integration with AuthService

- [ ] Create `src/test/auth/authProtocol.test.ts`
  - [ ] Test message format validation
  - [ ] Test protocol sequence
  - [ ] Test error handling
  - [ ] Test security considerations

- [ ] Create `src/test/auth/integration.test.ts`
  - [ ] Test end-to-end authentication flow
  - [ ] Test failure scenarios
  - [ ] Test reconnection scenarios

### File Sharing System Tests
- [ ] Create `src/test/fileSharing/fileService.test.ts`
  - [ ] Test file selection
  - [ ] Test file reading/writing
  - [ ] Test large file handling
  - [ ] Test error scenarios (file not found, permissions)

- [ ] Create `src/test/fileSharing/fileTransferProtocol.test.ts`
  - [ ] Test protocol message format
  - [ ] Test chunking and reassembly
  - [ ] Test progress tracking
  - [ ] Test error handling and recovery

- [ ] Create `src/test/fileSharing/fileUI.test.ts`
  - [ ] Test UI interactions
  - [ ] Test progress display
  - [ ] Test error messages
  - [ ] Test confirmation dialogs

- [ ] Create `src/test/fileSharing/integration.test.ts`
  - [ ] Test end-to-end file transfer
  - [ ] Test integration with NetworkManager
  - [ ] Test multiple file transfers
  - [ ] Test cancellation scenarios

## Claude's Tasks: Refactoring Implementation

### Phase 1: Interface Definition
- [ ] Create `src/network/interfaces/IMessageHandler.ts`
- [ ] Create `src/network/interfaces/IConnectionManager.ts`
- [ ] Create `src/network/interfaces/INetworkManager.ts`
- [ ] Create `src/services/interfaces/ICommandService.ts`
- [ ] Create `src/services/interfaces/IEventHandlingService.ts`
- [ ] Create `src/network/interfaces/IMessage.ts`
- [ ] Create `src/network/interfaces/IMessageStrategy.ts`

### Phase 2: NetworkManager Refactoring
- [ ] Create `src/network/MessageHandler.ts` (≤80 lines)
- [ ] Create `src/network/ConnectionManager.ts` (≤80 lines)
- [ ] Refactor `src/network/networkManager.ts` (≤80 lines)
  - [ ] Use dependency injection
  - [ ] Remove direct instantiation
  - [ ] Delegate responsibilities to new classes

### Phase 3: Extension Refactoring
- [ ] Create `src/services/CommandService.ts` (≤80 lines)
- [ ] Create `src/services/EventHandlingService.ts` (≤80 lines)
- [ ] Refactor `src/extension.ts` (≤80 lines)
  - [ ] Use dependency injection
  - [ ] Simplify activation logic
  - [ ] Remove direct instantiation

### Phase 4: ConnectionHandler Refactoring
- [ ] Create message type classes in `src/network/messages/` (≤80 lines each)
  - [ ] TextMessage.ts
  - [ ] AuthMessage.ts
  - [ ] SystemMessage.ts
  - [ ] FileMessage.ts
- [ ] Create message handlers in `src/network/handlers/` (≤80 lines each)
  - [ ] TextMessageHandler.ts
  - [ ] AuthMessageHandler.ts
  - [ ] SystemMessageHandler.ts
  - [ ] FileMessageHandler.ts
- [ ] Refactor `src/network/connectionHandler.ts` (≤80 lines)
  - [ ] Use strategy pattern
  - [ ] Remove switch statements
  - [ ] Use dependency injection

### Phase 5: Integration and Testing
- [ ] Create `src/services/DependencyContainer.ts` for managing dependencies
- [ ] Update imports across the codebase
- [ ] Run linting to confirm SOLID compliance
- [ ] Verify functionality is preserved

## Process Steps

### For Gemini's Test Output
1. [ ] Save Gemini's authentication tests to `auth-tests.md`
2. [ ] Save Gemini's file sharing tests to `file-sharing-tests.md`
3. [ ] Run the parser script:
   ```
   node parse-gemini-tests.js auth-tests.md
   node parse-gemini-tests.js file-sharing-tests.md
   ```
4. [ ] Verify the test files are created in the correct locations
5. [ ] Review the generated tests and make any necessary adjustments

### For Claude's Refactoring
1. [ ] Start a new chat session with Claude
2. [ ] Share the refactoring plan
3. [ ] Work through each phase of the refactoring
4. [ ] Verify each component after refactoring
5. [ ] Run tests to ensure functionality is preserved

## Success Criteria

### Tests (Gemini)
- All test files are properly formatted and parseable
- Tests cover all required functionality
- Tests follow TDD principles
- Tests encourage SOLID-compliant implementation
- Edge cases and error scenarios are covered

### Refactoring (Claude)
- All files are ≤80 lines
- Each class has a single responsibility
- Dependencies are injected, not created directly
- Interfaces are used for abstraction
- No switch statements on types
- Functionality is preserved

## Notes
- The parser script will automatically create directories if they don't exist
- Test files should use the special markers for proper parsing
- Refactored files should maintain the same public API where possible
- Focus on high-ROI files first for maximum impact
