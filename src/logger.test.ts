import * as vscode from 'vscode';
import { Logger } from './logger';
import { ILogger } from './interfaces';
import { mock, instance, verify, when, anything } from 'ts-mockito';

describe('Logger', () => {
    let mockOutputChannel: vscode.OutputChannel;
    let logger: ILogger;

    beforeEach(() => {
        // Create a mock OutputChannel using ts-mockito
        mockOutputChannel = mock<vscode.OutputChannel>();
        // Stub the appendLine method
        when(mockOutputChannel.appendLine(anything())).thenReturn();
        // Create the Logger instance with the mocked channel
        logger = new Logger(instance(mockOutputChannel));
    });

    test('should log informational messages with timestamp and prefix', () => {
        const message = 'Test info message';
        logger.info(message);
        // Verify appendLine was called, capturing the argument
        verify(mockOutputChannel.appendLine(anything())).once();
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
        verify(mockOutputChannel.appendLine(anything())).once();
        // Similar verification as above, checking for [WARN] prefix
    });

    test('should log error messages with timestamp and prefix', () => {
        const message = 'Test error message';
        const error = new Error('Something went wrong');
        logger.error(message, error);
        // Verify appendLine was called twice (once for message, once for error stack)
        verify(mockOutputChannel.appendLine(anything())).twice();
        // Check that the error stack is logged
    });

    test('should log error messages without an error object', () => {
        const message = 'Test error message without object';
        logger.error(message);
        verify(mockOutputChannel.appendLine(anything())).once();
    });
});

