/**
 * A path stream which does nothing on any input.
 */
export class NullPathStream {
    /**
     * Does nothing.
     */
    beginPath() {
        // noop
    }
    /**
     * Does nothing.
     */
    moveTo() {
        // noop
    }
    /**
     * Does nothing.
     */
    lineTo() {
        // noop
    }
    /**
     * Does nothing.
     */
    bezierCurveTo() {
        // noop
    }
    /**
     * Does nothing.
     */
    quadraticCurveTo() {
        // noop
    }
    /**
     * Does nothing.
     */
    arc() {
        // noop
    }
    /**
     * Does nothing.
     */
    closePath() {
        // noop
    }
}
/**
 * An abstract implementation of a path stream which sends a transformed version of its input to be consumed by another
 * stream.
 */
export class AbstractTransformingPathStream {
    /**
     * Constructor.
     * @param consumer The path stream that consumes this stream's transformed output.
     */
    constructor(consumer) {
        this.consumer = consumer;
    }
    /**
     * Sets the path stream that consumes this stream's transformed output.
     * @param consumer The new consuming path stream.
     */
    setConsumer(consumer) {
        this.consumer = consumer;
    }
}
