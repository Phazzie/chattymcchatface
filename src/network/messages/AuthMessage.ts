import { MessageType } from '../interfaces/IMessage';
import { BaseMessage } from './BaseMessage';

/**
 * Base class for authentication-related messages.
 */
export abstract class AuthMessage extends BaseMessage {
  /**
   * Creates a new AuthMessage.
   * @param type The specific auth message type
   */
  constructor(type: MessageType) {
    super(type);
  }
}

/**
 * Authentication request message.
 */
export class AuthRequestMessage extends AuthMessage {
  /**
   * Creates a new AuthRequestMessage.
   */
  constructor() {
    super(MessageType.AUTH_REQ);
  }
  
  /**
   * Validates that the message is properly formed.
   * @returns True if the message is valid, false otherwise
   */
  public validate(): boolean {
    return true; // No additional fields to validate
  }
  
  /**
   * Converts the message to a plain object for serialization.
   * @returns A plain object representation of the message
   */
  protected toJSON(): Record<string, any> {
    return {
      type: this.type
    };
  }
  
  /**
   * Creates an AuthRequestMessage from a parsed JSON object.
   * @param data The parsed JSON object
   * @returns A new AuthRequestMessage, or null if invalid
   */
  public static fromJSON(data: any): AuthRequestMessage | null {
    if (!data || typeof data !== 'object' || data.type !== MessageType.AUTH_REQ) {
      return null;
    }
    
    return new AuthRequestMessage();
  }
}

/**
 * Authentication response message.
 */
export class AuthResponseMessage extends AuthMessage {
  /**
   * Creates a new AuthResponseMessage.
   * @param animalNames The animal names for authentication
   */
  constructor(public readonly animalNames: string[]) {
    super(MessageType.AUTH_RESP);
  }
  
  /**
   * Validates that the message is properly formed.
   * @returns True if the message is valid, false otherwise
   */
  public validate(): boolean {
    return Array.isArray(this.animalNames) && 
           this.animalNames.length > 0 && 
           this.animalNames.every(name => typeof name === 'string' && name.length > 0);
  }
  
  /**
   * Converts the message to a plain object for serialization.
   * @returns A plain object representation of the message
   */
  protected toJSON(): Record<string, any> {
    return {
      type: this.type,
      payload: this.animalNames
    };
  }
  
  /**
   * Creates an AuthResponseMessage from a parsed JSON object.
   * @param data The parsed JSON object
   * @returns A new AuthResponseMessage, or null if invalid
   */
  public static fromJSON(data: any): AuthResponseMessage | null {
    if (!data || typeof data !== 'object' || data.type !== MessageType.AUTH_RESP) {
      return null;
    }
    
    if (!Array.isArray(data.payload) || 
        data.payload.length === 0 || 
        !data.payload.every((name: any) => typeof name === 'string' && name.length > 0)) {
      return null;
    }
    
    return new AuthResponseMessage(data.payload);
  }
}

/**
 * Authentication success message.
 */
export class AuthSuccessMessage extends AuthMessage {
  /**
   * Creates a new AuthSuccessMessage.
   */
  constructor() {
    super(MessageType.AUTH_SUCCESS);
  }
  
  /**
   * Validates that the message is properly formed.
   * @returns True if the message is valid, false otherwise
   */
  public validate(): boolean {
    return true; // No additional fields to validate
  }
  
  /**
   * Converts the message to a plain object for serialization.
   * @returns A plain object representation of the message
   */
  protected toJSON(): Record<string, any> {
    return {
      type: this.type
    };
  }
  
  /**
   * Creates an AuthSuccessMessage from a parsed JSON object.
   * @param data The parsed JSON object
   * @returns A new AuthSuccessMessage, or null if invalid
   */
  public static fromJSON(data: any): AuthSuccessMessage | null {
    if (!data || typeof data !== 'object' || data.type !== MessageType.AUTH_SUCCESS) {
      return null;
    }
    
    return new AuthSuccessMessage();
  }
}

/**
 * Authentication failure message.
 */
export class AuthFailMessage extends AuthMessage {
  /**
   * Creates a new AuthFailMessage.
   * @param reason The reason for authentication failure
   */
  constructor(public readonly reason: string) {
    super(MessageType.AUTH_FAIL);
  }
  
  /**
   * Validates that the message is properly formed.
   * @returns True if the message is valid, false otherwise
   */
  public validate(): boolean {
    return typeof this.reason === 'string';
  }
  
  /**
   * Converts the message to a plain object for serialization.
   * @returns A plain object representation of the message
   */
  protected toJSON(): Record<string, any> {
    return {
      type: this.type,
      payload: this.reason
    };
  }
  
  /**
   * Creates an AuthFailMessage from a parsed JSON object.
   * @param data The parsed JSON object
   * @returns A new AuthFailMessage, or null if invalid
   */
  public static fromJSON(data: any): AuthFailMessage | null {
    if (!data || typeof data !== 'object' || data.type !== MessageType.AUTH_FAIL) {
      return null;
    }
    
    const reason = typeof data.payload === 'string' ? data.payload : 'Unknown error';
    return new AuthFailMessage(reason);
  }
}
