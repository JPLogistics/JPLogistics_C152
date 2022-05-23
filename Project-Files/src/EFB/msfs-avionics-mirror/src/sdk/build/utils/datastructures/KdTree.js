import { BinaryHeap } from './BinaryHeap';
/**
 * A k-dimensional search tree.
 */
export class KdTree {
    /**
     * Constructor.
     * @param dimensionCount The number of dimensions supported by this tree. If this argument is not an integer, it will
     * be truncated to one.
     * @param keyFunc A function which generates keys from elements. Keys are an N-tuple of numbers, where N is equal to
     * the dimension count of this tree.
     * @throws Error if the dimension count is less than 2.
     */
    constructor(dimensionCount, keyFunc) {
        this.keyFunc = keyFunc;
        this.elements = [];
        this.keys = [];
        this.nodes = [];
        this.minDepth = -1;
        this.maxDepth = -1;
        this.dimensionCount = Math.trunc(dimensionCount);
        if (this.dimensionCount < 2) {
            throw new Error(`KdTree: cannot create a tree with ${this.dimensionCount} dimensions.`);
        }
        this.indexArrays = Array.from({ length: this.dimensionCount + 1 }, () => []);
        this.indexSortFuncs = Array.from({ length: this.dimensionCount }, (v, index) => {
            return (a, b) => {
                const aKey = this.keys[a];
                const bKey = this.keys[b];
                for (let i = 0; i < this.dimensionCount; i++) {
                    const dimension = (i + index) % this.dimensionCount;
                    if (aKey[dimension] < bKey[dimension]) {
                        return -1;
                    }
                    else if (aKey[dimension] > bKey[dimension]) {
                        return 1;
                    }
                }
                return 0;
            };
        });
        this.keyCache = [
            new Float64Array(this.dimensionCount)
        ];
    }
    // eslint-disable-next-line jsdoc/require-returns
    /** The number of elements in this tree. */
    get size() {
        return this.elements.length;
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    searchKey(key, radius, arg3, out, filter) {
        if (typeof arg3 === 'number') {
            return this.doResultsSearch(undefined, key, radius, arg3, out, filter);
        }
        else {
            this.doVisitorSearch(undefined, key, radius, arg3);
        }
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    search(element, radius, arg3, out, filter) {
        const key = this.keyFunc(element, this.keyCache[0]);
        if (typeof arg3 === 'number') {
            return this.doResultsSearch(element, key, radius, arg3, out, filter);
        }
        else {
            this.doVisitorSearch(element, key, radius, arg3);
        }
    }
    /**
     * Performs a tree search with a visitor function.
     * @param element The query element, or undefined if none exists.
     * @param key The query key.
     * @param radius The search radius.
     * @param visitor A visitor function. This function will be called once per element found within the search radius.
     * If the visitor returns `true`, then the search will continue; if the visitor returns `false`, the search will
     * immediately halt.
     */
    doVisitorSearch(element, key, radius, visitor) {
        const resultHandler = (elementIndex, elementInner, keyInner, distance, queryKey, queryElement) => {
            return visitor(elementInner, keyInner, distance, queryKey, queryElement);
        };
        const traversalHandler = (offsetFromPivot, searchRadius, child) => {
            return searchRadius + offsetFromPivot * child >= 0;
        };
        this.searchTree(element, key, radius, 0, 0, resultHandler, traversalHandler);
    }
    /**
     * Performs a tree search and returns an array of search results.
     * @param element The query element, or undefined if none exists.
     * @param key The query key.
     * @param radius The search radius.
     * @param maxResultCount The maximum number of search results to return.
     * @param out An array in which to store the search results.
     * @param filter A function to filter the search results.
     * @returns An array containing the search results, in order of increasing distance from the query key.
     */
    doResultsSearch(element, key, radius, maxResultCount, out, filter) {
        if (maxResultCount <= 0) {
            out.length = 0;
            return out;
        }
        const heap = new BinaryHeap((a, b) => KdTree.distance(key, this.keys[b], this.dimensionCount) - KdTree.distance(key, this.keys[a], this.dimensionCount));
        const resultHandler = (elementIndex, elementInner, keyInner, distance, queryKey, queryElement) => {
            if (!filter || filter(elementInner, keyInner, distance, queryKey, queryElement)) {
                if (heap.size === maxResultCount) {
                    heap.insertAndRemoveMin(elementIndex);
                }
                else {
                    heap.insert(elementIndex);
                }
            }
            return true;
        };
        const traversalHandler = (offsetFromPivot, searchRadius, child) => {
            let maxDist = searchRadius;
            if (heap.size === maxResultCount) {
                maxDist = Math.min(maxDist, KdTree.distance(key, this.keys[heap.findMin()], this.dimensionCount));
            }
            return maxDist + offsetFromPivot * child >= 0;
        };
        this.searchTree(element, key, radius, 0, 0, resultHandler, traversalHandler);
        out.length = heap.size;
        for (let i = out.length - 1; i >= 0; i--) {
            out[i] = this.elements[heap.removeMin()];
        }
        return out;
    }
    /**
     * Searches a subtree for elements whose keys are located near a query key.
     * @param element The query element, or undefined if none exists.
     * @param key The query key.
     * @param radius The search radius.
     * @param nodeIndex The index of the root of the subtree to search.
     * @param pivotDimension The dimension in which the root of the subtree is split.
     * @param resultHandler A function which will be called once per element found within the search radius. If the
     * function returns `true`, then the search will continue; if the function returns `false`, the search will
     * immediately halt.
     * @param traversalHandler A function which determines whether the search will proceed to a child node. If the
     * function returns `true`, the search will continue; if the function returns `false`, the search will skip the
     * child.
     * @returns `false` if the search was terminated prematurely by the `resultHandler` function, and `true` otherwise.
     */
    searchTree(element, key, radius, nodeIndex, pivotDimension, resultHandler, traversalHandler) {
        const elementIndex = this.nodes[nodeIndex];
        if (elementIndex === undefined) {
            return true;
        }
        const nodeKey = this.keys[elementIndex];
        const distanceFromNode = KdTree.distance(key, nodeKey, this.dimensionCount);
        if (distanceFromNode <= radius) {
            if (!resultHandler(elementIndex, this.elements[elementIndex], nodeKey, distanceFromNode, key, element)) {
                return false;
            }
        }
        const offsetFromPivot = key[pivotDimension] - nodeKey[pivotDimension];
        const nextPivotDimension = (pivotDimension + 1) % this.dimensionCount;
        const lesserNodeIndex = KdTree.lesser(nodeIndex);
        const greaterNodeIndex = KdTree.greater(nodeIndex);
        if (this.nodes[lesserNodeIndex] !== undefined && traversalHandler(offsetFromPivot, radius, -1)) {
            if (!this.searchTree(element, key, radius, lesserNodeIndex, nextPivotDimension, resultHandler, traversalHandler)) {
                return false;
            }
        }
        if (this.nodes[greaterNodeIndex] !== undefined && traversalHandler(offsetFromPivot, radius, 1)) {
            if (!this.searchTree(element, key, radius, greaterNodeIndex, nextPivotDimension, resultHandler, traversalHandler)) {
                return false;
            }
        }
        return true;
    }
    /**
     * Inserts an element into this tree. This operation will trigger a rebalancing if, after the insertion, the length
     * of this tree's longest branch is more than twice the length of the shortest branch.
     * @param element The element to insert.
     */
    insert(element) {
        const insertDepth = this.insertElementInTree(element) + 1;
        this.maxDepth = Math.max(this.maxDepth, insertDepth);
        if (insertDepth === this.minDepth + 1) {
            this.minDepth = KdTree.depth(this.nodes.indexOf(undefined, KdTree.leastIndexAtDepth(Math.max(0, this.minDepth))));
        }
        // Rebalance the tree if max depth is greater than twice the min depth.
        if (this.maxDepth + 1 > (this.minDepth + 1) * 2) {
            this.rebuild();
        }
    }
    /**
     * Inserts a batch of elements into this tree. This tree will be rebalanced after the elements are inserted.
     * @param elements An iterable of the elements to insert.
     */
    insertAll(elements) {
        for (const element of elements) {
            this.elements.push(element);
            this.keys.push(this.keyFunc(element, new Float64Array(this.dimensionCount)));
            const insertedIndex = this.elements.length - 1;
            for (let i = 0; i < this.dimensionCount; i++) {
                this.indexArrays[i].push(insertedIndex);
            }
        }
        this.rebuild();
    }
    /**
     * Inserts an element into this tree.
     * @param element The element to insert.
     * @returns The depth at which the element was inserted, with 0 being the depth of the root.
     */
    insertElementInTree(element) {
        const key = this.keyFunc(element, new Float64Array(this.dimensionCount));
        let index = 0;
        let depth = 0;
        let elementIndex;
        while ((elementIndex = this.nodes[index]) !== undefined) {
            const pivotDimension = depth % this.dimensionCount;
            const keyToCompare = key[pivotDimension];
            if (keyToCompare <= this.keys[elementIndex][pivotDimension]) {
                index = KdTree.lesser(index);
            }
            else {
                index = KdTree.greater(index);
            }
            depth++;
        }
        this.elements.push(element);
        this.keys.push(key);
        const insertedIndex = this.elements.length - 1;
        this.nodes[index] = insertedIndex;
        for (let i = 0; i < this.dimensionCount; i++) {
            this.indexArrays[i].push(insertedIndex);
        }
        return depth;
    }
    /**
     * Removes an element from this tree. This tree will be rebalanced after the element is removed.
     * @param element The element to remove.
     * @returns Whether the element was removed.
     */
    remove(element) {
        if (!this.removeElementFromArrays(element)) {
            return false;
        }
        this.rebuild();
        return true;
    }
    /**
     * Removes a batch of elements from this tree. This tree will be rebalanced after the elements are removed.
     * @param elements An iterable of the elements to remove.
     * @returns Whether at least one element was removed.
     */
    removeAll(elements) {
        let removed = false;
        for (const element of elements) {
            removed = this.removeElementFromArrays(element) || removed;
        }
        if (removed) {
            this.rebuild();
        }
        return removed;
    }
    /**
     * Removes an element and all references to it from this tree's arrays. This method does not change the structure
     * of this tree to reflect the removal of the element.
     * @param element The element to remove.
     * @returns Whether the element was removed.
     */
    removeElementFromArrays(element) {
        const index = this.elements.indexOf(element);
        if (index < 0) {
            return false;
        }
        const lastIndex = this.elements.length - 1;
        this.elements[index] = this.elements[lastIndex];
        this.keys[index] = this.keys[lastIndex];
        this.elements.length--;
        this.keys.length--;
        for (let i = 0; i < this.dimensionCount; i++) {
            const array = this.indexArrays[i];
            const indexInArray = array.indexOf(index);
            if (indexInArray > 0) {
                array[indexInArray] = array[array.length - 1];
                array.length--;
            }
        }
        return true;
    }
    /**
     * Rebuilds and balances this tree.
     */
    rebuild() {
        if (this.size === 0) {
            return;
        }
        // clear the tree structure
        this.nodes.length = 0;
        // sort index arrays
        for (let i = 0; i < this.dimensionCount; i++) {
            this.indexArrays[i].sort(this.indexSortFuncs[i]);
        }
        this.buildSubTree(0, 0, 0, this.indexArrays[0].length);
        const log = Math.log2(this.elements.length + 1);
        this.minDepth = Math.floor(log) - 1;
        this.maxDepth = Math.ceil(log) - 1;
    }
    /**
     * Builds a portion of this tree starting from a specified node using the element indexes stored in a specified
     * section of this tree's index arrays. The built subtree is guaranteed to be balanced. Before calling this method,
     * the index array at position 0 should contain keys sorted in the specified pivot dimension, the array at position
     * 1 should contain keys sorted in the dimension after the pivot dimension, etc (with the dimension wrapping back to
     * 0 when reaching `this.dimensionCount`).
     * @param nodeIndex The index of the tree node at which to start building the tree. The element associated with the
     * pivot key will be placed at this node.
     * @param pivotDimension The dimension in which to split the first level of the tree built by this method.
     * @param start The first index, inclusive, of the section of this tree's index arrays to use to build the tree.
     * @param end The last index, exclusive, of the section of this tree's index arrays to use to build the tree.
     */
    buildSubTree(nodeIndex, pivotDimension, start, end) {
        const tempArray = this.indexArrays[this.dimensionCount];
        const sortedArray = this.indexArrays[0];
        const medianIndex = Math.trunc((start + end) / 2);
        const medianKeyIndex = sortedArray[medianIndex];
        // Insert median into its position in the tree
        this.nodes[nodeIndex] = medianKeyIndex;
        if (end - start === 1) {
            return;
        }
        if (end - start <= 3) {
            const lesserIndex = medianIndex - 1;
            const greaterIndex = medianIndex + 1;
            if (lesserIndex >= start) {
                this.nodes[KdTree.lesser(nodeIndex)] = sortedArray[lesserIndex];
            }
            if (greaterIndex < end) {
                this.nodes[KdTree.greater(nodeIndex)] = sortedArray[greaterIndex];
            }
            return;
        }
        for (let i = start; i < end; i++) {
            tempArray[i] = sortedArray[i];
        }
        // Partition the index arrays not in the pivot dimension around the median key in the pivot dimension and at the
        // same time rotate the index arrays such that the index array sorted in the next pivot dimension is located at
        // index 0.
        for (let i = 1; i < this.dimensionCount; i++) {
            const targetArray = this.indexArrays[i - 1];
            const toPartitionArray = this.indexArrays[i];
            let lesserCount = 0;
            let greaterCount = 0;
            for (let j = start; j < end; j++) {
                const keyIndex = toPartitionArray[j];
                if (keyIndex === medianKeyIndex) {
                    targetArray[medianIndex] = keyIndex;
                }
                else {
                    const comparison = this.indexSortFuncs[pivotDimension](keyIndex, medianKeyIndex);
                    if (comparison <= 0) {
                        const index = start + (lesserCount++);
                        targetArray[index] = keyIndex;
                    }
                    else {
                        const index = medianIndex + 1 + (greaterCount++);
                        targetArray[index] = keyIndex;
                    }
                }
            }
        }
        // Copy the temporary array (now containing the sorted indexes in the pivot dimension) to the last index array.
        const newSortedArray = this.indexArrays[this.dimensionCount - 1];
        for (let i = start; i < end; i++) {
            newSortedArray[i] = tempArray[i];
        }
        const nextPivotDimension = (pivotDimension + 1) % this.dimensionCount;
        this.buildSubTree(KdTree.lesser(nodeIndex), nextPivotDimension, start, medianIndex);
        this.buildSubTree(KdTree.greater(nodeIndex), nextPivotDimension, medianIndex + 1, end);
    }
    /**
     * Removes all elements from this tree.
     */
    clear() {
        this.elements.length = 0;
        this.keys.length = 0;
        this.nodes.length = 0;
        for (let i = 0; i < this.indexArrays.length; i++) {
            this.indexArrays[i].length = 0;
        }
        this.minDepth = -1;
        this.maxDepth = -1;
    }
    /**
     * Finds the index of a node's parent.
     * @param index the index of the node for which to find the parent.
     * @returns The index of the query node's parent.
     */
    static parent(index) {
        return (index - 1) >> 1;
    }
    /**
     * Finds the index of a node's lesser child.
     * @param index The index of the node for which to find the child.
     * @returns The index of the query node's lesser child.
     */
    static lesser(index) {
        return index * 2 + 1;
    }
    /**
     * Finds the index of a node's greater child.
     * @param index The index of the node for which to find the child.
     * @returns The idnex of the query node's greater child.
     */
    static greater(index) {
        return index * 2 + 2;
    }
    /**
     * Finds the least index of any node located at a given depth.
     * @param depth The depth for which to get the least index. The root of the tree lies at depth 0.
     * @returns The least index of any node located at the specified depth.
     */
    static leastIndexAtDepth(depth) {
        return 1 << depth - 1;
    }
    /**
     * Finds the depth at which a node lies.
     * @param index The index of the node for which to find the depth.
     * @returns The depth at which the node lies. The root of the tree lies at depth 0.
     */
    static depth(index) {
        return Math.trunc(Math.log2(index + 1));
    }
    /**
     * Calculates the Euclidean distance between two keys.
     * @param key1 The first key.
     * @param key2 The second key.
     * @param dimensionCount The number of dimensions in which to calculate the distance.
     * @returns The Euclidean distance between the two keys.
     */
    static distance(key1, key2, dimensionCount) {
        let sumSq = 0;
        for (let i = 0; i < dimensionCount; i++) {
            const diff = key1[i] - key2[i];
            sumSq += diff * diff;
        }
        return Math.sqrt(sumSq);
    }
}
