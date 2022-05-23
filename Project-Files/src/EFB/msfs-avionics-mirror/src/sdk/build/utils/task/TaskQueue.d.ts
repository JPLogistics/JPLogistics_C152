/** A task. */
export declare type Task = () => void;
/**
 * A task queue.
 */
export interface TaskQueue {
    /**
     * Checks whether this queue has more tasks.
     * @returns whether this queue has more tasks.
     */
    hasNext(): boolean;
    /**
     * Gets the next task in this queue.
     * @returns the next task in this queue.
     * @throws when the queue is empty.
     */
    next(): Task;
}
/**
 * A task queue backed by an array.
 */
export declare class ArrayTaskQueue {
    private readonly tasks;
    private head;
    /**
     * Constructor.
     * @param tasks The array of tasks in this queue.
     */
    constructor(tasks: Task[]);
    hasNext(): boolean;
    next(): Task;
}
//# sourceMappingURL=TaskQueue.d.ts.map