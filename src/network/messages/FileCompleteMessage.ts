import { MessageType } from '../interfaces/IMessage';
import { FileMessageBase } from './FileMessageBase';

/**
 * File transfer complete message.
 */
export class FileCompleteMessage extends FileMessageBase {
  /**
   * Creates a new FileCompleteMessage.
   * @param transferId Unique ID for the file transfer
   */
  constructor(
    public readonly transferId: string
  ) {
    super(MessageType.FILE_COMPLETE);
  }
  
  /**
   * Validates that the message is properly formed.
   * @returns True if the message is valid, false otherwise
   */
  public validate(): boolean {
    return typeof this.transferId === 'string' && this.transferId.length > 0;
  }
  
  /**
   * Converts the message to a plain object for serialization.
   * @returns A plain object representation of the message
   */
  protected toJSON(): Record<string, any> {
    return {
      type: this.type,
      transferId: this.transferId
    };
  }
  
  /**
   * Creates a FileCompleteMessage from a parsed JSON object.
   * @param data The parsed JSON object
   * @returns A new FileCompleteMessage, or null if invalid
   */
  public static fromJSON(data: any): FileCompleteMessage | null {
    if (!data || typeof data !== 'object' || data.type !== MessageType.FILE_COMPLETE) {
      return null;
    }
    
    if (typeof data.transferId !== 'string' || data.transferId.length === 0) {
      return null;
    }
    
    return new FileCompleteMessage(data.transferId);
  }
}
