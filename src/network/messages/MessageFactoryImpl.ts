import { IMessage, MessageType } from '../interfaces/IMessage';
import { TextMessageFactory } from './factories/TextMessageFactory';
import { AuthMessageFactory } from './factories/AuthMessageFactory';
import { SystemMessageFactory } from './factories/SystemMessageFactory';
import { FileMessageFactory } from './factories/FileMessageFactory';

/**
 * Factory for creating message objects from serialized data.
 */
export class MessageFactoryImpl {
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
      
      return MessageFactoryImpl.fromJSON(parsed);
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Creates a message from a parsed JSON object.
   * @param data The parsed JSON object
   * @returns The appropriate message object, or null if invalid
   */
  public static fromJSON(data: any): IMessage | null {
    if (!data || typeof data !== 'object' || !data.type) {
      return null;
    }
    
    // Try each specialized factory
    const message = 
      TextMessageFactory.fromJSON(data) ||
      AuthMessageFactory.fromJSON(data) ||
      SystemMessageFactory.fromJSON(data) ||
      FileMessageFactory.fromJSON(data);
    
    return message;
  }
}
