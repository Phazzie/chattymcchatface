import { IMessage, MessageType } from '../interfaces/IMessage';
import { TextMessage } from './TextMessage';
import { 
  AuthRequestMessage, 
  AuthResponseMessage, 
  AuthSuccessMessage, 
  AuthFailMessage 
} from './AuthMessage';
import { SystemMessage } from './SystemMessage';

/**
 * Factory for creating message objects from serialized data.
 */
export class MessageFactory {
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
      
      return MessageFactory.fromJSON(parsed);
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
    
    switch (data.type) {
      case MessageType.TEXT:
        return TextMessage.fromJSON(data);
      case MessageType.AUTH_REQ:
        return AuthRequestMessage.fromJSON(data);
      case MessageType.AUTH_RESP:
        return AuthResponseMessage.fromJSON(data);
      case MessageType.AUTH_SUCCESS:
        return AuthSuccessMessage.fromJSON(data);
      case MessageType.AUTH_FAIL:
        return AuthFailMessage.fromJSON(data);
      case MessageType.SYSTEM:
        return SystemMessage.fromJSON(data);
      default:
        return null;
    }
  }
}
