/**
 * A sorted array.
 */
export declare class SortedArray<T> {
    private readonly comparatorFunc;
    private readonly equalityFunc;
    private static readonly DEFAULT_EQUALITY_FUNC;
    private readonly _array;
    /** A read-only version of the array object backing this sorted array. */
    get array(): readonly T[];
    /**
     * The number of elements in this array.
     * @returns The number of elements in the array.
     */
    get length(): number;
    /**
     * Constructor.
     * @param comparatorFunc A function which defines the relative sorting priority of two elements. The function should
     * return 0 if its arguments are to be sorted identically, a negative number if the first argument is to be sorted
     * before the second argument, and a positive number if the first argument is to be sorted after the second argument.
     * @param equalityFunc A function which checks if two elements are equal. Defaults to the strict equality comparison
     * (`===`) if not defined.
     */
    constructor(comparatorFunc: (a: T, b: T) => number, equalityFunc?: (a: T, b: T) => boolean);
    /**
     * Finds the index of the first or last element in this array whose sorting priority is equal to a query element. If
     * no such element in this array exists, `-(index + 1)` is returned, where `index` is the index at which the query
     * element would be found if it were contained in the array.
     * @param element The query element.
     * @param first Whether to find the first index.
     * @returns The index of the first or last element in this array with the same sorting priority as the query, or
     * `-(index + 1)` if no such element exists, where `index` is the index at which the query element would be found if
     * it were contained in the array.
     */
    private findIndex;
    /**
     * Finds the index of the first element in this array which equals a query element, starting at a specified index.
     * The search proceeds toward the end of the array, ending at the first index containing an element whose sorting
     * priority does not equal the query, or the end of the array, whichever comes first. If no such element in this
     * array exists, -1 is returned instead.
     * @param element The query element.
     * @param startIndex The index at which to start the search.
     * @returns The index of the first element in this array which equals the query element, or -1 if no such element
     * exists.
     */
    private searchEquals;
    /**
     * Gets the element at a specified index, if it exists.
     * @param index An index.
     * @returns The element at the specified index, or undefined if the index is out of bounds.
     */
    get(index: number): T | undefined;
    /**
     * Gets the first element in this array, if it exists.
     * @returns The first element in this array, or undefined if this array is empty.
     */
    first(): T | undefined;
    /**
     * Gets the last element in this array, if it exists.
     * @returns The last element in this array, or undefined if this array is empty.
     */
    last(): T | undefined;
    /**
     * Checks whether this array contains an element. Returns true if and only if there is at least one element in this
     * array which is equal to the specified element according to this array's equality function.
     * @param element The element to check.
     * @returns Whether this array contains the element.
     */
    has(element: T): boolean;
    /**
     * Inserts an element into this array. The element will be inserted at the greatest index such that it is located
     * before all the existing elements in the array sorted after it according to this array's sorting function. All
     * existing elements located at indexes greater than or equal to the index at which the element was inserted are
     * shifted to the right.
     * @param element The element to insert.
     * @returns The index at which the element was placed.
     */
    insert(element: T): number;
    /**
     * Inserts all elements in an Iterable into this array. Each element is inserted according to the same behavior used
     * by the `insert()` method. If an element appears more than once in the iterable, one instance of that element will
     * be inserted into this array for each time the element appears in the iterable.
     * @param elements An iterable of elements to insert.
     * @returns The number of elements inserted.
     */
    insertAll(elements: Iterable<T>): number;
    /**
     * Removes the first occurrence of an element from this array. This array is searched for the first element which
     * is equal to the specified element according to this array's equality function, the matching element is removed,
     * and all elements after it are shifted to the left.
     * @param element The element to remove.
     * @returns The (former) index of the removed element, or -1 if no element was removed.
     */
    remove(element: T): number;
    /**
     * Removes all elements in an Iterable from this array. Each element is removed according to the behavior used by the
     * `remove()` method. If an element appears more than once in the iterable, one instance of that element will be
     * removed from this array for each time the element appears in the iterable.
     * @param elements An iterable of elements to remove.
     * @returns The number of elements removed.
     */
    removeAll(elements: Iterable<T>): number;
    /**
     * Finds the index of the first occurrence of an element in this array. This array is searched for the first element
     * which is equal to the specified element according to this array's equality function, and its index is returned.
     * @param element The element for which to search.
     * @returns The index of the first occurrence of the specified element, or -1 if no such element was found.
     */
    indexOf(element: T): number;
    /**
     * Searches this array for the first element whose sorting priority is equal to a query element. If no such element
     * is found, then undefined is returned instead.
     * @param query The query element.
     * @returns The first element in the array with the same sorting priority as the query, or undefined if no such
     * element exists.
     */
    match(query: T): T | undefined;
    /**
     * Searches this array for the index of the first element whose sorting priority is equal to a query element. If no
     * such element is found, then `-(index + 1)` is returned instead, where `index` is the index at which the query
     * element would be found if it were contained in the array.
     * @param query The query element.
     * @returns The index of the first element in this array with the same sorting priority as the query, or
     * `-(index + 1)` if no such element exists, where `index` is the index at which the query element would be found if
     * it were contained in the array.
     */
    matchIndex(query: T): number;
    /**
     * Removes all elements from this array.
     */
    clear(): void;
    /**
     * Gets an IterableIterator over all elements in this array.
     * @returns An IterableIterator over all elements in this array.
     */
    values(): IterableIterator<T>;
    /** @inheritdoc */
    [Symbol.iterator](): IterableIterator<T>;
}
//# sourceMappingURL=SortedArray.d.ts.map