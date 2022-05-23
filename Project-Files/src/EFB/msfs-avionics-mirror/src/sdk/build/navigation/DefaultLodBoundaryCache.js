import { LodBoundaryCache } from './LodBoundaryCache';
/**
 * A cache for LodBoundary objects.
 */
export class DefaultLodBoundaryCache {
    /**
     * Gets an instance of DefaultLodBoundaryCache.
     * @returns An instance of DefaultLodBoundaryCache.
     */
    static getCache() {
        var _a;
        return (_a = DefaultLodBoundaryCache.INSTANCE) !== null && _a !== void 0 ? _a : (DefaultLodBoundaryCache.INSTANCE = new LodBoundaryCache(DefaultLodBoundaryCache.SIZE, DefaultLodBoundaryCache.DISTANCE_THRESHOLDS, DefaultLodBoundaryCache.VECTOR_COUNT_TARGETS));
    }
}
DefaultLodBoundaryCache.SIZE = 500;
DefaultLodBoundaryCache.DISTANCE_THRESHOLDS = [0, 0.00003, 0.0001, 0.0003];
DefaultLodBoundaryCache.VECTOR_COUNT_TARGETS = [500, 300, 200, 100];
