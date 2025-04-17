import { EventEmitter } from 'events';
import * as net from 'net';
import * as vscode from 'vscode';

/**
 * Interface for logging messages.
 */
export interface ILogger {
    info(message: string): void;
    warn(message: string): void;
    error(message: string, error?: any): void;
}

/**
 * Describes a discovered peer.
 */
export interface DiscoveredPeer {
    ip: string;
    port: number;
    instanceId: string;
}

/**
 * Interface for the core authentication logic and state management.
 */
export interface IAuthService extends EventEmitter {
    /** Initiates the authentication process for a given connection. */
    startAuthentication(connectionId: string, isInitiator: boolean): void;
    /** Handles an incoming message potentially related to authentication. */
    handleMessage(connectionId: string, message: any): boolean;
    /** Checks if authentication is currently in progress for a connection. */
    isAuthenticating(connectionId: string): boolean;
    /** Checks if a connection is successfully authenticated. */
    isAuthenticated(connectionId: string): boolean;
    /** Cancels any ongoing authentication for a connection. */
    cancelAuthentication(connectionId: string, reason: string): void;
    /** Cleans up resources associated with a connection ID. */
    cleanupConnection(connectionId: string): void;

    // Events
    on(event: 'authSucceeded', listener: (connectionId: string) => void): this;
    on(event: 'authFailed', listener: (connectionId: string, reason: string) => void): this;
    on(event: 'promptForUserInput', listener: (connectionId: string, prompt: string, isValidation: boolean) => void): this;
    // Add other necessary methods/properties
}

/**
 * Interface for handling the UI part of authentication (e.g., input prompts).
 */
export interface IAuthUI {
    /** Triggers the UI prompt for user input (animal names). */
    promptForAnimalNames(connectionId: string, promptMessage: string, isValidation: boolean): Promise<string[] | null>;
}

/**
 * Interface for UDP discovery operations.
 */
export interface IUdpDiscovery extends EventEmitter {
    start(): void;
    stop(): void;

    // Events
    on(event: 'peerDiscovered', listener: (peer: DiscoveredPeer) => void): this;
    // Add other necessary methods/properties
}

/**
 * Interface for the TCP server.
 */
export interface ITcpServer extends EventEmitter {
    start(): void;
    stop(): void;

    // Events
    on(event: 'incomingConnection', listener: (socket: net.Socket) => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
    // Add other necessary methods/properties
}

/**
 * Interface for the TCP client.
 */
export interface ITcpClient extends EventEmitter {
    connect(peer: DiscoveredPeer): void;
    disconnect(): void;

    // Events
    on(event: 'connectionEstablished', listener: (socket: net.Socket, peer: DiscoveredPeer) => void): this;
    on(event: 'connectionFailed', listener: (peer: DiscoveredPeer, error: Error) => void): this;
    // Add other necessary methods/properties
}

/**
 * Interface for managing a single network connection (socket).
 * Handles message framing, buffering, and integrates authentication.
 */
export interface IConnectionHandler extends EventEmitter {
    readonly id: string;
    readonly isAuthenticated: boolean;
    readonly remoteAddress: string | undefined;

    /** Sends a message over the connection. */
    sendMessage(message: any): boolean;
    /** Handles raw incoming data from the socket. */
    handleData(data: Buffer): void;
    /** Closes the connection. */
    close(): void;
    /** Starts the authentication process for this connection. */
    startAuthentication(isInitiator: boolean): void;

    // Events
    on(event: 'authenticated', listener: (connectionId: string) => void): this;
    on(event: 'authFailed', listener: (connectionId: string, reason: string) => void): this;
    on(event: 'disconnected', listener: (connectionId: string, hadError: boolean) => void): this;
    on(event: 'messageReceived', listener: (connectionId: string, message: any) => void): this;
    // Add other necessary methods/properties
}

/**
 * Interface for the Webview provider.
 */
export interface IWebviewProvider {
    updateConnectionStatus(connected: boolean): void;
    sendMessage(text: string): void;
    sendSystemMessage(text: string): void;
    clearChat(): void;
    onDidReceiveMessage: vscode.Event<any>; // Event for messages from webview to extension
    // Add other necessary methods/properties
}

/**
 * Interface for the main Network Manager orchestrator.
 */
export interface INetworkManager extends EventEmitter {
    start(): void;
    stop(): void;
    sendMessage(message: string): boolean;

    // Events (reflecting aggregated status)
    on(event: 'connected', listener: (peer: DiscoveredPeer) => void): this;
    on(event: 'disconnected', listener: (reason?: string) => void): this;
    on(event: 'messageReceived', listener: (message: string) => void): this;
    on(event: 'authFailed', listener: (reason: string) => void): this;
    on(event: 'peerDiscovered', listener: (peer: DiscoveredPeer) => void): this;
    // Add other necessary methods/properties
}
