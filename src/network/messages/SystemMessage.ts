import { MessageType } from '../interfaces/IMessage';
import { BaseMessage } from './BaseMessage';

/**
 * Represents a system message for internal notifications.
 */
export class SystemMessage extends BaseMessage {
  /**
   * Creates a new SystemMessage.
   * @param content The system message content
   * @param timestamp Optional timestamp (defaults to now)
   */
  constructor(
    public readonly content: string,
    public readonly timestamp: number = Date.now()
  ) {
    super(MessageType.SYSTEM);
  }
  
  /**
   * Validates that the message is properly formed.
   * @returns True if the message is valid, false otherwise
   */
  public validate(): boolean {
    return typeof this.content === 'string' && this.content.length > 0;
  }
  
  /**
   * Converts the message to a plain object for serialization.
   * @returns A plain object representation of the message
   */
  protected toJSON(): Record<string, any> {
    return {
      type: this.type,
      content: this.content,
      timestamp: this.timestamp
    };
  }
  
  /**
   * Creates a SystemMessage from a parsed JSON object.
   * @param data The parsed JSON object
   * @returns A new SystemMessage, or null if invalid
   */
  public static fromJSON(data: any): SystemMessage | null {
    if (!data || typeof data !== 'object' || data.type !== MessageType.SYSTEM) {
      return null;
    }
    
    if (typeof data.content !== 'string' || data.content.length === 0) {
      return null;
    }
    
    return new SystemMessage(
      data.content,
      typeof data.timestamp === 'number' ? data.timestamp : Date.now()
    );
  }
}
