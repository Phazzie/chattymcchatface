"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const NodeTimer_1 = require("./NodeTimer");
describe('NodeTimer', () => {
    let nodeTimer;
    beforeEach(() => {
        nodeTimer = new NodeTimer_1.NodeTimer();
        jest.useFakeTimers();
    });
    afterEach(() => {
        jest.useRealTimers();
    });
    describe('set', () => {
        it('should call setTimeout with the provided callback and timeout', () => {
            // Arrange
            const callback = jest.fn();
            const timeout = 1000;
            jest.spyOn(global, 'setTimeout');
            // Act
            nodeTimer.set(callback, timeout);
            // Assert
            expect(setTimeout).toHaveBeenCalledWith(callback, timeout);
        });
        it('should return the timeout handle', () => {
            // Arrange
            const callback = jest.fn();
            const timeout = 1000;
            const mockHandle = {};
            jest.spyOn(global, 'setTimeout').mockReturnValue(mockHandle);
            // Act
            const result = nodeTimer.set(callback, timeout);
            // Assert
            expect(result).toBe(mockHandle);
        });
        it('should execute the callback after the specified timeout', () => {
            // Arrange
            const callback = jest.fn();
            const timeout = 1000;
            // Act
            nodeTimer.set(callback, timeout);
            jest.advanceTimersByTime(timeout);
            // Assert
            expect(callback).toHaveBeenCalledTimes(1);
        });
    });
    describe('clear', () => {
        it('should call clearTimeout with the provided handle', () => {
            // Arrange
            const callback = jest.fn();
            const timeout = 1000;
            const handle = nodeTimer.set(callback, timeout);
            jest.spyOn(global, 'clearTimeout');
            // Act
            nodeTimer.clear(handle);
            // Assert
            expect(clearTimeout).toHaveBeenCalledWith(handle);
        });
        it('should not call clearTimeout if handle is null', () => {
            // Arrange
            jest.spyOn(global, 'clearTimeout');
            // Act
            nodeTimer.clear(null);
            // Assert
            expect(clearTimeout).not.toHaveBeenCalled();
        });
        it('should prevent the callback from being executed', () => {
            // Arrange
            const callback = jest.fn();
            const timeout = 1000;
            const handle = nodeTimer.set(callback, timeout);
            // Act
            nodeTimer.clear(handle);
            jest.advanceTimersByTime(timeout);
            // Assert
            expect(callback).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=NodeTimer.test.js.map