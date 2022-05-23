import { GeoPoint, Vec3Math } from '../..';
import { KdTree } from './KdTree';
/**
 * A spatial tree which is keyed on points on Earth's surface and allows searching for elements based on the great-
 * circle distances from their keys to a query point.
 */
export class GeoKdTree {
    /**
     * Constructor.
     * @param keyFunc A function which generates keys from elements. Keys are cartesian representations of points on
     * Earth's surface.
     * @throws Error if the dimension count is less than 2.
     */
    constructor(keyFunc) {
        this.keyFunc = keyFunc;
        this.cartesianTree = new KdTree(3, (element, out) => {
            const vec = this.keyFunc(element, GeoKdTree.vec3Cache[0]);
            out[0] = vec[0];
            out[1] = vec[1];
            out[2] = vec[2];
            return out;
        });
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    search(arg1, arg2, arg3, arg4, arg5, arg6) {
        let center, radius;
        let argA, argB, argC;
        if (typeof arg1 === 'number') {
            center = GeoPoint.sphericalToCartesian(arg1, arg2, GeoKdTree.vec3Cache[1]);
            radius = arg3;
            argA = arg4;
            argB = arg5;
            argC = arg6;
        }
        else if (!(arg1 instanceof Float64Array)) {
            center = GeoPoint.sphericalToCartesian(arg1, GeoKdTree.vec3Cache[1]);
            radius = arg2;
            argA = arg3;
            argB = arg4;
            argC = arg5;
        }
        else {
            center = arg1;
            radius = arg2;
            argA = arg3;
            argB = arg4;
            argC = arg5;
        }
        const radiusCartesian = Math.sqrt(2 * (1 - Math.cos(Utils.Clamp(radius, 0, Math.PI))));
        if (typeof argA === 'number') {
            return this.doResultsSearch(center, radiusCartesian, argA, argB, argC);
        }
        else {
            this.doVisitorSearch(center, radiusCartesian, argA);
        }
    }
    /**
     * Performs a tree search with a visitor function.
     * @param center The query point.
     * @param radiusCartesian The query radius.
     * @param visitor A visitor function. This function will be called once per element found within the search radius.
     * If the visitor returns `true`, then the search will continue; if the visitor returns `false`, the search will
     * immediately halt.
     */
    doVisitorSearch(center, radiusCartesian, visitor) {
        this.cartesianTree.searchKey(center, radiusCartesian, (element, key) => {
            const vec = Vec3Math.set(key[0], key[1], key[2], GeoKdTree.vec3Cache[2]);
            const greatCircleDist = GeoPoint.distance(vec, center);
            return visitor(element, vec, greatCircleDist, center);
        });
    }
    /**
     * Performs a tree search and returns an array of search results.
     * @param center The query point.
     * @param radiusCartesian The query radius.
     * @param maxResultCount The maximum number of search results to return.
     * @param out An array in which to store the search results.
     * @param filter A function to filter the search results.
     * @returns An array containing the search results, in order of increasing distance from the query key.
     */
    doResultsSearch(center, radiusCartesian, maxResultCount, out, filter) {
        const cartesianFilter = filter
            ? (element, key) => {
                const vec = Vec3Math.set(key[0], key[1], key[2], GeoKdTree.vec3Cache[2]);
                const greatCircleDist = GeoPoint.distance(vec, center);
                return filter(element, vec, greatCircleDist, center);
            }
            : undefined;
        return this.cartesianTree.searchKey(center, radiusCartesian, maxResultCount, out, cartesianFilter);
    }
    /**
     * Inserts an element into this tree. This operation will trigger a rebalancing if, after the insertion, the length
     * of this tree's longest branch is more than twice the length of the shortest branch.
     * @param element The element to insert.
     */
    insert(element) {
        this.cartesianTree.insert(element);
    }
    /**
     * Inserts a batch of elements into this tree. This tree will be rebalanced after the elements are inserted.
     * @param elements An iterable of the elements to insert.
     */
    insertAll(elements) {
        this.cartesianTree.insertAll(elements);
    }
    /**
     * Removes an element from this tree. This tree will be rebalanced after the element is removed.
     * @param element The element to remove.
     * @returns Whether the element was removed.
     */
    remove(element) {
        return this.cartesianTree.remove(element);
    }
    /**
     * Removes a batch of elements from this tree. This tree will be rebalanced after the elements are removed.
     * @param elements An iterable of the elements to remove.
     * @returns Whether at least one element was removed.
     */
    removeAll(elements) {
        return this.cartesianTree.removeAll(elements);
    }
    /**
     * Rebuilds and balances this tree.
     */
    rebuild() {
        this.cartesianTree.rebuild();
    }
    /**
     * Removes all elements from this tree.
     */
    clear() {
        this.cartesianTree.clear();
    }
}
GeoKdTree.vec3Cache = [new Float64Array(3), new Float64Array(3), new Float64Array(3), new Float64Array(3)];
