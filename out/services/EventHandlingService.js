"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventHandlingService = void 0;
const events_1 = require("events");
/**
 * Service for handling events between components.
 * Implements the IEventHandlingService interface for SOLID compliance.
 */
class EventHandlingService extends events_1.EventEmitter {
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
    subscribe(eventName, listener) {
        return this.on(eventName, listener);
    }
    /**
     * Unsubscribes a listener from an event.
     * @param eventName The name of the event to unsubscribe from
     * @param listener The listener function to remove
     * @returns This instance for chaining
     */
    unsubscribe(eventName, listener) {
        return this.off(eventName, listener);
    }
    /**
     * Publishes an event with data.
     * @param eventName The name of the event to publish
     * @param data The data to pass to listeners
     * @returns This instance for chaining
     */
    publish(eventName, data) {
        return this.emit(eventName, data);
    }
    /**
     * Clears all listeners for an event.
     * @param eventName The name of the event to clear listeners for
     * @returns This instance for chaining
     */
    clearListeners(eventName) {
        return this.removeAllListeners(eventName);
    }
}
exports.EventHandlingService = EventHandlingService;
//# sourceMappingURL=EventHandlingService.js.map