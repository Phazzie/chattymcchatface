import { MessageType } from '../interfaces/IMessage';
import { BaseMessage } from './BaseMessage';

/**
 * Represents a text message sent between peers.
 */
export class TextMessage extends BaseMessage {
  /**
   * Creates a new TextMessage.
   * @param content The text content of the message
   * @param sender Optional sender identifier
   * @param timestamp Optional timestamp (defaults to now)
   */
  constructor(
    public readonly content: string,
    public readonly sender?: string,
    public readonly timestamp: number = Date.now()
  ) {
    super(MessageType.TEXT);
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
      sender: this.sender,
      timestamp: this.timestamp
    };
  }
  
  /**
   * Creates a TextMessage from a parsed JSON object.
   * @param data The parsed JSON object
   * @returns A new TextMessage, or null if invalid
   */
  public static fromJSON(data: any): TextMessage | null {
    if (!data || typeof data !== 'object' || data.type !== MessageType.TEXT) {
      return null;
    }
    
    if (typeof data.content !== 'string' || data.content.length === 0) {
      return null;
    }
    
    return new TextMessage(
      data.content,
      data.sender,
      typeof data.timestamp === 'number' ? data.timestamp : Date.now()
    );
  }
}
