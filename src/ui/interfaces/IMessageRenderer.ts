/**
 * Interface for rendering different types of messages in the UI.
 */
export interface IMessageRenderer {
    /** Renders a user message */
    renderUserMessage(text: string, isSelf: boolean): void;
    /** Renders a system message */
    renderSystemMessage(text: string): void;
    /** Clears all messages */
    clearMessages(): void;
}
