import { AbstractSubscribableSet } from './AbstractSubscribableSet';
import { MutableSubscribable } from './Subscribable';
import { MutableSubscribableSet } from './SubscribableSet';
/**
 * A subscribable set whose keys can be freely added and removed.
 */
export declare class SetSubject<T> extends AbstractSubscribableSet<T> implements MutableSubscribable<ReadonlySet<T>>, MutableSubscribableSet<T> {
    readonly isMutableSubscribable = true;
    readonly isMutableSubscribableSet = true;
    private readonly backingSet;
    /**
     * Constructor.
     * @param initialKeys The keys with which to initialize this set. If not defined, this set will be initialized to the
     * empty set.
     */
    private constructor();
    /**
     * Creates and returns a new SetSubject.
     * @param initialKeys The keys initially contained in the new set. If not undefined, the new set will be initialized
     * to the empty set.
     * @returns A new SetSubject instance.
     */
    static create<T>(initialKeys?: Iterable<T>): SetSubject<T>;
    /** @inheritdoc */
    get(): ReadonlySet<T>;
    /**
     * Sets the keys contained in this set.
     * @param keys The keys to set.
     */
    set(keys: Iterable<T>): void;
    /** @inheritdoc */
    add(key: T): this;
    /** @inheritdoc */
    delete(key: T): boolean;
    /**
     * Removes all keys from this set.
     */
    clear(): void;
}
//# sourceMappingURL=SetSubject.d.ts.map