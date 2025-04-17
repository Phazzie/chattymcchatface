// src/test/suite/authHandler.test.ts
import { AuthHandler, AuthResult } from '../../authHandler'; // Adjust path as needed
import { Socket } from 'net';
import { PassThrough } from 'stream'; // Use PassThrough to simulate socket behavior

// Mock the Socket class
jest.mock('net', () => ({
    Socket: jest.fn().mockImplementation(() => {
        const socketMock = new PassThrough(); // Readable and Writable stream
        socketMock.on = jest.fn(socketMock.on.bind(socketMock)); // Ensure 'on' is mockable
        socketMock.off = jest.fn(socketMock.off.bind(socketMock)); // Ensure 'off' is mockable
        socketMock.write = jest.fn(socketMock.write.bind(socketMock)); // Ensure 'write' is mockable
        socketMock.destroy = jest.fn();
        socketMock.destroyed = false;
        // Add other methods/properties if needed by AuthHandler
        return socketMock;
    }),
}));

// Mock the user input callback
const mockRequestAnimalInput = jest.fn();

describe('AuthHandler', () => {
    let mockSocket: PassThrough & Socket; // Combine types for simulation and mocking
    let authHandler: AuthHandler;

    beforeEach(() => {
        // Create a fresh mock socket and handler for each test
        mockSocket = new (Socket as any)() as PassThrough & Socket;
        mockRequestAnimalInput.mockClear(); // Reset input mock
        authHandler = new AuthHandler(mockSocket, mockRequestAnimalInput);

        // Reset mock implementations/calls if necessary
        (mockSocket.on as jest.Mock).mockClear();
        (mockSocket.off as jest.Mock).mockClear();
        (mockSocket.write as jest.Mock).mockClear();
        (mockSocket.destroy as jest.Mock).mockClear();

        // Re-attach listeners since constructor is called before this point
        // This is a bit tricky due to the mock setup, normally the constructor call
        // within beforeEach would handle this if the mock was simpler.
        // For simplicity here, we assume the constructor correctly attached listeners.
    });

    // --- Server Role Tests ---
    describe('Server Role', () => {
        const serverAnimals = ['Lion', 'Tiger', 'Bear'];

        test('initiateAuthAsServer should send AUTH_REQ', () => {
            authHandler.initiateAuthAsServer(serverAnimals);
            expect(mockSocket.write).toHaveBeenCalledTimes(1);
            expect(mockSocket.write).toHaveBeenCalledWith('AUTH_REQ\n', 'utf-8');
        });

        test('should send AUTH_SUCCESS on receiving correct AUTH_RESP (case-insensitive)', async () => {
            const promise = authHandler.initiateAuthAsServer(serverAnimals);
            // Simulate client sending response
            mockSocket.emit('data', Buffer.from('AUTH_RESP:lion, tiger, bear\n', 'utf-8'));

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
            expect(mockSocket.destroy).toHaveBeenCalled(); // Connection closed on failure
        });

        test('should send AUTH_FAIL on receiving incorrect AUTH_RESP (wrong count)', async () => {
            const promise = authHandler.initiateAuthAsServer(serverAnimals);
            mockSocket.emit('data', Buffer.from('AUTH_RESP:lion,tiger\n', 'utf-8'));

            await expect(promise).resolves.toEqual({ success: false, reason: 'Invalid animal names.' });
            expect(mockSocket.write).toHaveBeenCalledTimes(2);
            expect(mockSocket.write).toHaveBeenLastCalledWith('AUTH_FAIL\n', 'utf-8');
            expect(mockSocket.destroy).toHaveBeenCalled();
        });

         test('should handle fragmented AUTH_RESP message', async () => {
            const promise = authHandler.initiateAuthAsServer(serverAnimals);
            // Simulate fragmented data
            mockSocket.emit('data', Buffer.from('AUTH_RESP:li', 'utf-8'));
            mockSocket.emit('data', Buffer.from('on, t', 'utf-8'));
            mockSocket.emit('data', Buffer.from('iger, bear\n', 'utf-8'));

            await expect(promise).resolves.toEqual({ success: true });
            expect(mockSocket.write).toHaveBeenCalledTimes(2);
            expect(mockSocket.write).toHaveBeenLastCalledWith('AUTH_SUCCESS\n', 'utf-8');
        });

        test('should handle multiple messages in one chunk', async () => {
            const promise = authHandler.initiateAuthAsServer(serverAnimals);
            // Simulate client sending response then something else (which should be ignored by server auth)
            mockSocket.emit('data', Buffer.from('AUTH_RESP:lion,tiger,bear\nSOME_OTHER_DATA\n', 'utf-8'));

            await expect(promise).resolves.toEqual({ success: true });
            expect(mockSocket.write).toHaveBeenCalledTimes(2); // AUTH_REQ + AUTH_SUCCESS
            expect(mockSocket.write).toHaveBeenLastCalledWith('AUTH_SUCCESS\n', 'utf-8');
        });
    });

    // --- Client Role Tests ---
    describe('Client Role', () => {
        const clientAnimals = ['Dog', 'Cat', 'Emu'];
        const clientAnimalsString = clientAnimals.join(',');

        test('should request user input upon receiving AUTH_REQ', async () => {
            const promise = authHandler.waitForAuthRequest();
            mockRequestAnimalInput.mockResolvedValueOnce(clientAnimalsString); // Simulate user providing input

            // Simulate server sending AUTH_REQ
            mockSocket.emit('data', Buffer.from('AUTH_REQ\n', 'utf-8'));

            // Wait for input mock to be called
            await new Promise(process.nextTick); // Allow promise microtasks to run

            expect(mockRequestAnimalInput).toHaveBeenCalledTimes(1);
            expect(mockSocket.write).toHaveBeenCalledTimes(1);
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

         test('should resolve false if user cancels input', async () => {
            const promise = authHandler.waitForAuthRequest();
            mockRequestAnimalInput.mockResolvedValueOnce(undefined); // Simulate user cancelling

            mockSocket.emit('data', Buffer.from('AUTH_REQ\n', 'utf-8'));

            await expect(promise).resolves.toEqual({ success: false, reason: 'User cancelled input.' });
            expect(mockRequestAnimalInput).toHaveBeenCalledTimes(1);
            expect(mockSocket.write).not.toHaveBeenCalled(); // No AUTH_RESP sent
            expect(mockSocket.destroy).toHaveBeenCalled(); // Connection closed
        });

        test('should resolve true upon receiving AUTH_SUCCESS', async () => {
            const promise = authHandler.waitForAuthRequest();
            // No AUTH_REQ needed here if we just test receiving success
            mockSocket.emit('data', Buffer.from('AUTH_SUCCESS\n', 'utf-8'));

            await expect(promise).resolves.toEqual({ success: true });
            expect(mockSocket.destroy).not.toHaveBeenCalled();
        });

        test('should resolve false upon receiving AUTH_FAIL', async () => {
            const promise = authHandler.waitForAuthRequest();
            mockSocket.emit('data', Buffer.from('AUTH_FAIL\n', 'utf-8'));

            await expect(promise).resolves.toEqual({ success: false, reason: 'Authentication failed by peer.' });
            expect(mockSocket.destroy).toHaveBeenCalled(); // Connection closed
        });
    });

    // --- General/Error Handling Tests ---
    describe('General Handling', () => {
        test('should resolve false if socket closes during auth', async () => {
            // Test for server side
            const serverPromise = authHandler.initiateAuthAsServer(['a', 'b', 'c']);
            // Test for client side (less deterministic without AUTH_REQ first, but test cleanup)
            const clientPromise = authHandler.waitForAuthRequest();

            // Simulate close event
            mockSocket.emit('close');

            await expect(serverPromise).resolves.toEqual({ success: false, reason: 'Connection closed during authentication.' });
            await expect(clientPromise).resolves.toEqual({ success: false, reason: 'Connection closed during authentication.' });

            expect(mockSocket.off).toHaveBeenCalledWith('data', expect.any(Function));
            expect(mockSocket.off).toHaveBeenCalledWith('close', expect.any(Function));
            expect(mockSocket.off).toHaveBeenCalledWith('error', expect.any(Function));
        });

        test('should reject if socket errors during auth', async () => {
            const error = new Error('Test socket error');
            const serverPromise = authHandler.initiateAuthAsServer(['a', 'b', 'c']);
            const clientPromise = authHandler.waitForAuthRequest();

            // Simulate error event
            mockSocket.emit('error', error);

            await expect(serverPromise).rejects.toThrow(error);
            await expect(clientPromise).rejects.toThrow(error);

            expect(mockSocket.off).toHaveBeenCalledWith('data', expect.any(Function));
            expect(mockSocket.off).toHaveBeenCalledWith('close', expect.any(Function));
            expect(mockSocket.off).toHaveBeenCalledWith('error', expect.any(Function));
        });
    });
});
    