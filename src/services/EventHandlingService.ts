import { EventEmitter } from 'events';
import { IEventHandlingService } from './interfaces/IEventHandlingService';

/**
 * Service for handling events between components.
 * Implements the IEventHandlingService interface for SOLID compliance.
 */
export class EventHandlingService extends EventEmitter implements IEventHandlingService {
    /**
     * Creates a new EventHandlingService.
     */
    constructor() {
        super();
        this.setMaxListeners(100); // Allow many listeners
    }
    
    /**
     * Subscribes to an event with a listener.
     * @param eventName The name of the event to subscribe to
     * @param listener The listener function to call when the event is emitted
     * @returns This instance for chaining
     */
    public subscribe<T>(eventName: string, listener: (data: T) => void): this {
        return this.on(eventName, listener);
    }
    
    /**
     * Unsubscribes a listener from an event.
     * @param eventName The name of the event to unsubscribe from
     * @param listener The listener function to remove
     * @returns This instance for chaining
     */
    public unsubscribe<T>(eventName: string, listener: (data: T) => void): this {
        return this.off(eventName, listener);
    }
    
    /**
     * Publishes an event with data.
     * @param eventName The name of the event to publish
     * @param data The data to pass to listeners
     * @returns This instance for chaining
     */
    public publish<T>(eventName: string, data: T): this {
        return this.emit(eventName, data);
    }
    
    /**
     * Clears all listeners for an event.
     * @param eventName The name of the event to clear listeners for
     * @returns This instance for chaining
     */
    public clearListeners(eventName: string): this {
        return this.removeAllListeners(eventName);
    }
}
