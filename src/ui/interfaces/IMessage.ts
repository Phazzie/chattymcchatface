/**
 * Interface for a message to be displayed in the UI.
 */
export interface IMessage {
    /** The text content of the message */
    text: string;
    /** The timestamp when the message was created */
    timestamp: Date;
}

/**
 * Interface for a user message.
 */
export interface IUserMessage extends IMessage {
    /** Whether the message was sent by the local user */
    isSelf: boolean;
}

/**
 * Interface for a system message.
 */
export interface ISystemMessage extends IMessage {
    /** System messages are always from the system */
    readonly isSystem: true;
}
