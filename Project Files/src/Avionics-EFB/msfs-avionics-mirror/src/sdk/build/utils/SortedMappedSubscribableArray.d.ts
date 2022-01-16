import { SubscribableArray, SubscribableArrayEventType } from './Subscribable';
/**
 * A subscribable which provides a sorted version of a source SubscribableArray.
 */
export declare class SortedMappedSubscribableArray<T> implements SubscribableArray<T> {
    private readonly source;
    private readonly comparatorFunc;
    private readonly equalityFunc?;
    private readonly subs;
    private sorted;
    private sourceHandler;
    /** @inheritdoc */
    get length(): number;
    /**
     * Constructor.
     * @param source The source array subject for this subscribable.
     * @param comparatorFunc A function which defines the relative sorting priority of two elements. The function should
     * return 0 if its arguments are to be sorted identically, a negative number if the first argument is to be sorted
     * before the second argument, and a positive number if the first argument is to be sorted after the second argument.
     * @param equalityFunc A function which checks if two elements are equal. Defaults to the strict equality comparison
     * (`===`) if not defined.
     */
    private constructor();
    /**
     * Responds to changes in this subscribable's source array.
     * @param index The index of the change.
     * @param type The type of change.
     * @param item The item(s) involved in the change, if any.
     */
    private onSourceChanged;
    /**
     * Inserts elements into this array.
     * @param elements An element or array of elements to insert.
     */
    private insert;
    /**
     * Removes elements from this array.
     * @param elements An element or array of elements to remove.
     */
    private remove;
    /**
     * Notifies subscribers of a change in this array.
     * @param index The index that was changed.
     * @param type The type of subject event.
     * @param modifiedItem The item modified by the operation.
     * @private
     */
    private notifySubs;
    /** @inheritdoc */
    getArray(): readonly T[];
    /** @inheritdoc */
    get(index: number): T;
    /** @inheritdoc */
    tryGet(index: number): T | undefined;
    /** @inheritdoc */
    sub(fn: (index: number, type: SubscribableArrayEventType, item: T | readonly T[] | undefined, array: readonly T[]) => void, initialNotify?: boolean): void;
    /** @inheritdoc */
    unsub(fn: (index: number, type: SubscribableArrayEventType, item: T | readonly T[] | undefined, array: readonly T[]) => void): void;
    /**
     * Destroys this subscribable. After destruction, this subscribable will no longer update in response to changes
     * made to its source.
     */
    destroy(): void;
    /**
     * Creates a new SortedMappedSubscribableArray.
     * @param source The source array subject for the new mapped sorted array.
     * @param comparatorFunc A function which defines the relative sorting priority of two elements. The function should
     * return 0 if its arguments are to be sorted identically, a negative number if the first argument is to be sorted
     * before the second argument, and a positive number if the first argument is to be sorted after the second argument.
     * @param equalityFunc A function which checks if two elements are equal. Defaults to the strict equality comparison
     * (`===`) if not defined.
     * @returns A new SortedMappedSubscribableArray.
     */
    static create<CT>(source: SubscribableArray<CT>, comparatorFunc: (a: CT, b: CT) => number, equalityFunc?: (a: CT, b: CT) => boolean): SortedMappedSubscribableArray<CT>;
}
//# sourceMappingURL=SortedMappedSubscribableArray.d.ts.map