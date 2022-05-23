import { HandlerSubscription } from './HandlerSubscription';
/**
 * A pipe from an input subscribable to an output mutable subscribable. Each notification received by the pipe is used
 * to change the state of the output subscribable.
 */
export class SubscribablePipe extends HandlerSubscription {
    // eslint-disable-next-line jsdoc/require-jsdoc
    constructor(from, to, arg3, arg4) {
        let handler;
        let onDestroy;
        if (typeof arg4 === 'function') {
            handler = (input) => {
                to.set(arg3(input));
            };
            onDestroy = arg4;
        }
        else {
            handler = (input) => {
                to.set(input);
            };
            onDestroy = arg3;
        }
        super(handler, (sub) => { sub.handler(from.get()); }, onDestroy);
    }
}
