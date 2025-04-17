import { IMessage } from '../interfaces/IMessage';
import { MessageFactoryImpl } from './MessageFactoryImpl';

/**
 * Factory for creating message objects from serialized data.
 * This is a facade for the MessageFactoryImpl to maintain backward compatibility.
 */
export class MessageFactory {
  /**
   * Creates a message from a serialized string.
   * @param data The serialized message
   * @returns The deserialized message, or null if invalid
   */
  public static fromSerialized(data: string): IMessage | null {
    return MessageFactoryImpl.fromSerialized(data);
  }

  /**
   * Creates a message from a parsed JSON object.
   * @param data The parsed JSON object
   * @returns The appropriate message object, or null if invalid
   */
  public static fromJSON(data: any): IMessage | null {
    return MessageFactoryImpl.fromJSON(data);
  }
}
