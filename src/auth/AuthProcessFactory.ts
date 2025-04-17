import { IAuthProcessFactory } from './interfaces/IAuthProcessFactory';
import { IAuthProcess } from './interfaces/IAuthProcess';
import { ITimer } from './interfaces/ITimer';
import { ILogger } from '../interfaces';
import { AuthProcess } from './AuthProcess';

/**
 * Factory for creating AuthProcess instances.
 */
export class AuthProcessFactory implements IAuthProcessFactory {
    constructor(private readonly timer: ITimer) {}

    create(
        connectionId: string,
        isInitiator: boolean,
        sendMessage: (message: string) => boolean,
        logger: ILogger
    ): IAuthProcess {
        return new AuthProcess(
            connectionId,
            isInitiator,
            sendMessage,
            this.timer,
            logger
        );
    }
}
