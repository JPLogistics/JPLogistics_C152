import { LodBoundaryCache } from './LodBoundaryCache';
/**
 * A cache for LodBoundary objects.
 */
export declare class DefaultLodBoundaryCache {
    static readonly SIZE = 500;
    static readonly DISTANCE_THRESHOLDS: readonly number[];
    static readonly VECTOR_COUNT_TARGETS: readonly number[];
    private static INSTANCE?;
    /**
     * Gets an instance of DefaultLodBoundaryCache.
     * @returns An instance of DefaultLodBoundaryCache.
     */
    static getCache(): LodBoundaryCache;
}
//# sourceMappingURL=DefaultLodBoundaryCache.d.ts.map