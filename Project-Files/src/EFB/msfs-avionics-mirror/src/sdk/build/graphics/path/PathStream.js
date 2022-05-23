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
/** An instance of a {@link NullPathStream}. */
NullPathStream.INSTANCE = new NullPathStream();
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
    /** @inheritdoc */
    getConsumer() {
        return this.consumer;
    }
    /** @inheritdoc */
    setConsumer(consumer) {
        this.consumer = consumer;
    }
}
/**
 * A path stream which sends its inputs unchanged to be consumed by another stream.
 */
export class PassThroughPathStream extends AbstractTransformingPathStream {
    /** @inheritdoc */
    beginPath() {
        this.consumer.beginPath();
    }
    /** @inheritdoc */
    moveTo(x, y) {
        this.consumer.moveTo(x, y);
    }
    /** @inheritdoc */
    lineTo(x, y) {
        this.consumer.lineTo(x, y);
    }
    /** @inheritdoc */
    bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
        this.consumer.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
    }
    /** @inheritdoc */
    quadraticCurveTo(cpx, cpy, x, y) {
        this.consumer.quadraticCurveTo(cpx, cpy, x, y);
    }
    /** @inheritdoc */
    arc(x, y, radius, startAngle, endAngle, counterClockwise) {
        this.consumer.arc(x, y, radius, startAngle, endAngle, counterClockwise);
    }
    /** @inheritdoc */
    closePath() {
        this.consumer.closePath();
    }
}
