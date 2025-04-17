"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROTOCOL_VERSION = exports.AUTH = exports.BROADCAST_TYPES = exports.NETWORK = void 0;
/**
 * Network-related constants.
 */
exports.NETWORK = {
    /** Port used for UDP discovery broadcasts */
    DISCOVERY_PORT: 35900,
    /** Port used for TCP chat connections */
    CHAT_PORT: 35901,
    /** Broadcast address for local network */
    BROADCAST_ADDRESS: '255.255.255.255',
    /** Interval (ms) between discovery broadcasts */
    BROADCAST_INTERVAL: 5000,
    /** Connection timeout (ms) for TCP connections */
    CONNECTION_TIMEOUT: 10000
};
/**
 * Message types for UDP broadcasts.
 */
exports.BROADCAST_TYPES = {
    /** Discovery broadcast to find peers */
    DISCOVER: 'DISCOVER',
    /** Announcement to respond to discovery */
    ANNOUNCE: 'ANNOUNCE'
};
/**
 * Authentication-related constants.
 */
exports.AUTH = {
    /** Number of animal names required for authentication */
    REQUIRED_ANIMALS: 3,
    /** Authentication timeout (ms) */
    TIMEOUT: 60000,
    /** Message types for authentication protocol */
    MESSAGE_TYPES: {
        /** Request for authentication credentials */
        AUTH_REQ: 'AUTH_REQ',
        /** Response with authentication credentials */
        AUTH_RESP: 'AUTH_RESP',
        /** Authentication succeeded */
        AUTH_SUCCESS: 'AUTH_SUCCESS',
        /** Authentication failed */
        AUTH_FAIL: 'AUTH_FAIL'
    }
};
/**
 * Protocol version for compatibility checking.
 */
exports.PROTOCOL_VERSION = 1;
//# sourceMappingURL=constants.js.map