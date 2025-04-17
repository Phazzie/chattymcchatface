import { EventEmitter } from 'events';

/**
 * Interface for handling events between components.
 * Provides a central event bus for the application.
 */
export interface IEventHandlingService extends EventEmitter {
  /**
   * Subscribes to an event with a listener.
   * @param eventName The name of the event to subscribe to
   * @param listener The listener function to call when the event is emitted
   * @returns This instance for chaining
   */
  subscribe<T>(eventName: string, listener: (data: T) => void): this;
  
  /**
   * Unsubscribes a listener from an event.
   * @param eventName The name of the event to unsubscribe from
   * @param listener The listener function to remove
   * @returns This instance for chaining
   */
  unsubscribe<T>(eventName: string, listener: (data: T) => void): this;
  
  /**
   * Publishes an event with data.
   * @param eventName The name of the event to publish
   * @param data The data to pass to listeners
   * @returns This instance for chaining
   */
  publish<T>(eventName: string, data: T): this;
  
  /**
   * Clears all listeners for an event.
   * @param eventName The name of the event to clear listeners for
   * @returns This instance for chaining
   */
  clearListeners(eventName: string): this;
}
