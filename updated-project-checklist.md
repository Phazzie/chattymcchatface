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

- [x] Create `src/network/interfaces/IMessageHandler.ts`
- [x] Create `src/network/interfaces/IConnectionManager.ts`
- [x] Create `src/network/interfaces/INetworkManager.ts`
- [x] Create `src/services/interfaces/ICommandService.ts`
- [x] Create `src/services/interfaces/IEventHandlingService.ts`
- [x] Create `src/network/interfaces/IMessage.ts`
- [x] Create `src/network/interfaces/IMessageStrategy.ts`

### Phase 1b: Additional Network and Auth Interfaces

- [x] Create `src/network/interfaces/INetworkLifecycleManager.ts`
- [x] Create `src/network/interfaces/IConnectionHandlerFactory.ts`
- [x] Create `src/network/interfaces/IActiveConnectionCoordinator.ts`
- [x] Create `src/network/interfaces/IPeerConnector.ts`
- [x] Create `src/network/interfaces/IIncomingConnectionAcceptor.ts`
- [x] Create `src/network/interfaces/IDiscoveryEvents.ts`
- [x] Create `src/auth/interfaces/IAuthProcess.ts`
- [x] Create `src/auth/interfaces/IAuthProcessFactory.ts`
- [x] Create `src/auth/interfaces/IAuthManager.ts`
- [x] Create `src/auth/interfaces/ITimer.ts`

### Phase 2: NetworkManager Refactoring

- [x] Create `src/network/handlers/MessageHandler.ts` (≤80 lines)
- [x] Create `src/network/ConnectionManager.ts` (≤80 lines)
- [x] Refactor `src/network/networkManager.ts` into smaller components:
    - [x] Use dependency injection
    - [x] Remove direct instantiation
    - [x] Delegate responsibilities to new classes

### Phase 2b: Additional Network Implementation

- [x] Create `src/network/lifecycle/BasicNetworkLifecycleManager.ts` (≤80 lines)
- [x] Create `src/network/factories/ConcreteConnectionHandlerFactory.ts` (≤80 lines)
- [x] Create `src/network/connectors/TcpPeerConnector.ts` (≤80 lines)
- [x] Create `src/network/acceptors/TcpServerAcceptor.ts` (≤80 lines)
- [x] Create `src/network/discovery/UdpDiscoveryEvents.ts` (≤80 lines)
- [x] Create `src/network/coordination/ActiveConnectionCoordinator.ts` (≤80 lines)
- [x] Create `src/network/coordination/AutoConnectDiscoveryCoordinator.ts` (≤80 lines)
- [x] Create `src/network/coordination/IncomingConnectionCoordinator.ts` (≤80 lines)
- [x] Create `src/network/NetworkManagerFacade.ts` (≤80 lines)

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

### Phase 4b: Auth Implementation

- [x] Create `src/auth/util/NodeTimer.ts` (≤80 lines)
- [x] Create `src/auth/AuthProcess.ts` (≤80 lines)
- [x] Create `src/auth/AuthProcessFactory.ts` (≤80 lines)
- [x] Create `src/auth/AuthManager.ts` (≤80 lines)

### Phase 4c: Tests for New Components

- [x] Create `src/auth/util/NodeTimer.test.ts`
- [x] Create `src/auth/AuthProcess.test.ts`
- [x] Create `src/auth/AuthProcessFactory.test.ts`
- [x] Create `src/auth/AuthManager.test.ts`
- [x] Create `src/network/lifecycle/BasicNetworkLifecycleManager.test.ts`
- [x] Create `src/network/coordination/ActiveConnectionCoordinator.test.ts`

### Phase 5: Integration and Testing

- [x] Create `src/services/DependencyContainer.ts` for managing dependencies
- [x] Update imports across the codebase
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
