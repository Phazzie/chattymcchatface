import { MessageType } from '../interfaces/IMessage';
import { FileMessageBase } from './FileMessageBase';

/**
 * File transfer request message.
 */
export class FileRequestMessage extends FileMessageBase {
  /**
   * Creates a new FileRequestMessage.
   * @param transferId Unique ID for the file transfer
   * @param fileName Name of the file being transferred
   * @param fileSize Size of the file in bytes
   */
  constructor(
    public readonly transferId: string,
    public readonly fileName: string,
    public readonly fileSize: number
  ) {
    super(MessageType.FILE_REQ);
  }
  
  /**
   * Validates that the message is properly formed.
   * @returns True if the message is valid, false otherwise
   */
  public validate(): boolean {
    return (
      typeof this.transferId === 'string' && 
      this.transferId.length > 0 &&
      typeof this.fileName === 'string' && 
      this.fileName.length > 0 &&
      typeof this.fileSize === 'number' && 
      this.fileSize > 0
    );
  }
  
  /**
   * Converts the message to a plain object for serialization.
   * @returns A plain object representation of the message
   */
  protected toJSON(): Record<string, any> {
    return {
      type: this.type,
      transferId: this.transferId,
      fileName: this.fileName,
      fileSize: this.fileSize
    };
  }
  
  /**
   * Creates a FileRequestMessage from a parsed JSON object.
   * @param data The parsed JSON object
   * @returns A new FileRequestMessage, or null if invalid
   */
  public static fromJSON(data: any): FileRequestMessage | null {
    if (!data || typeof data !== 'object' || data.type !== MessageType.FILE_REQ) {
      return null;
    }
    
    if (
      typeof data.transferId !== 'string' || 
      data.transferId.length === 0 ||
      typeof data.fileName !== 'string' || 
      data.fileName.length === 0 ||
      typeof data.fileSize !== 'number' || 
      data.fileSize <= 0
    ) {
      return null;
    }
    
    return new FileRequestMessage(
      data.transferId,
      data.fileName,
      data.fileSize
    );
  }
}
