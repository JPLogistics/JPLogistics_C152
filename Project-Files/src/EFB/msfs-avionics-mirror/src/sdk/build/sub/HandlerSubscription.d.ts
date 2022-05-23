import { Subscription } from './Subscription';
/**
 * A {@link Subscription} which executes a handler function every time it receives a notification.
 */
export declare class HandlerSubscription<HandlerType extends (...args: any[]) => void> implements Subscription {
    readonly handler: HandlerType;
    private readonly initialNotifyFunc?;
    private readonly onDestroy?;
    private _isAlive;
    /** @inheritdoc */
    get isAlive(): boolean;
    private _isPaused;
    /** @inheritdoc */
    get isPaused(): boolean;
    /** @inheritdoc */
    readonly canInitialNotify: boolean;
    /**
     * Constructor.
     * @param handler This subscription's handler. The handler will be called each time this subscription receives a
     * notification from its source.
     * @param initialNotifyFunc A function which sends initial notifications to this subscription. If not defined, this
     * subscription will not support initial notifications.
     * @param onDestroy A function which is called when this subscription is destroyed.
     */
    constructor(handler: HandlerType, initialNotifyFunc?: ((sub: HandlerSubscription<HandlerType>) => void) | undefined, onDestroy?: ((sub: HandlerSubscription<HandlerType>) => void) | undefined);
    /**
     * Sends an initial notification to this subscription.
     * @throws Error if this subscription is not alive.
     */
    initialNotify(): void;
    /** @inheritdoc */
    pause(): void;
    /** @inheritdoc */
    resume(initialNotify?: boolean): void;
    /** @inheritdoc */
    destroy(): void;
}
//# sourceMappingURL=HandlerSubscription.d.ts.map