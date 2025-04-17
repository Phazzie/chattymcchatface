import { IAuthProcess } from './IAuthProcess';
import { ILogger } from '../../interfaces'; // Assuming common interfaces path

/**
 * Defines the contract for creating instances of IAuthProcess.
 */
export interface IAuthProcessFactory {
    create(
        connectionId: string,
        isInitiator: boolean,
        sendMessage: (message: string) => boolean, // Function to send messages
        logger: ILogger
        // Potentially add IUserInteraction dependency here if needed
    ): IAuthProcess;
}
