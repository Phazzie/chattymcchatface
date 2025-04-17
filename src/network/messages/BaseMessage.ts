import { IMessage, MessageType } from '../interfaces/IMessage';

/**
 * Base class for all message implementations.
 * Provides common functionality for serialization and validation.
 */
export abstract class BaseMessage implements IMessage {
  /**
   * Creates a new BaseMessage.
   * @param type The type of message
   */
  constructor(public readonly type: MessageType) {}
  
  /**
   * Serializes the message to a string for transmission.
   * @returns The serialized message
   */
  public serialize(): string {
    return JSON.stringify(this.toJSON());
  }
  
  /**
   * Validates that the message is properly formed.
   * @returns True if the message is valid, false otherwise
   */
  public abstract validate(): boolean;
  
  /**
   * Converts the message to a plain object for serialization.
   * @returns A plain object representation of the message
   */
  protected abstract toJSON(): Record<string, any>;
  
  /**
   * Creates a message from a serialized string.
   * @param data The serialized message
   * @returns The deserialized message, or null if invalid
   */
  public static fromSerialized(data: string): IMessage | null {
    try {
      const parsed = JSON.parse(data);
      if (!parsed || typeof parsed !== 'object' || !parsed.type) {
        return null;
      }
      
      // Delegate to the appropriate factory based on message type
      // This will be implemented by subclasses
      return null;
    } catch (error) {
      return null;
    }
  }
}
