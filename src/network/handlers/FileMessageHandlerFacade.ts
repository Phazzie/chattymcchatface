import { ILogger } from '../../interfaces';
import { IMessageHandler } from '../interfaces/IMessageHandler';
import { EventEmitter } from 'events';
import { FileRequestMessageHandler } from './FileRequestMessageHandler';
import { FileChunkMessageHandler } from './FileChunkMessageHandler';
import { FileCompleteMessageHandler } from './FileCompleteMessageHandler';

/**
 * Facade for all file-related message handlers.
 * Coordinates the individual handlers and provides a unified event interface.
 */
export class FileMessageHandlerFacade extends EventEmitter {
  private readonly requestHandler: FileRequestMessageHandler;
  private readonly chunkHandler: FileChunkMessageHandler;
  private readonly completeHandler: FileCompleteMessageHandler;
  
  /**
   * Creates a new FileMessageHandlerFacade.
   * @param logger The logger instance
   * @param messageHandler The message handler to register with
   */
  constructor(
    logger: ILogger,
    messageHandler: IMessageHandler
  ) {
    super();
    
    // Create the individual handlers
    this.requestHandler = new FileRequestMessageHandler(logger, messageHandler);
    this.chunkHandler = new FileChunkMessageHandler(logger, messageHandler);
    this.completeHandler = new FileCompleteMessageHandler(logger, messageHandler);
    
    // Forward events from the individual handlers
    this.setupEventForwarding();
    
    logger.info('[FileMessageHandlerFacade] Initialized all file message handlers');
  }
  
  /**
   * Sets up event forwarding from the individual handlers to this facade.
   */
  private setupEventForwarding(): void {
    // Forward file request events
    this.requestHandler.on('fileRequest', 
      (connectionId, transferId, fileName, fileSize) => {
        this.emit('fileRequest', connectionId, transferId, fileName, fileSize);
      }
    );
    
    // Forward file chunk events
    this.chunkHandler.on('fileChunk', 
      (connectionId, transferId, chunkIndex, totalChunks, data) => {
        this.emit('fileChunk', connectionId, transferId, chunkIndex, totalChunks, data);
      }
    );
    
    // Forward file complete events
    this.completeHandler.on('fileComplete', 
      (connectionId, transferId) => {
        this.emit('fileComplete', connectionId, transferId);
      }
    );
  }
}
