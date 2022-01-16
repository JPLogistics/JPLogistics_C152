/**
 * A binary min-heap. Each element added to the heap is ordered according to the value of an assigned key relative
 * to the keys of the other elements in the heap. The relative values of element keys are defined by a supplied
 * comparator function. Retrieval of the element with the smallest key (minimum element) is performed in constant time.
 * Removal of the minimum element and insertions are performed in logarithmic time. Additionally, this type of heap
 * supports combined insertion and removal operations (in either order) which are slightly more efficient than chaining
 * the two operations separately.
 */
export declare class BinaryHeap<T> {
    private readonly comparator;
    private readonly tree;
    /** The number of elements contained in this heap. */
    get size(): number;
    /**
     * Constructor.
     * @param comparator The function that this heap uses to compare the keys of its elements. The function returns 0 if
     * `a` and `b` share the same key, a negative number if `a` has a lower key than `b`, and a positive number if `a`
     * has a greater key than `b`.
     */
    constructor(comparator: (a: T, b: T) => number);
    /**
     * Finds the element in this heap with the smallest key.
     * @returns The element in this heap with the smallest key, or undefined if this heap is empty.
     */
    findMin(): T | undefined;
    /**
     * Removes and returns the element in this heap with the smallest key.
     * @returns The removed element, or undefined if this heap is empty.
     */
    removeMin(): T | undefined;
    /**
     * Inserts an element into this heap.
     * @param element The element to insert.
     * @returns This heap, after the element has been inserted.
     */
    insert(element: T): this;
    /**
     * Inserts an element into this heap, then removes the element with the smallest key.
     * @param element The element to insert.
     * @returns The removed element.
     */
    insertAndRemoveMin(element: T): T;
    /**
     * Removes the element in this heap with the smallest key, then inserts a new element.
     * @param element The element to insert.
     * @returns The removed element, or undefined if this heap was empty before the new element was inserted.
     */
    removeMinAndInsert(element: T): T | undefined;
    /**
     * Removes all elements from this heap.
     * @returns This heap, after it has been cleared.
     */
    clear(): this;
    /**
     * Restores the heap property for this heap upwards from a node which potentially violates the property.
     * @param index The index of the node at which to begin the operation.
     */
    private heapifyUp;
    /**
     * Restores the heap property for this heap downwards from a node which potentially violates the property.
     * @param index The index of the node at which to begin the operation.
     */
    private heapifyDown;
    /**
     * Swaps two nodes in this heap.
     * @param index1 The index of the first node.
     * @param index2 The index of the second node.
     */
    private swap;
    /**
     * Finds the index of a node's parent.
     * @param index the index of the node for which to find the parent.
     * @returns The index of the query node's parent.
     */
    private static parent;
    /**
     * Finds the index of a node's left child.
     * @param index The index of the node for which to find the child.
     * @returns The index of the query node's left child.
     */
    private static left;
    /**
     * Finds the index of a node's right child.
     * @param index The index of the node for which to find the child.
     * @returns The idnex of the query node's right child.
     */
    private static right;
}
//# sourceMappingURL=BinaryHeap.d.ts.map