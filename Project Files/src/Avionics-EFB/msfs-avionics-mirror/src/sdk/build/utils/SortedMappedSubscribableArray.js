import { SortedArray } from './datastructures/SortedArray';
import { SubscribableArrayEventType } from './Subscribable';
/**
 * A subscribable which provides a sorted version of a source SubscribableArray.
 */
export class SortedMappedSubscribableArray {
    /**
     * Constructor.
     * @param source The source array subject for this subscribable.
     * @param comparatorFunc A function which defines the relative sorting priority of two elements. The function should
     * return 0 if its arguments are to be sorted identically, a negative number if the first argument is to be sorted
     * before the second argument, and a positive number if the first argument is to be sorted after the second argument.
     * @param equalityFunc A function which checks if two elements are equal. Defaults to the strict equality comparison
     * (`===`) if not defined.
     */
    constructor(source, comparatorFunc, equalityFunc) {
        this.source = source;
        this.comparatorFunc = comparatorFunc;
        this.equalityFunc = equalityFunc;
        this.subs = [];
        this.sorted = new SortedArray(this.comparatorFunc, this.equalityFunc);
        this.sourceHandler = this.onSourceChanged.bind(this);
        source.sub(this.sourceHandler, true);
    }
    /** @inheritdoc */
    get length() {
        return this.sorted.length;
    }
    /**
     * Responds to changes in this subscribable's source array.
     * @param index The index of the change.
     * @param type The type of change.
     * @param item The item(s) involved in the change, if any.
     */
    onSourceChanged(index, type, item) {
        switch (type) {
            case SubscribableArrayEventType.Cleared:
                if (this.sorted.length !== 0) {
                    this.sorted.clear();
                    this.notifySubs(0, SubscribableArrayEventType.Cleared);
                }
                break;
            case SubscribableArrayEventType.Added:
                if (item) {
                    this.insert(item);
                }
                break;
            case SubscribableArrayEventType.Removed:
                if (item) {
                    this.remove(item);
                }
                break;
        }
    }
    /**
     * Inserts elements into this array.
     * @param elements An element or array of elements to insert.
     */
    insert(elements) {
        if (this.sorted.length === 0) {
            // since we know all elements will be added to one contiguous index range, we can do a small optimization here
            // with notifications
            elements instanceof Array ? this.sorted.insertAll(elements) : this.sorted.insert(elements);
            this.notifySubs(0, SubscribableArrayEventType.Added, elements instanceof Array ? this.sorted.array : elements);
        }
        else {
            const sorted = elements instanceof Array ? Array.from(elements).sort(this.comparatorFunc) : [elements];
            const len = sorted.length;
            for (let i = 0; i < len; i++) {
                const toInsert = sorted[i];
                this.notifySubs(this.sorted.insert(toInsert), SubscribableArrayEventType.Added, toInsert);
            }
        }
    }
    /**
     * Removes elements from this array.
     * @param elements An element or array of elements to remove.
     */
    remove(elements) {
        const sorted = elements instanceof Array ? Array.from(elements).sort(this.comparatorFunc) : [elements];
        const len = sorted.length;
        for (let i = 0; i < len; i++) {
            const toRemove = sorted[i];
            const removedIndex = this.sorted.remove(toRemove);
            if (removedIndex >= 0) {
                this.notifySubs(removedIndex, SubscribableArrayEventType.Removed, toRemove);
            }
        }
    }
    /**
     * Notifies subscribers of a change in this array.
     * @param index The index that was changed.
     * @param type The type of subject event.
     * @param modifiedItem The item modified by the operation.
     * @private
     */
    notifySubs(index, type, modifiedItem) {
        const len = this.subs.length;
        for (let i = 0; i < len; i++) {
            try {
                this.subs[i](index, type, modifiedItem, this.sorted.array);
            }
            catch (error) {
                console.error(`SortedMappedSubscribableArray: Error in subscriber handler ${error}`);
                if (error instanceof Error) {
                    console.error(error.stack);
                }
            }
        }
    }
    /** @inheritdoc */
    getArray() {
        return this.sorted.array;
    }
    /** @inheritdoc */
    get(index) {
        if (index < 0 || index >= this.sorted.length) {
            throw new RangeError(`SortedMappedSubscribableArray: index ${index} out of range`);
        }
        return this.sorted.get(index);
    }
    /** @inheritdoc */
    tryGet(index) {
        return this.sorted.get(index);
    }
    /** @inheritdoc */
    sub(fn, initialNotify) {
        this.subs.push(fn);
        initialNotify && fn(0, SubscribableArrayEventType.Added, this.sorted.array, this.sorted.array);
    }
    /** @inheritdoc */
    unsub(fn) {
        const index = this.subs.indexOf(fn);
        if (index >= 0) {
            this.subs.splice(index, 1);
        }
    }
    /**
     * Destroys this subscribable. After destruction, this subscribable will no longer update in response to changes
     * made to its source.
     */
    destroy() {
        this.source.unsub(this.sourceHandler);
    }
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
    static create(source, comparatorFunc, equalityFunc) {
        return new SortedMappedSubscribableArray(source, comparatorFunc, equalityFunc);
    }
}
