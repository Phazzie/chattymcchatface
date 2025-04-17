import { AuthProtocol, MessageType } from '../../auth/authProtocol'; // Adjust path as needed

describe('AuthProtocol', () => {

    describe('createAuthRequestMessage', () => {
        it('should create a valid AUTH_REQ message object', () => {
            const challenge = 'Badger';
            const message = AuthProtocol.createAuthRequestMessage(challenge);

            expect(message).toEqual({
                type: MessageType.AUTH_REQ,
                payload: {
                    challenge: challenge,
                },
            });
        });

        it('should handle empty challenge strings', () => {
            const challenge = '';
            const message = AuthProtocol.createAuthRequestMessage(challenge);
            expect(message.payload.challenge).toBe('');
        });
    });

    describe('createAuthResponseMessage', () => {
        it('should create a valid AUTH_RESP message object', () => {
            const response = 'Badger';
            const message = AuthProtocol.createAuthResponseMessage(response);

            expect(message).toEqual({
                type: MessageType.AUTH_RESP,
                payload: {
                    response: response,
                },
            });
        });
    });

    describe('createAuthSuccessMessage', () => {
        it('should create a valid AUTH_SUCCESS message object', () => {
            const originalChallenge = 'Fox';
            // Success message includes original challenge for verification
            const message = AuthProtocol.createAuthSuccessMessage(originalChallenge);

            expect(message).toEqual({
                type: MessageType.AUTH_SUCCESS,
                payload: {
                    challenge: originalChallenge,
                },
            });
        });
    });

    describe('createAuthFailMessage', () => {
        it('should create a valid AUTH_FAIL message object with optional reason', () => {
            const reason = 'Invalid response';
            const message = AuthProtocol.createAuthFailMessage(reason);

            expect(message).toEqual({
                type: MessageType.AUTH_FAIL,
                payload: {
                    reason: reason,
                },
            });
        });

        it('should create a valid AUTH_FAIL message object without a reason', () => {
            const message = AuthProtocol.createAuthFailMessage();

            expect(message).toEqual({
                type: MessageType.AUTH_FAIL,
                payload: {}, // Payload is empty if no reason provided
            });
        });
    });

    // Optional: Add validation functions if the protocol includes them
    // describe('isValidMessage', () => {
    //     it('should return true for valid messages', () => {
    //         const msg = AuthProtocol.createAuthRequestMessage('Test');
    //         expect(AuthProtocol.isValidMessage(msg)).toBe(true);
    //     });
    //     it('should return false for invalid messages (e.g., wrong type, missing payload)', () => {
    //         expect(AuthProtocol.isValidMessage({ type: 'WRONG', payload: {} })).toBe(false);
    //         expect(AuthProtocol.isValidMessage({ type: MessageType.AUTH_REQ })).toBe(false); // Missing payload
    //         expect(AuthProtocol.isValidMessage(null)).toBe(false);
    //         expect(AuthProtocol.isValidMessage({})).toBe(false);
    //     });
    // });
});
