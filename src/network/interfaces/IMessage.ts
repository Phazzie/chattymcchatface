/**
 * Defines the message types used in the chat application.
 */
export enum MessageType {
  TEXT = 'TEXT',
  AUTH_REQ = 'AUTH_REQ',
  AUTH_RESP = 'AUTH_RESP',
  AUTH_SUCCESS = 'AUTH_SUCCESS',
  AUTH_FAIL = 'AUTH_FAIL',
  SYSTEM = 'SYSTEM',
  FILE_REQ = 'FILE_REQ',
  FILE_CHUNK = 'FILE_CHUNK',
  FILE_COMPLETE = 'FILE_COMPLETE'
}

/**
 * Base interface for all messages in the system.
 * All message types must implement this interface.
 */
export interface IMessage {
  /**
   * The type of message.
   */
  type: MessageType;
  
  /**
   * Serializes the message to a string for transmission.
   */
  serialize(): string;
  
  /**
   * Validates that the message is properly formed.
   */
  validate(): boolean;
}

/**
 * Factory function type for creating messages from serialized data.
 */
export type MessageFactory = (data: string) => IMessage | null;
