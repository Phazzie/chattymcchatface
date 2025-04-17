import { IMessage, MessageType } from '../../interfaces/IMessage';
import { TextMessage } from '../TextMessage';

/**
 * Factory for creating TextMessage objects.
 */
export class TextMessageFactory {
  /**
   * Creates a TextMessage from a parsed JSON object.
   * @param data The parsed JSON object
   * @returns A new TextMessage, or null if invalid
   */
  public static fromJSON(data: any): IMessage | null {
    if (data.type !== MessageType.TEXT) {
      return null;
    }
    
    return TextMessage.fromJSON(data);
  }
}
