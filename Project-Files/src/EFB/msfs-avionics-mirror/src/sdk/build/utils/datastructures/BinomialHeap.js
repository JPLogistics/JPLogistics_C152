/**
 * A binominal min-heap. Each element added to the heap is ordered according to the value of an assigned key relative
 * to the keys of the other elements in the heap. The relative values of element keys are defined by a supplied
 * comparator function. Retrieval of the element with the smallest key (minimum element) is performed in constant time.
 * Removal of the minimum element and insertions are performed in logarithmic time (amortized to constant time in the
 * case of insertions). Merges are also supported, with destructive merges performed in logarithmic time.
 */
export class BinomialHeap {
    /**
     * Constructor.
     * @param comparator The function that this heap uses to compare the keys of its elements. The function returns 0 if
     * `a` and `b` share the same key, a negative number if `a` has a lower key than `b`, and a positive number if `a`
     * has a greater key than `b`.
     */
    constructor(comparator) {
        this.comparator = comparator;
        this._size = 0;
    }
    // eslint-disable-next-line jsdoc/require-returns
    /** The number of elements contained in this heap. */
    get size() {
        return this._size;
    }
    /**
     * Finds the element in this heap with the smallest key.
     * @returns The element in this heap with the smallest key, or undefined if this heap is empty.
     */
    findMin() {
        return this.minimum;
    }
    /**
     * Removes and returns the element in this heap with the smallest key.
     * @returns The removed element, or undefined if this heap is empty.
     */
    removeMin() {
        // find the root containing the minimum element
        let leftSibling = undefined;
        let minNode = this.rootsHead;
        while (minNode && minNode.element !== this.minimum) {
            leftSibling = minNode;
            minNode = minNode.rightSibling;
        }
        if (!minNode) {
            return undefined;
        }
        // Remove the root containing the minimum element from the heap
        if (leftSibling) {
            leftSibling.rightSibling = minNode.rightSibling;
        }
        else {
            this.rootsHead = minNode.rightSibling;
        }
        // Create a heap from the children of the removed root (since siblings in a binominal tree are arranged highest-
        // order first and the roots of a heap are arranged lowest-order first, it suffices to reverse the order of the
        // siblings) and merge it with this heap
        const heap = BinomialHeap.reverseSiblings(minNode.leftmostChild);
        this.rootsHead = this.mergeHeaps(this.rootsHead, heap);
        this.updateMin();
        this._size--;
        return minNode.element;
    }
    /**
     * Inserts an element into this heap.
     * @param element The element to insert.
     * @returns This heap, after the element has been inserted.
     */
    insert(element) {
        const newRoot = {
            order: 0,
            element
        };
        this.rootsHead = this.mergeHeaps(this.rootsHead, newRoot);
        this.updateMin();
        this._size++;
        return this;
    }
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
    merge(other, destructive = false) {
        const otherSize = other.size;
        let toMerge;
        if (destructive) {
            toMerge = other.rootsHead;
            other.clear();
        }
        else {
            toMerge = BinomialHeap.copyTree(other.rootsHead);
        }
        this.rootsHead = this.mergeHeaps(this.rootsHead, toMerge);
        this.updateMin();
        this._size += otherSize;
        return this;
    }
    /**
     * Removes all elements from this heap.
     * @returns This heap, after it has been cleared.
     */
    clear() {
        this.rootsHead = undefined;
        this.minimum = undefined;
        this._size = 0;
        return this;
    }
    /**
     * Updates the pointer to this heap's minimum element.
     */
    updateMin() {
        let root = this.rootsHead;
        let min;
        while (root) {
            if (min === undefined || this.comparator(root.element, min) < 0) {
                min = root.element;
            }
            root = root.rightSibling;
        }
        this.minimum = min;
    }
    /**
     * Merges two heaps.
     * @param a The lowest-ordered root of the first heap to merge, or undefined for an empty heap.
     * @param b The lowest-ordered root of the second heap to merge, or undefined for an empty heap.
     * @returns The lowest-ordered root of the union of the two input heaps, or undefined if the merged heap is empty.
     */
    mergeHeaps(a, b) {
        if (!a && !b) {
            return undefined;
        }
        else if (!a) {
            return b;
        }
        else if (!b) {
            return a;
        }
        let currentRootA = a;
        let currentRootB = b;
        let merged;
        let previousRootMerged;
        let currentRootMerged;
        // Iterate through the roots of both heaps simultaneously and add roots to the merged heap in ascending tree order.
        // If there is a root collision in the merged heap (two roots of the same order), resolve the collision by merging
        // the colliding roots and adding the merged root to the merged heap in their place.
        // Keep the iteration going while both input heaps still have roots yet to be added to the merged heap, or there
        // is an unresolved root collision.
        while ((currentRootA && currentRootB) || ((currentRootA === null || currentRootA === void 0 ? void 0 : currentRootA.order) === currentRootMerged.order) || ((currentRootB === null || currentRootB === void 0 ? void 0 : currentRootB.order) === currentRootMerged.order)) {
            // Note: At least one of currentRootA and currentRootB must be defined, and if one of them is not defined, then
            // currentRootMerged must be defined.
            let toAdd;
            if (!currentRootB || (currentRootA && currentRootA.order < currentRootB.order)) {
                toAdd = currentRootA;
                currentRootA = currentRootA.rightSibling;
            }
            else if (!currentRootA || currentRootB.order < currentRootA.order) {
                toAdd = currentRootB;
                currentRootB = currentRootB.rightSibling;
            }
            else {
                const currentRootASibling = currentRootA.rightSibling;
                const currentRootBSibling = currentRootB.rightSibling;
                toAdd = this.mergeTrees(currentRootA, currentRootB);
                currentRootA = currentRootASibling;
                currentRootB = currentRootBSibling;
            }
            if (currentRootMerged) {
                if (currentRootMerged.order === toAdd.order) {
                    toAdd = this.mergeTrees(currentRootMerged, toAdd);
                    if (previousRootMerged) {
                        previousRootMerged.rightSibling = toAdd;
                    }
                    else {
                        merged = toAdd;
                    }
                }
                else {
                    previousRootMerged = currentRootMerged;
                    currentRootMerged.rightSibling = toAdd;
                }
            }
            else {
                merged = toAdd;
            }
            currentRootMerged = toAdd;
        }
        // At this point at least one of the input heaps has no more roots to be added to the merged heap, and there are
        // guaranteed to be no more root collisions. Therefore, we just append the rest of the roots from the not-exhausted
        // input heap (if one exists) to the end of the root list of the merged heap.
        currentRootMerged.rightSibling = currentRootA !== null && currentRootA !== void 0 ? currentRootA : currentRootB;
        return merged;
    }
    /**
     * Merges two binomial trees of equal order.
     * @param a The root of the first tree to merge.
     * @param b The root of the second tree to merge.
     * @returns The root of the merged tree.
     * @throws Error if the two input trees have different orders.
     */
    mergeTrees(a, b) {
        if (a.order !== b.order) {
            throw new Error(`BinomialHeap: attempted to merge trees of unequal order (${a.order} and ${b.order})`);
        }
        let min, max;
        if (this.comparator(a.element, b.element) <= 0) {
            min = a;
            max = b;
        }
        else {
            min = b;
            max = a;
        }
        max.rightSibling = min.leftmostChild;
        min.leftmostChild = max;
        min.order++;
        return min;
    }
    /**
     * Reverses the order of sibling nodes.
     * @param leftMostSibling The left-most sibling in a set of sibling nodes to reverse.
     * @returns The left-most sibling of the reversed set of siblings (originally the right-most sibling before the
     * reversal).
     */
    static reverseSiblings(leftMostSibling) {
        if (!leftMostSibling) {
            return undefined;
        }
        if (!leftMostSibling.rightSibling) {
            return leftMostSibling;
        }
        const rightSibling = leftMostSibling.rightSibling;
        const reversed = BinomialHeap.reverseSiblings(rightSibling);
        rightSibling.rightSibling = leftMostSibling;
        leftMostSibling.rightSibling = undefined;
        return reversed;
    }
    /**
     * Copies a binomial tree.
     * @param root The root of the tree to copy.
     * @returns The root of the copy.
     */
    static copyTree(root) {
        if (!root) {
            return undefined;
        }
        return {
            order: root.order,
            element: root.element,
            leftmostChild: root.leftmostChild ? BinomialHeap.copyTree(root.leftmostChild) : undefined,
            rightSibling: root.rightSibling ? BinomialHeap.copyTree(root.rightSibling) : undefined
        };
    }
}
