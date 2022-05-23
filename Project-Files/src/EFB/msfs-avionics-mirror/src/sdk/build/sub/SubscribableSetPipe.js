import { HandlerSubscription } from './HandlerSubscription';
import { SubscribableSetEventType } from './SubscribableSet';
/**
 * A pipe from an input subscribable set to an output mutable subscribable set. Each key added/removed notification
 * received by the pipe is used to add/remove keys to/from the output set.
 */
export class SubscribableSetPipe extends HandlerSubscription {
    // eslint-disable-next-line jsdoc/require-jsdoc
    constructor(from, to, arg3, arg4) {
        let handler;
        let initialNotifyFunc;
        let onDestroy;
        if (typeof arg4 === 'function') {
            const toCast = to;
            const map = arg3;
            handler = (set, type, key) => {
                if (type === SubscribableSetEventType.Added) {
                    toCast.add(map(key));
                }
                else {
                    const mappedKey = map(key);
                    // Only delete the mapped key if no other key in the input set maps to the same key
                    for (const inputKey of set) {
                        if (map(inputKey) === mappedKey) {
                            return;
                        }
                    }
                    toCast.delete(mappedKey);
                }
            };
            initialNotifyFunc = () => {
                const fromSet = from.get();
                const toAdd = new Set();
                for (const key of fromSet) {
                    toAdd.add(map(key));
                }
                for (const key of toCast.get()) {
                    if (!toAdd.delete(key)) {
                        toCast.delete(key);
                    }
                }
                for (const key of toAdd) {
                    toCast.add(key);
                }
            };
            onDestroy = arg4;
        }
        else {
            const toCast = to;
            handler = (set, type, key) => {
                if (type === SubscribableSetEventType.Added) {
                    toCast.add(key);
                }
                else {
                    toCast.delete(key);
                }
            };
            initialNotifyFunc = () => {
                const fromSet = from.get();
                const toAdd = new Set(fromSet);
                for (const key of to.get()) {
                    if (!toAdd.delete(key)) {
                        toCast.delete(key);
                    }
                }
                for (const key of toAdd) {
                    toCast.add(key);
                }
            };
            onDestroy = arg3;
        }
        super(handler, initialNotifyFunc, onDestroy);
    }
}
