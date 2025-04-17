/**
 * Interface for handling UI events.
 */
export interface IUIEventHandler {
    /** Handles a message send event */
    handleSendMessage(text: string): void;
    /** Handles a clear chat event */
    handleClearChat(): void;
    /** Initializes event listeners */
    initializeEventListeners(): void;
}
