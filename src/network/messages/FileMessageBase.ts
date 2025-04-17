import { MessageType } from '../interfaces/IMessage';
import { BaseMessage } from './BaseMessage';

/**
 * Base class for file-related messages.
 */
export abstract class FileMessageBase extends BaseMessage {
  /**
   * Creates a new FileMessageBase.
   * @param type The specific file message type
   */
  constructor(type: MessageType) {
    super(type);
  }
}
