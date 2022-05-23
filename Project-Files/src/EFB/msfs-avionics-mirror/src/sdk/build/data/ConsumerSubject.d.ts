import { AbstractSubscribable } from '../sub/AbstractSubscribable';
import { Consumer } from './Consumer';
/**
 * A subscribable subject which derives its value from an event consumer.
 */
export declare class ConsumerSubject<T> extends AbstractSubscribable<T> {
    private readonly equalityFunc;
    private readonly mutateFunc?;
    private readonly consumerHandler;
    private value;
    private consumerSub?;
    private _isPaused;
    /**
     * Whether event consumption is currently paused for this subject. While paused, this subject's value will not
     * update.
     */
    get isPaused(): boolean;
    private isDestroyed;
    /**
     * Constructor.
     * @param consumer The event consumer from which this subject obtains its value. If null, this subject's value will
     * not be updated until its consumer is set to a non-null value.
     * @param initialVal This subject's initial value.
     * @param equalityFunc The function this subject uses check for equality between values.
     * @param mutateFunc The function this subject uses to change its value. If not defined, variable assignment is used
     * instead.
     */
    private constructor();
    /**
     * Creates a new instance of ConsumerSubject.
     * @param consumer The consumer from which the new subject obtains its value. If null, the new subject's value will
     * not be updated until the subject's consumer is set to a non-null value.
     * @param initialVal The new subject's initial value.
     * @param equalityFunc The function to use to check for equality between values. Defaults to the strict equality
     * comparison (`===`).
     */
    static create<T>(consumer: Consumer<T> | null, initialVal: T, equalityFunc?: (a: T, b: T) => boolean): ConsumerSubject<T>;
    /**
     * Creates a new instance of ConsumerSubject.
     * @param consumer The consumer from which the new subject obtains its value. If null, the new subject's value will
     * not be updated until the subject's consumer is set to a non-null value.
     * @param initialVal The new subject's initial value.
     * @param equalityFunc The function to use to check for equality between values.
     * @param mutateFunc The function to use to change the new subject's value.
     */
    static create<T>(consumer: Consumer<T> | null, initialVal: T, equalityFunc: (a: T, b: T) => boolean, mutateFunc: (oldVal: T, newVal: T) => void): ConsumerSubject<T>;
    /**
     * Consumes an event.
     * @param value The value of the event.
     */
    private onEventConsumed;
    /**
     * Sets the consumer from which this subject derives its value. If the consumer is null, this subject's value will
     * not be updated until a non-null consumer is set.
     * @param consumer An event consumer.
     * @returns This subject, after its consumer has been set.
     */
    setConsumer(consumer: Consumer<T> | null): this;
    /**
     * Pauses consuming events for this subject. Once paused, this subject's value will not be updated.
     * @returns This subject, after it has been paused.
     */
    pause(): this;
    /**
     * Resumes consuming events for this subject. Once resumed, this subject's value will be updated from consumed
     * events.
     * @returns This subject, after it has been resumed.
     */
    resume(): this;
    /** @inheritdoc */
    get(): T;
    /**
     * Destroys this subject. Once destroyed, it will no longer consume events to update its value.
     */
    destroy(): void;
}
//# sourceMappingURL=ConsumerSubject.d.ts.map