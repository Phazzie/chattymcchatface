# ChattyMcChatface Project Checklist (Updated)

This document outlines the detailed steps for both Gemini's test generation and Claude's refactoring work, adjusted for the numbered gem files.

## Gemini's Tasks: Test Generation (COMPLETED)

Gemini has created test files named gem1, gem2, etc. These files need to be processed to extract the actual test files.

### Processing Gemini's Output
- [ ] Ensure all gem files (gem1, gem2, etc.) are in the project root directory
- [ ] Run the parser script: `node parse-gemini-numbered-files.js`
- [ ] Verify the test files are extracted to the correct locations

### Expected Test Files After Parsing
- [ ] `src/test/auth/authService.test.ts`
- [ ] `src/test/auth/authUI.test.ts`
- [ ] `src/test/auth/authProtocol.test.ts`
- [ ] `src/test/auth/integration.test.ts`
- [ ] `src/test/fileSharing/fileService.test.ts`
- [ ] `src/test/fileSharing/fileTransferProtocol.test.ts`
- [ ] `src/test/fileSharing/fileUI.test.ts`
- [ ] `src/test/fileSharing/integration.test.ts`

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
1. [ ] Ensure all gem files are in the project root directory
2. [ ] Run the parser script: `node parse-gemini-numbered-files.js`
3. [ ] Verify the test files are created in the correct locations
4. [ ] Review the generated tests and make any necessary adjustments

### For Claude's Refactoring
1. [ ] Start a new chat session with Claude
2. [ ] Share the refactoring plan
3. [ ] Work through each phase of the refactoring
4. [ ] Verify each component after refactoring
5. [ ] Run tests to ensure functionality is preserved

## Success Criteria

### Tests (Gemini)
- All test files are properly extracted from gem files
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
