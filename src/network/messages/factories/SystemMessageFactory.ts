import { IMessage, MessageType } from '../../interfaces/IMessage';
import { SystemMessage } from '../SystemMessage';

/**
 * Factory for creating SystemMessage objects.
 */
export class SystemMessageFactory {
  /**
   * Creates a SystemMessage from a parsed JSON object.
   * @param data The parsed JSON object
   * @returns A new SystemMessage, or null if invalid
   */
  public static fromJSON(data: any): IMessage | null {
    if (data.type !== MessageType.SYSTEM) {
      return null;
    }
    
    return SystemMessage.fromJSON(data);
  }
}
