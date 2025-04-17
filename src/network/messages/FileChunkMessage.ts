import { MessageType } from '../interfaces/IMessage';
import { FileMessageBase } from './FileMessageBase';

/**
 * File chunk message for transferring file data.
 */
export class FileChunkMessage extends FileMessageBase {
  /**
   * Creates a new FileChunkMessage.
   * @param transferId Unique ID for the file transfer
   * @param chunkIndex Index of this chunk
   * @param totalChunks Total number of chunks
   * @param data Base64-encoded chunk data
   */
  constructor(
    public readonly transferId: string,
    public readonly chunkIndex: number,
    public readonly totalChunks: number,
    public readonly data: string
  ) {
    super(MessageType.FILE_CHUNK);
  }
  
  /**
   * Validates that the message is properly formed.
   * @returns True if the message is valid, false otherwise
   */
  public validate(): boolean {
    return (
      typeof this.transferId === 'string' && 
      this.transferId.length > 0 &&
      typeof this.chunkIndex === 'number' && 
      this.chunkIndex >= 0 &&
      typeof this.totalChunks === 'number' && 
      this.totalChunks > 0 &&
      this.chunkIndex < this.totalChunks &&
      typeof this.data === 'string' && 
      this.data.length > 0
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
      chunkIndex: this.chunkIndex,
      totalChunks: this.totalChunks,
      data: this.data
    };
  }
  
  /**
   * Creates a FileChunkMessage from a parsed JSON object.
   * @param data The parsed JSON object
   * @returns A new FileChunkMessage, or null if invalid
   */
  public static fromJSON(data: any): FileChunkMessage | null {
    if (!data || typeof data !== 'object' || data.type !== MessageType.FILE_CHUNK) {
      return null;
    }
    
    if (
      typeof data.transferId !== 'string' || 
      data.transferId.length === 0 ||
      typeof data.chunkIndex !== 'number' || 
      data.chunkIndex < 0 ||
      typeof data.totalChunks !== 'number' || 
      data.totalChunks <= 0 ||
      data.chunkIndex >= data.totalChunks ||
      typeof data.data !== 'string' || 
      data.data.length === 0
    ) {
      return null;
    }
    
    return new FileChunkMessage(
      data.transferId,
      data.chunkIndex,
      data.totalChunks,
      data.data
    );
  }
}
