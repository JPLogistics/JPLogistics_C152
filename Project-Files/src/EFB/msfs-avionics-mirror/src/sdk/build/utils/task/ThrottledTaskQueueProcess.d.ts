import { TaskQueue } from './TaskQueue';
/**
 * A handler which defines the behavior of a ThrottledTaskQueueProcess.
 */
export interface ThrottledTaskQueueHandler {
    /**
     * This method is called when queue processing is started.
     */
    onStarted(): void;
    /**
     * Checks if queue processing can continue in the current frame. If this method returns false, queue processing will
     * pause in the current frame and resume in the next frame via requestAnimationFrame().
     * @param elapsedFrameCount The number of frames elapsed since queue processing started. Equal to 0 on the first
     * frame, 1 on the second, etc.
     * @param dispatchedTaskCount The number of tasks already dispatched in the current frame.
     * @param timeElapsed The time elapsed so far in the current frame, in milliseconds.
     * @returns whether queue processing can continue in the current frame.
     */
    canContinue(elapsedFrameCount: number, dispatchedTaskCount: number, timeElapsed: number): boolean;
    /**
     * This method is called when queue processing is paused.
     * @param elapsedFrameCount The number of frames elapsed since queue processing started. Equal to 0 on the first
     * frame, 1 on the second, etc.
     */
    onPaused(elapsedFrameCount: number): void;
    /**
     * This method is called when queue processing is finished.
     * @param elapsedFrameCount The number of frames elpased since queue processing started. Equal to 0 on the first
     * frame, 1 on the second, etc.
     */
    onFinished(elapsedFrameCount: number): void;
    /**
     * This method is called when queue processing is aborted.
     */
    onAborted(): void;
}
/**
 * A process which dispatches tasks in a task queue potentially over multiple frames.
 */
export declare class ThrottledTaskQueueProcess {
    private readonly queue;
    private readonly handler;
    private _hasStarted;
    private _hasEnded;
    private _shouldAbort;
    /**
     * Constructor.
     * @param queue The queue to process.
     * @param handler A handler which defines the behavior of this process.
     */
    constructor(queue: TaskQueue, handler: ThrottledTaskQueueHandler);
    /**
     * Checks whether this process has been started.
     * @returns whether this process has been started.
     */
    hasStarted(): boolean;
    /**
     * Checks whether this process has ended.
     * @returns whether this process has ended.
     */
    hasEnded(): boolean;
    /**
     * Starts this process.
     */
    start(): void;
    /**
     * Processes the queue.
     * @param elapsedFrameCount The number of frames elapsed since queue processing started.
     */
    private processQueue;
    /**
     * Aborts this process. Has no effect if the process has not been started or if it has already ended.
     */
    abort(): void;
}
//# sourceMappingURL=ThrottledTaskQueueProcess.d.ts.map