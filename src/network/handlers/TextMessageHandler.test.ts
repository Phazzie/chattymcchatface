import { TextMessageHandler } from './TextMessageHandler';
import { ILogger } from '../../interfaces';
import { IMessageHandler } from '../interfaces/IMessageHandler';
import { MessageType } from '../interfaces/IMessage';
import { TextMessage } from '../messages/TextMessage';

describe('TextMessageHandler', () => {
  let mockLogger: ILogger;
  let mockMessageHandler: IMessageHandler;
  let textMessageHandler: TextMessageHandler;
  let registeredHandler: (connectionId: string, message: any) => boolean;
  
  beforeEach(() => {
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    } as unknown as ILogger;
    
    mockMessageHandler = {
      registerHandler: jest.fn((type, handler) => {
        if (type === MessageType.TEXT) {
          registeredHandler = handler;
        }
      }),
      handleMessage: jest.fn(),
      unregisterHandler: jest.fn(),
      on: jest.fn(),
      once: jest.fn(),
      emit: jest.fn()
    } as unknown as IMessageHandler;
    
    textMessageHandler = new TextMessageHandler(mockLogger, mockMessageHandler);
  });
  
  it('should register a handler for TEXT messages', () => {
    expect(mockMessageHandler.registerHandler).toHaveBeenCalledWith(
      MessageType.TEXT,
      expect.any(Function)
    );
  });
  
  it('should handle valid TEXT messages', () => {
    const connectionId = 'test-connection';
    const message = new TextMessage('Hello, world!');
    
    const result = registeredHandler(connectionId, message);
    
    expect(result).toBe(true);
    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.stringContaining(`Received TEXT message from ${connectionId}`)
    );
  });
  
  it('should reject invalid TEXT messages', () => {
    const connectionId = 'test-connection';
    const message = new TextMessage('');
    
    const result = registeredHandler(connectionId, message);
    
    expect(result).toBe(false);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining(`Invalid TEXT message from ${connectionId}`)
    );
  });
});
