/**
 * A binominal min-heap. Each element added to the heap is ordered according to the value of an assigned key relative
 * to the keys of the other elements in the heap. The relative values of element keys are defined by a supplied
 * comparator function. Retrieval of the element with the smallest key (minimum element) is performed in constant time.
 * Removal of the minimum element and insertions are performed in logarithmic time (amortized to constant time in the
 * case of insertions). Merges are also supported, with destructive merges performed in logarithmic time.
 */
export declare class BinomialHeap<T> {
    private readonly comparator;
    /**
     * The root of the lowest-ordered tree in this heap. For each root, the `rightSibling` property points to the root
     * of the next-lowest-ordered tree in the heap, forming a singly-linked list of roots in ascending tree order.
     */
    private rootsHead?;
    private minimum?;
    private _size;
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
     * Merges this heap with another one. The merge can either be non-destructive or destructive. A non-destructive merge
     * preserves the other heap. A destructive merge clears the other heap. A destructive merge takes O(log N) time
     * while a non-destructive merge takes O(M + log N) time, where N is either the size of this heap or the size of the
     * other heap, whichever is larger, and M is the size of the other heap. The difference stems from the need to copy
     * the other heap in a non-destructive merge. Note that the result of this operation is only valid if the two heaps
     * have equivalent comparator functions.
     * @param other The heap to merge into this one.
     * @param destructive Whether to perform a destructive merge. False by default.
     * @returns This heap, after the merge has been completed.
     */
    merge<U extends T>(other: BinomialHeap<U>, destructive?: boolean): this;
    /**
     * Removes all elements from this heap.
     * @returns This heap, after it has been cleared.
     */
    clear(): this;
    /**
     * Updates the pointer to this heap's minimum element.
     */
    private updateMin;
    /**
     * Merges two heaps.
     * @param a The lowest-ordered root of the first heap to merge, or undefined for an empty heap.
     * @param b The lowest-ordered root of the second heap to merge, or undefined for an empty heap.
     * @returns The lowest-ordered root of the union of the two input heaps, or undefined if the merged heap is empty.
     */
    private mergeHeaps;
    /**
     * Merges two binomial trees of equal order.
     * @param a The root of the first tree to merge.
     * @param b The root of the second tree to merge.
     * @returns The root of the merged tree.
     * @throws Error if the two input trees have different orders.
     */
    private mergeTrees;
    /**
     * Reverses the order of sibling nodes.
     * @param leftMostSibling The left-most sibling in a set of sibling nodes to reverse.
     * @returns The left-most sibling of the reversed set of siblings (originally the right-most sibling before the
     * reversal).
     */
    private static reverseSiblings;
    /**
     * Copies a binomial tree.
     * @param root The root of the tree to copy.
     * @returns The root of the copy.
     */
    private static copyTree;
}
//# sourceMappingURL=BinomialHeap.d.ts.map