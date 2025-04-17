// src/test/suite/authHandler.test.ts
import { AuthHandler, AuthResult } from '../../authHandler'; // Adjust path as needed
import { Socket } from 'net';
import { PassThrough } from 'stream'; // Use PassThrough to simulate socket behavior

// Mock the Socket class
jest.mock('net', () => ({
    Socket: jest.fn().mockImplementation(() => {
        const socketMock = new PassThrough(); // Readable and Writable stream
        // Mock methods and properties used by AuthHandler
        socketMock.on = jest.fn(socketMock.on.bind(socketMock));
        socketMock.off = jest.fn(socketMock.off.bind(socketMock));
        socketMock.write = jest.fn(socketMock.write.bind(socketMock));
        socketMock.destroy = jest.fn(() => {
            (socketMock as any).destroyed = true; // Simulate destroyed state
        });
        (socketMock as any).destroyed = false; // Initial state
        // Add remoteAddress for potential logging/debugging in handler
        (socketMock as any).remoteAddress = '127.0.0.1';
        (socketMock as any).remotePort = 12345;
        return socketMock;
    }),
}));

// Mock the user input callback
const mockRequestAnimalInput = jest.fn<Promise<string | undefined>, []>();

describe('AuthHandler', () => {
    let mockSocket: PassThrough & Socket & { destroyed: boolean }; // Combine types for simulation and mocking
    let authHandler: AuthHandler;

    // Helper to wait for promise microtasks to settle
    const tick = () => new Promise(resolve => process.nextTick(resolve));

    beforeEach(() => {
        // Create a fresh mock socket and handler for each test
        mockSocket = new (Socket as any)() as PassThrough & Socket & { destroyed: boolean };
        mockRequestAnimalInput.mockClear(); // Reset input mock
        authHandler = new AuthHandler(mockSocket, mockRequestAnimalInput);

        // Reset mock implementations/calls
        (mockSocket.on as jest.Mock).mockClear();
        (mockSocket.off as jest.Mock).mockClear();
        (mockSocket.write as jest.Mock).mockClear();
        (mockSocket.destroy as jest.Mock).mockClear();
        mockSocket.destroyed = false; // Reset destroyed state

        // Note: The constructor attaches listeners. We rely on the mock setup
        // to ensure 'on' captures these initial attachments if needed,
        // but most tests focus on behavior *after* setup.
    });

    // --- Server Role Tests ---
    describe('Server Role', () => {
        const serverAnimals = ['Lion', 'Tiger', 'Bear'];
        const serverAnimalsLower = serverAnimals.map(a => a.toLowerCase());

        test('initiateAuthAsServer should send AUTH_REQ and return a pending promise', () => {
            const promise = authHandler.initiateAuthAsServer(serverAnimals);
            expect(mockSocket.write).toHaveBeenCalledTimes(1);
            expect(mockSocket.write).toHaveBeenCalledWith('AUTH_REQ\n', 'utf-8');
            // Promise should not resolve immediately
            let resolved = false;
            promise.then(() => { resolved = true; });
            return tick().then(() => {
                expect(resolved).toBe(false);
            });
        });

        test('should send AUTH_SUCCESS on receiving correct AUTH_RESP (case-insensitive, extra spaces)', async () => {
            const promise = authHandler.initiateAuthAsServer(serverAnimals);
            // Simulate client sending response with varied spacing
            mockSocket.emit('data', Buffer.from('AUTH_RESP: lion ,  Tiger,bear \n', 'utf-8'));

            await expect(promise).resolves.toEqual({ success: true });
            expect(mockSocket.write).toHaveBeenCalledTimes(2); // AUTH_REQ + AUTH_SUCCESS
            expect(mockSocket.write).toHaveBeenLastCalledWith('AUTH_SUCCESS\n', 'utf-8');
            // Check listeners are removed on success
            expect(mockSocket.off).toHaveBeenCalledWith('data', expect.any(Function));
            expect(mockSocket.off).toHaveBeenCalledWith('close', expect.any(Function));
            expect(mockSocket.off).toHaveBeenCalledWith('error', expect.any(Function));
            expect(mockSocket.destroy).not.toHaveBeenCalled(); // Connection stays open
        });

        test('should send AUTH_FAIL on receiving incorrect AUTH_RESP (wrong names)', async () => {
            const promise = authHandler.initiateAuthAsServer(serverAnimals);
            mockSocket.emit('data', Buffer.from('AUTH_RESP:cat,dog,mouse\n', 'utf-8'));

            await expect(promise).resolves.toEqual({ success: false, reason: 'Invalid animal names.' });
            expect(mockSocket.write).toHaveBeenCalledTimes(2); // AUTH_REQ + AUTH_FAIL
            expect(mockSocket.write).toHaveBeenLastCalledWith('AUTH_FAIL\n', 'utf-8');
            expect(mockSocket.destroy).toHaveBeenCalledTimes(1); // Connection closed on failure
        });

        test('should send AUTH_FAIL on receiving incorrect AUTH_RESP (wrong count)', async () => {
            const promise = authHandler.initiateAuthAsServer(serverAnimals);
            mockSocket.emit('data', Buffer.from('AUTH_RESP:lion,tiger\n', 'utf-8'));

            await expect(promise).resolves.toEqual({ success: false, reason: 'Invalid animal names.' });
            expect(mockSocket.write).toHaveBeenCalledTimes(2);
            expect(mockSocket.write).toHaveBeenLastCalledWith('AUTH_FAIL\n', 'utf-8');
            expect(mockSocket.destroy).toHaveBeenCalledTimes(1);
        });

        test('should send AUTH_FAIL on receiving AUTH_RESP with empty names', async () => {
            const promise = authHandler.initiateAuthAsServer(serverAnimals);
            mockSocket.emit('data', Buffer.from('AUTH_RESP:lion,,bear\n', 'utf-8')); // Empty middle name

            await expect(promise).resolves.toEqual({ success: false, reason: 'Invalid animal names.' });
            expect(mockSocket.write).toHaveBeenCalledTimes(2);
            expect(mockSocket.write).toHaveBeenLastCalledWith('AUTH_FAIL\n', 'utf-8');
            expect(mockSocket.destroy).toHaveBeenCalledTimes(1);
        });

        test('should handle fragmented AUTH_RESP message correctly', async () => {
            const promise = authHandler.initiateAuthAsServer(serverAnimals);
            // Simulate fragmented data
            mockSocket.emit('data', Buffer.from('AUTH_RESP:li', 'utf-8'));
            await tick(); // Allow processing
            expect(mockSocket.write).toHaveBeenCalledTimes(1); // Only AUTH_REQ so far
            mockSocket.emit('data', Buffer.from('on, t', 'utf-8'));
            await tick();
            expect(mockSocket.write).toHaveBeenCalledTimes(1);
            mockSocket.emit('data', Buffer.from('iger, bear\n', 'utf-8'));

            await expect(promise).resolves.toEqual({ success: true });
            expect(mockSocket.write).toHaveBeenCalledTimes(2); // AUTH_REQ + AUTH_SUCCESS
            expect(mockSocket.write).toHaveBeenLastCalledWith('AUTH_SUCCESS\n', 'utf-8');
        });

        test('should handle multiple messages in one chunk, processing only the first valid one', async () => {
            const promise = authHandler.initiateAuthAsServer(serverAnimals);
            // Simulate client sending response then something else
            mockSocket.emit('data', Buffer.from('AUTH_RESP:lion,tiger,bear\nAUTH_RESP:cat,dog,mouse\n', 'utf-8'));

            await expect(promise).resolves.toEqual({ success: true });
            expect(mockSocket.write).toHaveBeenCalledTimes(2); // AUTH_REQ + AUTH_SUCCESS
            expect(mockSocket.write).toHaveBeenLastCalledWith('AUTH_SUCCESS\n', 'utf-8');
            // The second AUTH_RESP should ideally be ignored as auth is complete
        });

        test('should ignore unexpected messages before receiving AUTH_RESP', async () => {
            const promise = authHandler.initiateAuthAsServer(serverAnimals);
            mockSocket.emit('data', Buffer.from('RANDOM_GARBAGE\n', 'utf-8'));
            await tick();
            // Should not resolve or reject yet, still waiting for AUTH_RESP
            let resolved = false;
            promise.then(() => { resolved = true; });
            await tick();
            expect(resolved).toBe(false);
            expect(mockSocket.write).toHaveBeenCalledTimes(1); // Only AUTH_REQ

            // Now send the correct response
            mockSocket.emit('data', Buffer.from(`AUTH_RESP:${serverAnimalsLower.join(',')}\n`, 'utf-8'));
            await expect(promise).resolves.toEqual({ success: true });
            expect(mockSocket.write).toHaveBeenCalledTimes(2); // AUTH_REQ + AUTH_SUCCESS
        });
    });

    // --- Client Role Tests ---
    describe('Client Role', () => {
        const clientAnimals = ['Dog', 'Cat', 'Emu'];
        const clientAnimalsString = clientAnimals.join(',');
        const clientAnimalsStringSpaced = ' Dog , Cat,Emu ';

        test('waitForAuthRequest should return a pending promise', () => {
            const promise = authHandler.waitForAuthRequest();
            // Promise should not resolve immediately
            let resolved = false;
            promise.then(() => { resolved = true; });
            return tick().then(() => {
                expect(resolved).toBe(false);
            });
        });

        test('should request user input upon receiving AUTH_REQ and send AUTH_RESP', async () => {
            const promise = authHandler.waitForAuthRequest();
            mockRequestAnimalInput.mockResolvedValueOnce(clientAnimalsStringSpaced); // Simulate user providing input with spaces

            // Simulate server sending AUTH_REQ
            mockSocket.emit('data', Buffer.from('AUTH_REQ\n', 'utf-8'));

            // Wait for input mock to be called and response sent
            await tick(); // Allow AUTH_REQ processing and input request
            await tick(); // Allow input promise to resolve and AUTH_RESP to be sent

            expect(mockRequestAnimalInput).toHaveBeenCalledTimes(1);
            expect(mockSocket.write).toHaveBeenCalledTimes(1);
            // Verify that the sent response trims the names
            expect(mockSocket.write).toHaveBeenCalledWith(`AUTH_RESP:${clientAnimalsString}\n`, 'utf-8');

            // Simulate server sending success
            mockSocket.emit('data', Buffer.from('AUTH_SUCCESS\n', 'utf-8'));
            await expect(promise).resolves.toEqual({ success: true });
            // Check listeners are removed on success
            expect(mockSocket.off).toHaveBeenCalledWith('data', expect.any(Function));
            expect(mockSocket.off).toHaveBeenCalledWith('close', expect.any(Function));
            expect(mockSocket.off).toHaveBeenCalledWith('error', expect.any(Function));
            expect(mockSocket.destroy).not.toHaveBeenCalled(); // Connection stays open
        });

        test('should resolve false and close connection if user cancels input', async () => {
            const promise = authHandler.waitForAuthRequest();
            mockRequestAnimalInput.mockResolvedValueOnce(undefined); // Simulate user cancelling

            mockSocket.emit('data', Buffer.from('AUTH_REQ\n', 'utf-8'));

            await expect(promise).resolves.toEqual({ success: false, reason: 'User cancelled input.' });
            expect(mockRequestAnimalInput).toHaveBeenCalledTimes(1);
            expect(mockSocket.write).not.toHaveBeenCalled(); // No AUTH_RESP sent
            expect(mockSocket.destroy).toHaveBeenCalledTimes(1); // Connection closed
        });

        test('should reject if requesting user input fails', async () => {
            const inputError = new Error('VSCode input failed');
            const promise = authHandler.waitForAuthRequest();
            mockRequestAnimalInput.mockRejectedValueOnce(inputError); // Simulate error during input

            mockSocket.emit('data', Buffer.from('AUTH_REQ\n', 'utf-8'));

            await expect(promise).rejects.toThrow(inputError);
            expect(mockRequestAnimalInput).toHaveBeenCalledTimes(1);
            expect(mockSocket.write).not.toHaveBeenCalled();
            expect(mockSocket.destroy).toHaveBeenCalledTimes(1); // Connection should close on error
        });

        test('should resolve true upon receiving AUTH_SUCCESS directly', async () => {
            const promise = authHandler.waitForAuthRequest();
            // No AUTH_REQ needed here if we just test receiving success
            mockSocket.emit('data', Buffer.from('AUTH_SUCCESS\n', 'utf-8'));

            await expect(promise).resolves.toEqual({ success: true });
            expect(mockSocket.destroy).not.toHaveBeenCalled();
            expect(mockSocket.off).toHaveBeenCalledWith('data', expect.any(Function)); // Listeners removed
        });

        test('should resolve false upon receiving AUTH_FAIL directly', async () => {
            const promise = authHandler.waitForAuthRequest();
            mockSocket.emit('data', Buffer.from('AUTH_FAIL\n', 'utf-8'));

            await expect(promise).resolves.toEqual({ success: false, reason: 'Authentication failed by peer.' });
            expect(mockSocket.destroy).toHaveBeenCalledTimes(1); // Connection closed
            expect(mockSocket.off).toHaveBeenCalledWith('data', expect.any(Function)); // Listeners removed
        });

        test('should handle fragmented AUTH_REQ message', async () => {
            const promise = authHandler.waitForAuthRequest();
            mockRequestAnimalInput.mockResolvedValueOnce(clientAnimalsString);

            mockSocket.emit('data', Buffer.from('AUTH', 'utf-8'));
            await tick();
            expect(mockRequestAnimalInput).not.toHaveBeenCalled();
            mockSocket.emit('data', Buffer.from('_REQ\n', 'utf-8'));
            await tick(); // Allow processing AUTH_REQ
            await tick(); // Allow input handling

            expect(mockRequestAnimalInput).toHaveBeenCalledTimes(1);
            expect(mockSocket.write).toHaveBeenCalledWith(`AUTH_RESP:${clientAnimalsString}\n`, 'utf-8');

            // Complete the flow
            mockSocket.emit('data', Buffer.from('AUTH_SUCCESS\n', 'utf-8'));
            await expect(promise).resolves.toEqual({ success: true });
        });

        test('should ignore unexpected messages before receiving AUTH_REQ', async () => {
            const promise = authHandler.waitForAuthRequest();
            mockSocket.emit('data', Buffer.from('RANDOM_GARBAGE\n', 'utf-8'));
            await tick();
            // Should not resolve or reject yet
            let resolved = false;
            promise.then(() => { resolved = true; });
            await tick();
            expect(resolved).toBe(false);
            expect(mockRequestAnimalInput).not.toHaveBeenCalled();

            // Now send AUTH_REQ
            mockRequestAnimalInput.mockResolvedValueOnce(clientAnimalsString);
            mockSocket.emit('data', Buffer.from('AUTH_REQ\n', 'utf-8'));
            await tick(); // Process AUTH_REQ
            await tick(); // Handle input
            expect(mockRequestAnimalInput).toHaveBeenCalledTimes(1);

            // Complete the flow
            mockSocket.emit('data', Buffer.from('AUTH_SUCCESS\n', 'utf-8'));
            await expect(promise).resolves.toEqual({ success: true });
        });
    });

    // --- General/Error Handling Tests ---
    describe('General Handling', () => {
        test('should resolve false if socket closes during server auth initiation', async () => {
            const promise = authHandler.initiateAuthAsServer(['a', 'b', 'c']);
            expect(mockSocket.write).toHaveBeenCalledWith('AUTH_REQ\n', 'utf-8');

            // Simulate close event immediately after sending AUTH_REQ
            mockSocket.emit('close');

            await expect(promise).resolves.toEqual({ success: false, reason: 'Connection closed during authentication.' });
            expect(mockSocket.off).toHaveBeenCalledWith('data', expect.any(Function));
            expect(mockSocket.off).toHaveBeenCalledWith('close', expect.any(Function));
            expect(mockSocket.off).toHaveBeenCalledWith('error', expect.any(Function));
            // Destroy might not be called if close happens externally, but listeners should be off
        });

        test('should resolve false if socket closes during client waiting for AUTH_REQ', async () => {
            const promise = authHandler.waitForAuthRequest();

            // Simulate close event while waiting
            mockSocket.emit('close');

            await expect(promise).resolves.toEqual({ success: false, reason: 'Connection closed during authentication.' });
            expect(mockSocket.off).toHaveBeenCalledWith('data', expect.any(Function));
        });

        test('should reject if socket errors during server auth', async () => {
            const error = new Error('Test socket error - server');
            const promise = authHandler.initiateAuthAsServer(['a', 'b', 'c']);

            // Simulate error event
            mockSocket.emit('error', error);

            await expect(promise).rejects.toThrow(error);
            expect(mockSocket.off).toHaveBeenCalledWith('data', expect.any(Function));
            expect(mockSocket.off).toHaveBeenCalledWith('close', expect.any(Function));
            expect(mockSocket.off).toHaveBeenCalledWith('error', expect.any(Function));
        });

        test('should reject if socket errors during client auth', async () => {
            const error = new Error('Test socket error - client');
            const promise = authHandler.waitForAuthRequest();

            // Simulate error event
            mockSocket.emit('error', error);

            await expect(promise).rejects.toThrow(error);
            expect(mockSocket.off).toHaveBeenCalledWith('data', expect.any(Function));
        });

        test('should handle socket being destroyed externally during auth', async () => {
            const promise = authHandler.initiateAuthAsServer(['a', 'b', 'c']);
            (mockSocket as any).destroyed = true; // Simulate external destruction
            mockSocket.emit('close'); // Usually follows destroy

            await expect(promise).resolves.toEqual({ success: false, reason: 'Connection closed during authentication.' });
            // Ensure destroy wasn't called *again* by the handler itself if already destroyed
            expect(mockSocket.destroy).not.toHaveBeenCalled();
        });
    });
});
