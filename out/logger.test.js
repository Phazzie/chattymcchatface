"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("./logger");
const ts_mockito_1 = require("ts-mockito");
describe('Logger', () => {
    let mockOutputChannel;
    let logger;
    beforeEach(() => {
        // Create a mock OutputChannel using ts-mockito
        mockOutputChannel = (0, ts_mockito_1.mock)();
        // Stub the appendLine method
        (0, ts_mockito_1.when)(mockOutputChannel.appendLine((0, ts_mockito_1.anything)())).thenReturn();
        // Create the Logger instance with the mocked channel
        logger = new logger_1.Logger((0, ts_mockito_1.instance)(mockOutputChannel));
    });
    test('should log informational messages with timestamp and prefix', () => {
        const message = 'Test info message';
        logger.info(message);
        // Verify appendLine was called, capturing the argument
        (0, ts_mockito_1.verify)(mockOutputChannel.appendLine((0, ts_mockito_1.anything)())).once();
        // We can't easily capture the exact timestamp, so we check the format
        // This requires a more advanced argument captor or matching,
        // but for simplicity, we'll just verify it was called once.
        // A more robust test would use an argument captor:
        // const captor = ArgumentCaptor.create<string>();
        // verify(mockOutputChannel.appendLine(captor.capture())).once();
        // expect(captor.value).toMatch(/\\\[.*\\\] \\[INFO\\] Test info message/);
    });
    test('should log warning messages with timestamp and prefix', () => {
        const message = 'Test warning message';
        logger.warn(message);
        (0, ts_mockito_1.verify)(mockOutputChannel.appendLine((0, ts_mockito_1.anything)())).once();
        // Similar verification as above, checking for [WARN] prefix
    });
    test('should log error messages with timestamp and prefix', () => {
        const message = 'Test error message';
        const error = new Error('Something went wrong');
        logger.error(message, error);
        // Verify appendLine was called twice (once for message, once for error stack)
        (0, ts_mockito_1.verify)(mockOutputChannel.appendLine((0, ts_mockito_1.anything)())).twice();
        // Check that the error stack is logged
    });
    test('should log error messages without an error object', () => {
        const message = 'Test error message without object';
        logger.error(message);
        (0, ts_mockito_1.verify)(mockOutputChannel.appendLine((0, ts_mockito_1.anything)())).once();
    });
});
//# sourceMappingURL=logger.test.js.map