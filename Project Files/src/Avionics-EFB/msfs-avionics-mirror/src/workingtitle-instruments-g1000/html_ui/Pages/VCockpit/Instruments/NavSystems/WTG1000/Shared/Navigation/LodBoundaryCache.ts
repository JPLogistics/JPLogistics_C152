import { LodBoundaryCache as BaseLodBoundaryCache } from 'msfssdk/navigation';

/**
 * A cache for LodBoundary objects.
 */
export class LodBoundaryCache {
  public static readonly SIZE = 500;
  public static readonly DISTANCE_THRESHOLDS: readonly number[] = [0, 0.00003, 0.0001, 0.0003];
  public static readonly VECTOR_COUNT_TARGETS: readonly number[] = [500, 300, 200, 100];

  private static INSTANCE?: BaseLodBoundaryCache;

  /**
   * Gets an instance of LodBoundaryCache.
   * @returns An instance of LodBoundaryCache.
   */
  public static getCache(): BaseLodBoundaryCache {
    return LodBoundaryCache.INSTANCE ??= new BaseLodBoundaryCache(LodBoundaryCache.SIZE, LodBoundaryCache.DISTANCE_THRESHOLDS, LodBoundaryCache.VECTOR_COUNT_TARGETS);
  }
}