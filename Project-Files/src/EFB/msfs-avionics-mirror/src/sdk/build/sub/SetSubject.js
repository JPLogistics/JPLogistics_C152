import { AbstractSubscribableSet } from './AbstractSubscribableSet';
import { SubscribableSetEventType } from './SubscribableSet';
/**
 * A subscribable set whose keys can be freely added and removed.
 */
export class SetSubject extends AbstractSubscribableSet {
    /**
     * Constructor.
     * @param initialKeys The keys with which to initialize this set. If not defined, this set will be initialized to the
     * empty set.
     */
    constructor(initialKeys) {
        super();
        this.isMutableSubscribable = true;
        this.isMutableSubscribableSet = true;
        this.backingSet = new Set(initialKeys);
    }
    /**
     * Creates and returns a new SetSubject.
     * @param initialKeys The keys initially contained in the new set. If not undefined, the new set will be initialized
     * to the empty set.
     * @returns A new SetSubject instance.
     */
    static create(initialKeys) {
        return new SetSubject(initialKeys);
    }
    /** @inheritdoc */
    get() {
        return this.backingSet;
    }
    /**
     * Sets the keys contained in this set.
     * @param keys The keys to set.
     */
    set(keys) {
        const toAdd = new Set(keys);
        for (const key of this.backingSet) {
            if (!toAdd.delete(key)) {
                this.delete(key);
            }
        }
        for (const key of toAdd) {
            this.add(key);
        }
    }
    /** @inheritdoc */
    add(key) {
        const oldSize = this.backingSet.size;
        this.backingSet.add(key);
        if (oldSize !== this.backingSet.size) {
            this.notify(SubscribableSetEventType.Added, key);
        }
        return this;
    }
    /** @inheritdoc */
    delete(key) {
        const wasDeleted = this.backingSet.delete(key);
        if (wasDeleted) {
            this.notify(SubscribableSetEventType.Deleted, key);
        }
        return wasDeleted;
    }
    /**
     * Removes all keys from this set.
     */
    clear() {
        for (const key of this.backingSet) {
            this.backingSet.delete(key);
        }
    }
}
