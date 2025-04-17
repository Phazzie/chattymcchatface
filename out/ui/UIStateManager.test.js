"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_mockito_1 = require("ts-mockito");
const UIStateManager_1 = require("./UIStateManager");
describe('UIStateManager', () => {
    // Mock dependencies
    let mockWebviewProvider;
    // System under test
    let uiStateManager;
    beforeEach(() => {
        // Create mocks
        mockWebviewProvider = (0, ts_mockito_1.mock)();
        // Create system under test
        uiStateManager = new UIStateManager_1.UIStateManager((0, ts_mockito_1.instance)(mockWebviewProvider));
    });
    afterEach(() => {
        (0, ts_mockito_1.reset)(mockWebviewProvider);
    });
    describe('updateConnectionStatus', () => {
        it('should update connection status in webview provider and store state', () => {
            // Act
            uiStateManager.updateConnectionStatus(true);
            // Assert
            (0, ts_mockito_1.verify)(mockWebviewProvider.updateConnectionStatus(true)).once();
            expect(uiStateManager.isConnected()).toBe(true);
        });
        it('should update connection status to false', () => {
            // Arrange
            uiStateManager.updateConnectionStatus(true);
            // Act
            uiStateManager.updateConnectionStatus(false);
            // Assert
            (0, ts_mockito_1.verify)(mockWebviewProvider.updateConnectionStatus(false)).once();
            expect(uiStateManager.isConnected()).toBe(false);
        });
    });
    describe('isConnected', () => {
        it('should return false by default', () => {
            // Act & Assert
            expect(uiStateManager.isConnected()).toBe(false);
        });
        it('should return true after setting connected to true', () => {
            // Arrange
            uiStateManager.updateConnectionStatus(true);
            // Act & Assert
            expect(uiStateManager.isConnected()).toBe(true);
        });
    });
    describe('saveState', () => {
        it('should save the current state', () => {
            // Arrange
            uiStateManager.updateConnectionStatus(true);
            // Act
            uiStateManager.saveState();
            // Assert - This is mostly a placeholder as we'll need to implement state persistence
            expect(uiStateManager.isConnected()).toBe(true);
        });
    });
    describe('restoreState', () => {
        it('should restore the saved state', () => {
            // Arrange
            uiStateManager.updateConnectionStatus(true);
            uiStateManager.saveState();
            uiStateManager.updateConnectionStatus(false);
            // Act
            uiStateManager.restoreState();
            // Assert - This is mostly a placeholder as we'll need to implement state persistence
            expect(uiStateManager.isConnected()).toBe(true);
            (0, ts_mockito_1.verify)(mockWebviewProvider.updateConnectionStatus(true)).times(2); // Once in updateConnectionStatus, once in restoreState
        });
    });
});
//# sourceMappingURL=UIStateManager.test.js.map