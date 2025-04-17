"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UdpDiscovery = void 0;
const dgram = __importStar(require("dgram"));
const events_1 = require("events");
const constants_1 = require("../constants");
/**
 * Handles UDP discovery broadcasts and listening for peers.
 */
class UdpDiscovery extends events_1.EventEmitter {
    /**
     * Creates an instance of UdpDiscovery.
     * @param logger The logger instance.
     * @param instanceId A unique identifier for this application instance.
     */
    constructor(logger, instanceId) {
        super();
        this.udpSocket = null;
        this.broadcastIntervalId = null;
        this.logger = logger;
        this.instanceId = instanceId;
    }
    /**
     * Starts UDP broadcasting and listening.
     */
    start() {
        if (this.udpSocket) {
            this.logger.warn('[UdpDiscovery] Discovery already running.');
            return;
        }
        try {
            this.udpSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
            this.udpSocket.on('error', (err) => {
                this.logger.error(`[UdpDiscovery] UDP socket error: ${err.message}`, err);
                this.stop(); // Stop discovery on error
            });
            this.udpSocket.on('message', (msg, rinfo) => {
                this.handleDiscoveryMessage(msg, rinfo);
            });
            this.udpSocket.bind(constants_1.NETWORK.DISCOVERY_PORT, () => {
                if (!this.udpSocket)
                    return; // Socket might have been closed by an error during bind
                try {
                    this.udpSocket.setBroadcast(true);
                    const address = this.udpSocket.address();
                    this.logger.info(`[UdpDiscovery] UDP discovery listening on ${address.address}:${address.port}`);
                    // Start periodic broadcasts
                    this.broadcastIntervalId = setInterval(() => {
                        this.sendDiscoveryBroadcast();
                    }, constants_1.NETWORK.BROADCAST_INTERVAL);
                    // Send initial broadcast immediately
                    this.sendDiscoveryBroadcast();
                }
                catch (err) {
                    this.logger.error('[UdpDiscovery] Error configuring socket after bind', err);
                    this.stop();
                }
            });
        }
        catch (err) {
            this.logger.error('[UdpDiscovery] Failed to start UDP discovery', err);
            this.udpSocket = null; // Ensure socket is null if creation failed
        }
    }
    /**
     * Stops UDP broadcasting and listening.
     */
    stop() {
        if (this.broadcastIntervalId) {
            clearInterval(this.broadcastIntervalId);
            this.broadcastIntervalId = null;
            this.logger.info('[UdpDiscovery] Stopped broadcast interval.');
        }
        if (this.udpSocket) {
            try {
                this.udpSocket.close();
                this.logger.info('[UdpDiscovery] UDP socket closed.');
            }
            catch (err) {
                this.logger.error('[UdpDiscovery] Error closing UDP socket', err);
            }
            this.udpSocket = null;
        }
        this.logger.info('[UdpDiscovery] UDP discovery stopped.');
    }
    /**
     * Sends a UDP discovery broadcast message.
     */
    sendDiscoveryBroadcast() {
        this.sendMessage(constants_1.NETWORK.BROADCAST_TYPES.DISCOVER, constants_1.NETWORK.BROADCAST_ADDRESS);
    }
    /**
     * Sends an announcement message directly to a specific IP address.
     * @param ip The target IP address.
     */
    sendAnnouncementTo(ip) {
        this.sendMessage(constants_1.NETWORK.BROADCAST_TYPES.ANNOUNCE, ip);
    }
    /**
     * Sends a specific type of discovery message to a target address.
     * @param type The type of message (DISCOVER or ANNOUNCE).
     * @param targetIp The target IP address (broadcast or specific peer).
     */
    sendMessage(type, targetIp) {
        if (!this.udpSocket) {
            this.logger.warn(`[UdpDiscovery] Cannot send message, socket not available.`);
            return;
        }
        try {
            const message = {
                type: type,
                version: constants_1.PROTOCOL_VERSION,
                port: constants_1.NETWORK.CHAT_PORT,
                instanceId: this.instanceId
            };
            const messageBuffer = Buffer.from(JSON.stringify(message));
            this.udpSocket.send(messageBuffer, 0, messageBuffer.length, constants_1.NETWORK.DISCOVERY_PORT, targetIp, (err) => {
                if (err) {
                    this.logger.error(`[UdpDiscovery] Error sending ${type} message to ${targetIp}`, err);
                }
                else {
                    // Avoid logging every single broadcast message unless debugging
                    if (type !== constants_1.NETWORK.BROADCAST_TYPES.DISCOVER || process.env.VSCODE_DEBUG_MODE === 'true') {
                        this.logger.info(`[UdpDiscovery] Sent ${type} message to ${targetIp}`);
                    }
                }
            });
        }
        catch (err) {
            this.logger.error(`[UdpDiscovery] Failed to construct or send ${type} message`, err);
        }
    }
    /**
     * Handles an incoming UDP discovery message.
     * @param message The raw message buffer.
     * @param rinfo Information about the sender.
     */
    handleDiscoveryMessage(message, rinfo) {
        try {
            const parsedMessage = JSON.parse(message.toString());
            // Ignore messages from self
            if (parsedMessage.instanceId === this.instanceId) {
                return;
            }
            // Basic validation
            if (!parsedMessage.type || !parsedMessage.instanceId || !parsedMessage.port || parsedMessage.version !== constants_1.PROTOCOL_VERSION) {
                this.logger.warn(`[UdpDiscovery] Received invalid discovery message structure from ${rinfo.address}:${rinfo.port}`);
                return;
            }
            this.logger.info(`[UdpDiscovery] Received ${parsedMessage.type} message from ${rinfo.address}:${rinfo.port} (Peer ID: ${parsedMessage.instanceId})`);
            if (parsedMessage.type === constants_1.NETWORK.BROADCAST_TYPES.DISCOVER) {
                // Respond to discovery request with an announcement
                this.logger.info(`[UdpDiscovery] Responding to DISCOVER from ${rinfo.address} with ANNOUNCE.`);
                this.sendAnnouncementTo(rinfo.address);
            }
            else if (parsedMessage.type === constants_1.NETWORK.BROADCAST_TYPES.ANNOUNCE) {
                // Process peer announcement
                const peer = {
                    ip: rinfo.address,
                    port: parsedMessage.port,
                    instanceId: parsedMessage.instanceId
                };
                this.logger.info(`[UdpDiscovery] Discovered peer: ${peer.instanceId} at ${peer.ip}:${peer.port}`);
                this.emit('peerDiscovered', peer);
            }
            else {
                this.logger.warn(`[UdpDiscovery] Unknown discovery message type: ${parsedMessage.type} from ${rinfo.address}`);
            }
        }
        catch (err) {
            this.logger.error(`[UdpDiscovery] Error parsing discovery message from ${rinfo.address}:${rinfo.port}`, err);
        }
    }
}
exports.UdpDiscovery = UdpDiscovery;
//# sourceMappingURL=udpDiscovery.js.map