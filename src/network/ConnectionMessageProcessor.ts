import { ILogger, IAuthService } from '../interfaces';
import { IMessageHandler } from './interfaces/IMessageHandler';
import { MessageFactoryImpl } from './messages/MessageFactoryImpl';

/**
 * Processes messages for a connection.
 */
export class ConnectionMessageProcessor {
  private dataBuffer: string = '';
  
  /**
   * Creates a new ConnectionMessageProcessor.
   * @param connectionId The ID of the connection
   * @param logger The logger instance
   * @param authService The authentication service
   * @param messageHandler The message handler
   * @param isAuthenticatedFn Function to check if the connection is authenticated
   */
  constructor(
    private readonly connectionId: string,
    private readonly logger: ILogger,
    private readonly authService: IAuthService,
    private readonly messageHandler: IMessageHandler,
    private readonly isAuthenticatedFn: () => boolean
  ) {}
  
  /**
   * Processes incoming data.
   * @param data The data to process
   */
  public processData(data: Buffer): void {
    this.dataBuffer += data.toString();
    this.processDataBuffer();
  }
  
  /**
   * Processes the data buffer.
   */
  private processDataBuffer(): void {
    const messages = this.dataBuffer.split('\n');
    this.dataBuffer = messages.pop() || '';
    
    for (const messageStr of messages) {
      if (!messageStr.trim()) continue;
      this.processMessage(messageStr);
    }
  }
  
  /**
   * Processes a single message.
   * @param messageStr The message string to process
   */
  private processMessage(messageStr: string): void {
    try {
      // Try to create a message object from the serialized data
      const message = MessageFactoryImpl.fromSerialized(messageStr);
      
      if (!message) {
        this.tryHandleLegacyAuthMessage(messageStr);
        return;
      }
      
      // Handle the message based on authentication state
      if (this.isAuthenticatedFn()) {
        // Use the message handler for authenticated messages
        this.messageHandler.handleMessage(this.connectionId, message);
      } else {
        this.logger.warn(
          `[ConnectionMessageProcessor] ${this.connectionId}: ` +
          `Received message of type ${message.type} while not authenticated`
        );
      }
    } catch (err) {
      this.logger.error(
        `[ConnectionMessageProcessor] ${this.connectionId}: ` +
        `Error processing message: ${messageStr}`, 
        err
      );
    }
  }
  
  /**
   * Tries to handle a message as a legacy auth message.
   * @param messageStr The message string to process
   */
  private tryHandleLegacyAuthMessage(messageStr: string): void {
    try {
      const parsedJson = JSON.parse(messageStr);
      if (this.authService.handleMessage(this.connectionId, parsedJson)) {
        return; // Auth service handled it
      }
    } catch (parseErr) {
      this.logger.error(
        `[ConnectionMessageProcessor] ${this.connectionId}: ` +
        `Error parsing message as JSON: ${messageStr}`, 
        parseErr
      );
      return;
    }
    
    this.logger.warn(
      `[ConnectionMessageProcessor] ${this.connectionId}: ` +
      `Received invalid message format: ${messageStr}`
    );
  }
}
