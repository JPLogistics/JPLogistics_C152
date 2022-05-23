import { AbstractSubscribableArray } from './AbstractSubscribableArray';
import { SubscribableArrayEventType } from './SubscribableArray';
/**
 * An array-like class to observe changes in a list of objects.
 * @class ArraySubject
 * @template T
 */
export class ArraySubject extends AbstractSubscribableArray {
    /**
     * Constructs an observable array.
     * @param arr The initial array elements.
     */
    constructor(arr) {
        super();
        this.array = arr;
    }
    // eslint-disable-next-line jsdoc/require-returns
    /** The length of this array. */
    get length() {
        return this.array.length;
    }
    /**
     * Creates and returns a new observable array.
     * @static
     * @template AT The type of the array items.
     * @param arr The initial array elements.
     * @returns A new instance of SubjectArray.
     */
    static create(arr = []) {
        return new ArraySubject(arr);
    }
    /**
     * Inserts a new item at the end or the specified index.
     * @param item The item to insert.
     * @param index The optional index to insert the item to. Will add the item at then end if index not given.
     */
    insert(item, index = -1) {
        if (index === -1 || index > this.array.length - 1) {
            this.array.push(item);
        }
        else {
            this.array.splice(index, 0, item);
        }
        this.notify(index, SubscribableArrayEventType.Added, item);
    }
    /**
     * Inserts items of an array beginning at the specified index.
     * @param [index] The index to begin inserting the array items.
     * @param arr The array to insert.
     */
    insertRange(index = 0, arr) {
        this.array.splice(index, 0, ...arr);
        this.notify(index, SubscribableArrayEventType.Added, arr);
    }
    /**
     * Removes the item at the specified index.
     * @param index The index of the item to remove.
     */
    removeAt(index) {
        const removedItem = this.array.splice(index, 1);
        this.notify(index, SubscribableArrayEventType.Removed, removedItem[0]);
    }
    /**
     * Removes the given item from the array.
     * @param item The item to remove.
     * @returns Returns a boolean indicating if the item was found and removed.
     */
    removeItem(item) {
        const index = this.array.indexOf(item);
        if (index > -1) {
            this.removeAt(index);
            return true;
        }
        else {
            return false;
        }
    }
    /**
     * Replaces all items in the array with the new array.
     * @param arr The array.
     */
    set(arr) {
        this.clear();
        this.insertRange(0, arr);
    }
    /**
     * Clears all data in the array.
     */
    clear() {
        this.array.length = 0;
        this.notify(0, SubscribableArrayEventType.Cleared);
    }
    /**
     * Gets the array.
     * @returns The array.
     */
    getArray() {
        return this.array;
    }
}
