import * as vscode from 'vscode';

/**
 * Interface for registering and executing VS Code commands.
 */
export interface ICommandService {
  /**
   * Registers a command with VS Code.
   * @param commandId The ID of the command to register
   * @param callback The function to execute when the command is invoked
   * @returns A disposable that can be used to unregister the command
   */
  registerCommand(commandId: string, callback: (...args: any[]) => any): vscode.Disposable;
  
  /**
   * Executes a command.
   * @param commandId The ID of the command to execute
   * @param args Arguments to pass to the command
   * @returns A promise that resolves with the command's result
   */
  executeCommand<T>(commandId: string, ...args: any[]): Thenable<T | undefined>;
  
  /**
   * Registers all commands for the extension.
   * @param context The extension context
   */
  registerAllCommands(context: vscode.ExtensionContext): void;
}
