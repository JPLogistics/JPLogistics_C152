/**
 * A process which dispatches tasks in a task queue potentially over multiple frames.
 */
export class ThrottledTaskQueueProcess {
    /**
     * Constructor.
     * @param queue The queue to process.
     * @param handler A handler which defines the behavior of this process.
     */
    constructor(queue, handler) {
        this.queue = queue;
        this.handler = handler;
        this._hasStarted = false;
        this._hasEnded = false;
        this._shouldAbort = false;
    }
    /**
     * Checks whether this process has been started.
     * @returns whether this process has been started.
     */
    hasStarted() {
        return this._hasStarted;
    }
    /**
     * Checks whether this process has ended.
     * @returns whether this process has ended.
     */
    hasEnded() {
        return this._hasEnded;
    }
    /**
     * Starts this process.
     */
    start() {
        this._hasStarted = true;
        this.processQueue(0);
    }
    /**
     * Processes the queue.
     * @param elapsedFrameCount The number of frames elapsed since queue processing started.
     */
    processQueue(elapsedFrameCount) {
        let dispatchCount = 0;
        const t0 = performance.now();
        while (!this._shouldAbort && this.queue.hasNext()) {
            if (this.handler.canContinue(elapsedFrameCount, dispatchCount, performance.now() - t0)) {
                const task = this.queue.next();
                task();
                dispatchCount++;
            }
            else {
                break;
            }
        }
        if (this._shouldAbort) {
            return;
        }
        if (!this.queue.hasNext()) {
            this.handler.onFinished(elapsedFrameCount);
            this._hasEnded = true;
        }
        else {
            this.handler.onPaused(elapsedFrameCount);
            requestAnimationFrame(this.processQueue.bind(this, elapsedFrameCount + 1));
        }
    }
    /**
     * Aborts this process. Has no effect if the process has not been started or if it has already ended.
     */
    abort() {
        if (this._hasStarted && !this._hasEnded) {
            this.handler.onAborted();
            this._shouldAbort = true;
            this._hasEnded = true;
        }
    }
}
