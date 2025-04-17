import { IMessage, MessageType } from '../../interfaces/IMessage';
import { FileRequestMessage } from '../FileRequestMessage';
import { FileChunkMessage } from '../FileChunkMessage';
import { FileCompleteMessage } from '../FileCompleteMessage';

/**
 * Factory for creating file-related message objects.
 */
export class FileMessageFactory {
  /**
   * Creates a file message from a parsed JSON object.
   * @param data The parsed JSON object
   * @returns A new file message, or null if invalid
   */
  public static fromJSON(data: any): IMessage | null {
    if (!data || typeof data !== 'object') {
      return null;
    }
    
    switch (data.type) {
      case MessageType.FILE_REQ:
        return FileRequestMessage.fromJSON(data);
      case MessageType.FILE_CHUNK:
        return FileChunkMessage.fromJSON(data);
      case MessageType.FILE_COMPLETE:
        return FileCompleteMessage.fromJSON(data);
      default:
        return null;
    }
  }
  
  /**
   * Checks if the message type is a file message type.
   * @param type The message type to check
   * @returns True if it's a file message type, false otherwise
   */
  public static isFileMessageType(type: string): boolean {
    return type === MessageType.FILE_REQ ||
           type === MessageType.FILE_CHUNK ||
           type === MessageType.FILE_COMPLETE;
  }
}
