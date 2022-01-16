/**
 * A task queue backed by an array.
 */
export class ArrayTaskQueue {
    /**
     * Constructor.
     * @param tasks The array of tasks in this queue.
     */
    constructor(tasks) {
        this.tasks = tasks;
        this.head = 0;
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    hasNext() {
        return this.head < this.tasks.length;
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    next() {
        return this.tasks[this.head++];
    }
}
