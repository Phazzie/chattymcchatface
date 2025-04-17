import { ITimer } from '../interfaces/ITimer';

/**
 * Concrete implementation of ITimer using NodeJS global functions.
 */
export class NodeTimer implements ITimer {
    set(callback: () => void, ms: number): NodeJS.Timeout {
        return setTimeout(callback, ms);
    }

    clear(handle: NodeJS.Timeout | null): void {
        if (handle) {
            clearTimeout(handle);
        }
    }
}
