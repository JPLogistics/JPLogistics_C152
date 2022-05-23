import { ReadonlyFloat64Array } from '../..';
/**
 * A visitor function for k-d tree searches.
 * @param element A search result.
 * @param key The key of the search result.
 * @param distance The distance from the search result's key to the query key.
 * @param queryKey The query key.
 * @param queryElement The query element, or undefined if the search was initiated directly from a key.
 * @returns Whether to continue the search.
 */
export declare type KdTreeSearchVisitor<T> = (element: T, key: ReadonlyFloat64Array, distance: number, queryKey: ReadonlyFloat64Array, queryElement: T | undefined) => boolean;
/**
 * A filtering function for k-d tree searches.
 * @param element A candidate search result.
 * @param key The key of the candidate search result.
 * @param distance The distance from the candidate search result's key to the query key.
 * @param queryKey The query key.
 * @param queryElement The query element, or undefined if the search was initiated directly from a key.
 * @returns Whether to include the candidate in the final search results.
 */
export declare type KdTreeSearchFilter<T> = (element: T, key: ReadonlyFloat64Array, distance: number, queryKey: ReadonlyFloat64Array, queryElement: T | undefined) => boolean;
/**
 * A k-dimensional search tree.
 */
export declare class KdTree<T> {
    private readonly keyFunc;
    readonly dimensionCount: number;
    private readonly elements;
    private readonly keys;
    private readonly nodes;
    private minDepth;
    private maxDepth;
    private readonly indexArrays;
    private readonly indexSortFuncs;
    private readonly keyCache;
    /** The number of elements in this tree. */
    get size(): number;
    /**
     * Constructor.
     * @param dimensionCount The number of dimensions supported by this tree. If this argument is not an integer, it will
     * be truncated to one.
     * @param keyFunc A function which generates keys from elements. Keys are an N-tuple of numbers, where N is equal to
     * the dimension count of this tree.
     * @throws Error if the dimension count is less than 2.
     */
    constructor(dimensionCount: number, keyFunc: (element: T, out: Float64Array) => Float64Array);
    /**
     * Searches this tree for elements whose keys are located near a query key and visits each of them with a function.
     * @param key The query key.
     * @param radius The radius around the query key to search.
     * @param visitor A visitor function. This function will be called once per element found within the search radius.
     * If the visitor returns `true`, then the search will continue; if the visitor returns `false`, the search will
     * immediately halt.
     */
    searchKey(key: ReadonlyFloat64Array, radius: number, visitor: KdTreeSearchVisitor<T>): void;
    /**
     * Searches this tree for elements whose keys are located near a query key and returns them in order of increasing
     * distance from the query key.
     * @param key The query key.
     * @param radius The radius around the query key to search.
     * @param maxResultCount The maximum number of search results to return.
     * @param out An array in which to store the search results.
     * @param filter A function to filter the search results.
     * @returns An array containing the search results, in order of increasing distance from the query key.
     */
    searchKey(key: ReadonlyFloat64Array, radius: number, maxResultCount: number, out: T[], filter?: KdTreeSearchFilter<T>): T[];
    /**
     * Searches this tree for elements whose keys are located near the key of a query element and visits each of them
     * with a function.
     * @param element The query element.
     * @param radius The radius around the query element's key to search.
     * @param visitor A visitor function. This function will be called once per element found within the search radius.
     * If the visitor returns `true`, then the search will continue; if the visitor returns `false`, the search will
     * immediately halt.
     */
    search(element: T, radius: number, visitor: KdTreeSearchVisitor<T>): void;
    /**
     * Searches this tree for elements whose keys are located near the key of a query element and returns them in order
     * of increasing distance from the query key.
     * @param element The query element.
     * @param radius The radius around the query key to search.
     * @param maxResultCount The maximum number of search results to return.
     * @param out An array in which to store the search results.
     * @param filter A function to filter the search results.
     * @returns An array containing the search results, in order of increasing distance from the query key.
     */
    search(element: T, radius: number, maxResultCount: number, out: T[], filter?: KdTreeSearchFilter<T>): T[];
    /**
     * Performs a tree search with a visitor function.
     * @param element The query element, or undefined if none exists.
     * @param key The query key.
     * @param radius The search radius.
     * @param visitor A visitor function. This function will be called once per element found within the search radius.
     * If the visitor returns `true`, then the search will continue; if the visitor returns `false`, the search will
     * immediately halt.
     */
    private doVisitorSearch;
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
    private doResultsSearch;
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
    private searchTree;
    /**
     * Inserts an element into this tree. This operation will trigger a rebalancing if, after the insertion, the length
     * of this tree's longest branch is more than twice the length of the shortest branch.
     * @param element The element to insert.
     */
    insert(element: T): void;
    /**
     * Inserts a batch of elements into this tree. This tree will be rebalanced after the elements are inserted.
     * @param elements An iterable of the elements to insert.
     */
    insertAll(elements: Iterable<T>): void;
    /**
     * Inserts an element into this tree.
     * @param element The element to insert.
     * @returns The depth at which the element was inserted, with 0 being the depth of the root.
     */
    private insertElementInTree;
    /**
     * Removes an element from this tree. This tree will be rebalanced after the element is removed.
     * @param element The element to remove.
     * @returns Whether the element was removed.
     */
    remove(element: T): boolean;
    /**
     * Removes a batch of elements from this tree. This tree will be rebalanced after the elements are removed.
     * @param elements An iterable of the elements to remove.
     * @returns Whether at least one element was removed.
     */
    removeAll(elements: Iterable<T>): boolean;
    /**
     * Removes an element and all references to it from this tree's arrays. This method does not change the structure
     * of this tree to reflect the removal of the element.
     * @param element The element to remove.
     * @returns Whether the element was removed.
     */
    private removeElementFromArrays;
    /**
     * Rebuilds and balances this tree.
     */
    rebuild(): void;
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
    private buildSubTree;
    /**
     * Removes all elements from this tree.
     */
    clear(): void;
    /**
     * Finds the index of a node's parent.
     * @param index the index of the node for which to find the parent.
     * @returns The index of the query node's parent.
     */
    private static parent;
    /**
     * Finds the index of a node's lesser child.
     * @param index The index of the node for which to find the child.
     * @returns The index of the query node's lesser child.
     */
    private static lesser;
    /**
     * Finds the index of a node's greater child.
     * @param index The index of the node for which to find the child.
     * @returns The idnex of the query node's greater child.
     */
    private static greater;
    /**
     * Finds the least index of any node located at a given depth.
     * @param depth The depth for which to get the least index. The root of the tree lies at depth 0.
     * @returns The least index of any node located at the specified depth.
     */
    private static leastIndexAtDepth;
    /**
     * Finds the depth at which a node lies.
     * @param index The index of the node for which to find the depth.
     * @returns The depth at which the node lies. The root of the tree lies at depth 0.
     */
    private static depth;
    /**
     * Calculates the Euclidean distance between two keys.
     * @param key1 The first key.
     * @param key2 The second key.
     * @param dimensionCount The number of dimensions in which to calculate the distance.
     * @returns The Euclidean distance between the two keys.
     */
    private static distance;
}
//# sourceMappingURL=KdTree.d.ts.map