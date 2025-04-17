import * as dgram from 'dgram';
import { EventEmitter } from 'events';
import { ILogger, IUdpDiscovery, DiscoveredPeer } from '../interfaces';
import { NETWORK, PROTOCOL_VERSION, DiscoveryMessage } from '../constants';

/**
 * Handles UDP discovery broadcasts and listening for peers.
 */
export class UdpDiscovery extends EventEmitter implements IUdpDiscovery {
    private readonly logger: ILogger;
    private readonly instanceId: string;
    private udpSocket: dgram.Socket | null = null;
    private broadcastIntervalId: NodeJS.Timeout | null = null;

    /**
     * Creates an instance of UdpDiscovery.
     * @param logger The logger instance.
     * @param instanceId A unique identifier for this application instance.
     */
    constructor(logger: ILogger, instanceId: string) {
        super();
        this.logger = logger;
        this.instanceId = instanceId;
    }

    /**
     * Starts UDP broadcasting and listening.
     */
    public start(): void {
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

            this.udpSocket.bind(NETWORK.DISCOVERY_PORT, () => {
                if (!this.udpSocket) return; // Socket might have been closed by an error during bind
                try {
                    this.udpSocket.setBroadcast(true);
                    const address = this.udpSocket.address();
                    this.logger.info(`[UdpDiscovery] UDP discovery listening on ${address.address}:${address.port}`);

                    // Start periodic broadcasts
                    this.broadcastIntervalId = setInterval(() => {
                        this.sendDiscoveryBroadcast();
                    }, NETWORK.BROADCAST_INTERVAL);

                    // Send initial broadcast immediately
                    this.sendDiscoveryBroadcast();
                } catch (err) {
                    this.logger.error('[UdpDiscovery] Error configuring socket after bind', err);
                    this.stop();
                }
            });

        } catch (err) {
            this.logger.error('[UdpDiscovery] Failed to start UDP discovery', err);
            this.udpSocket = null; // Ensure socket is null if creation failed
        }
    }

    /**
     * Stops UDP broadcasting and listening.
     */
    public stop(): void {
        if (this.broadcastIntervalId) {
            clearInterval(this.broadcastIntervalId);
            this.broadcastIntervalId = null;
            this.logger.info('[UdpDiscovery] Stopped broadcast interval.');
        }

        if (this.udpSocket) {
            try {
                this.udpSocket.close();
                this.logger.info('[UdpDiscovery] UDP socket closed.');
            } catch (err) {
                this.logger.error('[UdpDiscovery] Error closing UDP socket', err);
            }
            this.udpSocket = null;
        }
        this.logger.info('[UdpDiscovery] UDP discovery stopped.');
    }

    /**
     * Sends a UDP discovery broadcast message.
     */
    private sendDiscoveryBroadcast(): void {
        this.sendMessage(NETWORK.BROADCAST_TYPES.DISCOVER, NETWORK.BROADCAST_ADDRESS);
    }

    /**
     * Sends an announcement message directly to a specific IP address.
     * @param ip The target IP address.
     */
    private sendAnnouncementTo(ip: string): void {
        this.sendMessage(NETWORK.BROADCAST_TYPES.ANNOUNCE, ip);
    }

    /**
     * Sends a specific type of discovery message to a target address.
     * @param type The type of message (DISCOVER or ANNOUNCE).
     * @param targetIp The target IP address (broadcast or specific peer).
     */
    private sendMessage(type: typeof NETWORK.BROADCAST_TYPES[keyof typeof NETWORK.BROADCAST_TYPES], targetIp: string): void {
        if (!this.udpSocket) {
            this.logger.warn(`[UdpDiscovery] Cannot send message, socket not available.`);
            return;
        }

        try {
            const message: DiscoveryMessage = {
                type: type,
                version: PROTOCOL_VERSION,
                port: NETWORK.CHAT_PORT, // The TCP port others should connect to
                instanceId: this.instanceId
            };
            const messageBuffer = Buffer.from(JSON.stringify(message));

            this.udpSocket.send(
                messageBuffer,
                0,
                messageBuffer.length,
                NETWORK.DISCOVERY_PORT,
                targetIp,
                (err) => {
                    if (err) {
                        this.logger.error(`[UdpDiscovery] Error sending ${type} message to ${targetIp}`, err);
                    } else {
                        // Avoid logging every single broadcast message unless debugging
                        if (type !== NETWORK.BROADCAST_TYPES.DISCOVER || process.env.VSCODE_DEBUG_MODE === 'true') {
                            this.logger.info(`[UdpDiscovery] Sent ${type} message to ${targetIp}`);
                        }
                    }
                }
            );
        } catch (err) {
            this.logger.error(`[UdpDiscovery] Failed to construct or send ${type} message`, err);
        }
    }

    /**
     * Handles an incoming UDP discovery message.
     * @param message The raw message buffer.
     * @param rinfo Information about the sender.
     */
    private handleDiscoveryMessage(message: Buffer, rinfo: dgram.RemoteInfo): void {
        try {
            const parsedMessage = JSON.parse(message.toString()) as DiscoveryMessage;

            // Ignore messages from self
            if (parsedMessage.instanceId === this.instanceId) {
                return;
            }

            // Basic validation
            if (!parsedMessage.type || !parsedMessage.instanceId || !parsedMessage.port || parsedMessage.version !== PROTOCOL_VERSION) {
                this.logger.warn(`[UdpDiscovery] Received invalid discovery message structure from ${rinfo.address}:${rinfo.port}`);
                return;
            }

            this.logger.info(`[UdpDiscovery] Received ${parsedMessage.type} message from ${rinfo.address}:${rinfo.port} (Peer ID: ${parsedMessage.instanceId})`);

            if (parsedMessage.type === NETWORK.BROADCAST_TYPES.DISCOVER) {
                // Respond to discovery request with an announcement
                this.logger.info(`[UdpDiscovery] Responding to DISCOVER from ${rinfo.address} with ANNOUNCE.`);
                this.sendAnnouncementTo(rinfo.address);
            } else if (parsedMessage.type === NETWORK.BROADCAST_TYPES.ANNOUNCE) {
                // Process peer announcement
                const peer: DiscoveredPeer = {
                    ip: rinfo.address,
                    port: parsedMessage.port,
                    instanceId: parsedMessage.instanceId
                };
                this.logger.info(`[UdpDiscovery] Discovered peer: ${peer.instanceId} at ${peer.ip}:${peer.port}`);
                this.emit('peerDiscovered', peer);
            } else {
                this.logger.warn(`[UdpDiscovery] Unknown discovery message type: ${parsedMessage.type} from ${rinfo.address}`);
            }

        } catch (err) {
            this.logger.error(`[UdpDiscovery] Error parsing discovery message from ${rinfo.address}:${rinfo.port}`, err);
        }
    }
}
