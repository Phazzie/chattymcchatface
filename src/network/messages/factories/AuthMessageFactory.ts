import { IMessage, MessageType } from '../../interfaces/IMessage';
import { 
  AuthRequestMessage, 
  AuthResponseMessage, 
  AuthSuccessMessage, 
  AuthFailMessage 
} from '../AuthMessage';

/**
 * Factory for creating auth-related message objects.
 */
export class AuthMessageFactory {
  /**
   * Creates an auth message from a parsed JSON object.
   * @param data The parsed JSON object
   * @returns A new auth message, or null if invalid
   */
  public static fromJSON(data: any): IMessage | null {
    if (!data || typeof data !== 'object') {
      return null;
    }
    
    switch (data.type) {
      case MessageType.AUTH_REQ:
        return AuthRequestMessage.fromJSON(data);
      case MessageType.AUTH_RESP:
        return AuthResponseMessage.fromJSON(data);
      case MessageType.AUTH_SUCCESS:
        return AuthSuccessMessage.fromJSON(data);
      case MessageType.AUTH_FAIL:
        return AuthFailMessage.fromJSON(data);
      default:
        return null;
    }
  }
  
  /**
   * Checks if the message type is an auth message type.
   * @param type The message type to check
   * @returns True if it's an auth message type, false otherwise
   */
  public static isAuthMessageType(type: string): boolean {
    return type === MessageType.AUTH_REQ ||
           type === MessageType.AUTH_RESP ||
           type === MessageType.AUTH_SUCCESS ||
           type === MessageType.AUTH_FAIL;
  }
}
