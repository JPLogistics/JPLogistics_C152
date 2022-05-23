import { AbstractSubscribableArray } from './AbstractSubscribableArray';
/**
 * An array-like class to observe changes in a list of objects.
 * @class ArraySubject
 * @template T
 */
export declare class ArraySubject<T> extends AbstractSubscribableArray<T> {
    private array;
    /** The length of this array. */
    get length(): number;
    /**
     * Constructs an observable array.
     * @param arr The initial array elements.
     */
    private constructor();
    /**
     * Creates and returns a new observable array.
     * @static
     * @template AT The type of the array items.
     * @param arr The initial array elements.
     * @returns A new instance of SubjectArray.
     */
    static create<AT>(arr?: AT[]): ArraySubject<AT>;
    /**
     * Inserts a new item at the end or the specified index.
     * @param item The item to insert.
     * @param index The optional index to insert the item to. Will add the item at then end if index not given.
     */
    insert(item: T, index?: number): void;
    /**
     * Inserts items of an array beginning at the specified index.
     * @param [index] The index to begin inserting the array items.
     * @param arr The array to insert.
     */
    insertRange(index: number | undefined, arr: readonly T[]): void;
    /**
     * Removes the item at the specified index.
     * @param index The index of the item to remove.
     */
    removeAt(index: number): void;
    /**
     * Removes the given item from the array.
     * @param item The item to remove.
     * @returns Returns a boolean indicating if the item was found and removed.
     */
    removeItem(item: T): boolean;
    /**
     * Replaces all items in the array with the new array.
     * @param arr The array.
     */
    set(arr: readonly T[]): void;
    /**
     * Clears all data in the array.
     */
    clear(): void;
    /**
     * Gets the array.
     * @returns The array.
     */
    getArray(): readonly T[];
}
//# sourceMappingURL=ArraySubject.d.ts.map