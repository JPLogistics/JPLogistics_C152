/**
 * A class for caching images.
 * Do your own instrument specific implementation with an init() method
 * that will add images to cache on instrument load to prefill the cache.
 * @class ImageCache
 */
export declare abstract class ImageCache {
    private static cache;
    /**
     * Loads the image from the url and adds it to the cache.
     * @static
     * @param key The image key to access it later.
     * @param url The url to load the image from.
     */
    static addToCache(key: string, url: string): void;
    /**
     * Gets a cached image element.
     * @static
     * @param key The key of the cached image.
     * @returns The cached image element.
     */
    static get(key: string): HTMLImageElement;
}
//# sourceMappingURL=ImageCache.d.ts.map