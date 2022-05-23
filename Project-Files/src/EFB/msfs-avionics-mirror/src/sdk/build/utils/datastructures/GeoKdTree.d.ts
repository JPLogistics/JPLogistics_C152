import { LatLonInterface, ReadonlyFloat64Array } from '../..';
/**
 * A visitor function for geo k-d tree searches.
 * @param element A search result.
 * @param point The location of the search result, in cartesian form.
 * @param distance The great-circle distance, in great-arc radians, from the search result to the query point.
 * @param queryPoint The query point, in cartesian form.
 * @returns Whether to continue the search.
 */
export declare type GeoKdTreeSearchVisitor<T> = (element: T, point: ReadonlyFloat64Array, distance: number, queryPoint: ReadonlyFloat64Array) => boolean;
/**
 * A filtering function for k-d tree searches.
 * @param element A candidate search result.
 * @param point The location of the candidate search result, in cartesian form.
 * @param distance The great-circle distance, in great-arc radians, from the candidate search result to the query point.
 * @param queryPoint The query point, in cartesian form.
 * @returns Whether to include the candidate in the final search results.
 */
export declare type GeoKdTreeSearchFilter<T> = (element: T, point: ReadonlyFloat64Array, distance: number, queryPoint: ReadonlyFloat64Array) => boolean;
/**
 * A spatial tree which is keyed on points on Earth's surface and allows searching for elements based on the great-
 * circle distances from their keys to a query point.
 */
export declare class GeoKdTree<T> {
    private readonly keyFunc;
    private static readonly vec3Cache;
    private readonly cartesianTree;
    /**
     * Constructor.
     * @param keyFunc A function which generates keys from elements. Keys are cartesian representations of points on
     * Earth's surface.
     * @throws Error if the dimension count is less than 2.
     */
    constructor(keyFunc: (element: T, out: Float64Array) => Float64Array);
    /**
     * Searches this tree for elements located near a query point and visits each of them with a function.
     * @param lat The latitude of the query point, in degrees.
     * @param lon The longitude of the query point, in degrees.
     * @param radius The radius around the query point to search, in great-arc radians.
     * @param visitor A visitor function. This function will be called once per element found within the search radius.
     * If the visitor returns `true`, then the search will continue; if the visitor returns `false`, the search will
     * immediately halt.
     */
    search(lat: number, lon: number, radius: number, visitor: GeoKdTreeSearchVisitor<T>): void;
    /**
     * Searches this tree for elements located near a query point and visits each of them with a function.
     * @param center The query point.
     * @param radius The radius around the query point to search, in great-arc radians.
     * @param visitor A visitor function. This function will be called once per element found within the search radius.
     * If the visitor returns `true`, then the search will continue; if the visitor returns `false`, the search will
     * immediately halt.
     */
    search(center: LatLonInterface | ReadonlyFloat64Array, radius: number, visitor: GeoKdTreeSearchVisitor<T>): void;
    /**
     * Searches this tree for elements located near a query point and returns them in order of increasing distance from
     * the query key.
     * @param lat The latitude of the query point, in degrees.
     * @param lon The longitude of the query point, in degrees.
     * @param radius The radius around the query point to search, in great-arc radians.
     * @param maxResultCount The maximum number of search results to return.
     * @param out An array in which to store the search results.
     * @param filter A function to filter the search results.
     * @returns An array containing the search results, in order of increasing distance from the query key.
     */
    search(lat: number, lon: number, radius: number, maxResultCount: number, out: T[], filter?: GeoKdTreeSearchFilter<T>): T[];
    /**
     * Searches this tree for elements located near a query point and returns them in order of increasing distance from
     * the query key.
     * @param center The query point.
     * @param radius The radius around the query point to search, in great-arc radians.
     * @param maxResultCount The maximum number of search results to return.
     * @param out An array in which to store the search results.
     * @param filter A function to filter the search results.
     * @returns An array containing the search results, in order of increasing distance from the query key.
     */
    search(center: LatLonInterface | ReadonlyFloat64Array, radius: number, maxResultCount: number, out: T[], filter?: GeoKdTreeSearchFilter<T>): T[];
    /**
     * Performs a tree search with a visitor function.
     * @param center The query point.
     * @param radiusCartesian The query radius.
     * @param visitor A visitor function. This function will be called once per element found within the search radius.
     * If the visitor returns `true`, then the search will continue; if the visitor returns `false`, the search will
     * immediately halt.
     */
    private doVisitorSearch;
    /**
     * Performs a tree search and returns an array of search results.
     * @param center The query point.
     * @param radiusCartesian The query radius.
     * @param maxResultCount The maximum number of search results to return.
     * @param out An array in which to store the search results.
     * @param filter A function to filter the search results.
     * @returns An array containing the search results, in order of increasing distance from the query key.
     */
    private doResultsSearch;
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
     * Rebuilds and balances this tree.
     */
    rebuild(): void;
    /**
     * Removes all elements from this tree.
     */
    clear(): void;
}
//# sourceMappingURL=GeoKdTree.d.ts.map