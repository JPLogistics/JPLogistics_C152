import { ArrayTaskQueue, ThrottledTaskQueueProcess } from '../utils/task';
/**
 * A nearest search session for boundaries (airspaces) in the form of LodBoundary objects.
 */
export class NearestLodBoundarySearchSession {
    /**
     * Constructor.
     * @param cache The boundary cache this search session uses.
     * @param session The nearest boundary facility search session this search session uses.
     * @param frameBudget The maximum amount of time allotted per frame to retrieve and process LodBoundary objects, in
     * milliseconds.
     */
    constructor(cache, session, frameBudget) {
        this.cache = cache;
        this.session = session;
        this.frameBudget = frameBudget;
    }
    /**
     * Searches for the nearest boundaries around a specified location.
     * @param lat The latitude of the search center, in degrees.
     * @param lon The longitude of the search center, in degrees.
     * @param radius The radius of the search, in meters.
     * @param maxItems The maximum number of items for which to search.
     * @returns The nearest search results.
     */
    async searchNearest(lat, lon, radius, maxItems) {
        const facilityResults = await this.session.searchNearest(lat, lon, radius, maxItems);
        const results = { added: [], removed: facilityResults.removed };
        const tasks = facilityResults.added.map((fac, index) => () => { results.added[index] = this.cache.get(fac); });
        await new Promise(resolve => {
            const taskQueue = new ThrottledTaskQueueProcess(new ArrayTaskQueue(tasks), new NearestLodBoundarySearchTaskQueueHandler(this.frameBudget, resolve));
            taskQueue.start();
        });
        return results;
    }
    /**
     * Sets this session's boundary class filter. The new filter takes effect with the next search executed in this
     * session.
     * @param classMask A bitmask defining the boundary classes to include in the search (`0`: exclude, `1`: include).
     * The bit index for each boundary class is equal to the value of the corresponding `BoundaryType` enum.
     */
    setFilter(classMask) {
        this.session.setBoundaryFilter(classMask);
    }
}
/**
 * A throttled task queue handler for retrieving and creating new LodBoundary objects in response to a nearest search.
 */
class NearestLodBoundarySearchTaskQueueHandler {
    /**
     * Constructor.
     * @param frameBudget The maximum amount of time allotted per frame to retrieve and process LodBoundary objects, in
     * milliseconds.
     * @param resolve The Promise resolve function this handler will call when the task queue is finished.
     */
    constructor(frameBudget, resolve) {
        this.frameBudget = frameBudget;
        this.resolve = resolve;
    }
    /** @inheritdoc */
    onStarted() {
        // noop
    }
    /** @inheritdoc */
    canContinue(elapsedFrameCount, dispatchedTaskCount, timeElapsed) {
        return timeElapsed < this.frameBudget;
    }
    /** @inheritdoc */
    onPaused() {
        // noop
    }
    /** @inheritdoc */
    onFinished() {
        this.resolve();
    }
    /** @inheritdoc */
    onAborted() {
        // noop
    }
}
