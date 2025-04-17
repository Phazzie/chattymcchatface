import { ILogger } from '../../interfaces';
import { IMessage, MessageType } from '../interfaces/IMessage';
import { 
  AuthMessage, 
  AuthRequestMessage, 
  AuthResponseMessage, 
  AuthSuccessMessage, 
  AuthFailMessage 
} from '../messages/AuthMessage';
import { IMessageHandler } from '../interfaces/IMessageHandler';
import { IAuthService } from '../../interfaces';

/**
 * Handles authentication-related messages.
 */
export class AuthMessageHandler {
  /**
   * Creates a new AuthMessageHandler.
   * @param logger The logger instance
   * @param authService The authentication service
   * @param messageHandler The message handler to register with
   */
  constructor(
    private readonly logger: ILogger,
    private readonly authService: IAuthService,
    messageHandler: IMessageHandler
  ) {
    // Register handlers for all auth message types
    messageHandler.registerHandler(
      MessageType.AUTH_REQ,
      (connectionId: string, message: IMessage): boolean => 
        this.handleAuthMessage(connectionId, message as AuthRequestMessage)
    );
    
    messageHandler.registerHandler(
      MessageType.AUTH_RESP,
      (connectionId: string, message: IMessage): boolean => 
        this.handleAuthMessage(connectionId, message as AuthResponseMessage)
    );
    
    messageHandler.registerHandler(
      MessageType.AUTH_SUCCESS,
      (connectionId: string, message: IMessage): boolean => 
        this.handleAuthMessage(connectionId, message as AuthSuccessMessage)
    );
    
    messageHandler.registerHandler(
      MessageType.AUTH_FAIL,
      (connectionId: string, message: IMessage): boolean => 
        this.handleAuthMessage(connectionId, message as AuthFailMessage)
    );
    
    this.logger.info('[AuthMessageHandler] Registered handlers for AUTH messages');
  }
  
  /**
   * Handles an authentication message.
   * @param connectionId The ID of the connection that received the message
   * @param message The auth message to handle
   * @returns True if the message was handled successfully, false otherwise
   */
  private handleAuthMessage(connectionId: string, message: AuthMessage): boolean {
    if (!message.validate()) {
      this.logger.warn(`[AuthMessageHandler] Invalid AUTH message of type ${message.type} from ${connectionId}`);
      return false;
    }
    
    this.logger.info(`[AuthMessageHandler] Received AUTH message of type ${message.type} from ${connectionId}`);
    
    // Delegate to the auth service
    return this.authService.handleMessage(connectionId, message);
  }
}
