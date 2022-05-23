import { GeoCircleResampler } from '../../geo';
import { AbstractTransformingPathStream, GeoProjectionPathStream, TransformingPathStreamStack } from '../../graphics/path';
/**
 * A stack of {@link TransformingPathStream}s which transforms an input in spherical geographic coordinates to planar
 * projected coordinates. The stack contains two sub-stacks: a pre-projected stack which transforms the path before
 * it is projected, and a post-projected stack which transforms the projected path before it is sent to the consumer.
 * Transforming streams can be added to the top and bottom of each sub-stack. The input will be passed through each
 * stream in the pre-projected stack from top to bottom, then projected, then passed through each stream in the post-
 * projected stack from top to bottom, and the final transformed output will be passed to the consumer.
 */
export class GeoProjectionPathStreamStack extends AbstractTransformingPathStream {
    // eslint-disable-next-line jsdoc/require-jsdoc
    constructor(consumer, projection, arg1, arg2, arg3) {
        super(consumer);
        this.postStack = new TransformingPathStreamStack(consumer);
        if (arg1 instanceof GeoCircleResampler) {
            this.projectionStream = new GeoProjectionPathStream(this.postStack, projection, arg1);
        }
        else {
            this.projectionStream = new GeoProjectionPathStream(this.postStack, projection, arg1, arg2, arg3);
        }
        this.preStack = new TransformingPathStreamStack(this.projectionStream);
    }
    /**
     * Gets the projection used by this stream.
     * @returns The projection used by this stream.
     */
    getProjection() {
        return this.projectionStream.getProjection();
    }
    /**
     * Sets the projection used by this stream.
     * @param projection A projection.
     */
    setProjection(projection) {
        this.projectionStream.setProjection(projection);
    }
    /**
     * Adds a transforming path stream to the top of the pre-projected stack.
     * @param stream A transforming path stream.
     */
    pushPreProjected(stream) {
        this.preStack.push(stream);
    }
    /**
     * Removes the top-most path stream from the pre-projected stack. The removed stream will have its consumer set to
     * {@link NullPathStream.INSTANCE}.
     * @returns The removed path stream, or undefined if this stack was empty.
     */
    popPreProjected() {
        return this.preStack.pop();
    }
    /**
     * Adds a transforming path stream to the bottom of the pre-projected stack.
     * @param stream A transforming path stream.
     */
    unshiftPreProjected(stream) {
        this.preStack.unshift(stream);
    }
    /**
     * Removes the bottom-most path stream from the pre-projected stack. The removed stream will have its consumer set to
     * {@link NullPathStream.INSTANCE}.
     * @returns The removed path stream, or undefined if this stack was empty.
     */
    shiftPreProjected() {
        return this.preStack.shift();
    }
    /**
     * Adds a transforming path stream to the top of the post-projected stack.
     * @param stream A transforming path stream.
     */
    pushPostProjected(stream) {
        this.postStack.push(stream);
    }
    /**
     * Removes the top-most path stream from the post-projected stack. The removed stream will have its consumer set to
     * {@link NullPathStream.INSTANCE}.
     * @returns The removed path stream, or undefined if this stack was empty.
     */
    popPostProjected() {
        return this.postStack.pop();
    }
    /**
     * Adds a transforming path stream to the bottom of the post-projected stack.
     * @param stream A transforming path stream.
     */
    unshiftPostProjected(stream) {
        this.postStack.unshift(stream);
    }
    /**
     * Removes the bottom-most path stream from the post-projected stack. The removed stream will have its consumer set
     * to {@link NullPathStream.INSTANCE}.
     * @returns The removed path stream, or undefined if this stack was empty.
     */
    shiftPostProjected() {
        return this.postStack.shift();
    }
    /** @inheritdoc */
    setConsumer(consumer) {
        this.postStack.setConsumer(consumer);
        super.setConsumer(consumer);
    }
    /** @inheritdoc */
    beginPath() {
        this.preStack.beginPath();
    }
    /** @inheritdoc */
    moveTo(x, y) {
        this.preStack.moveTo(x, y);
    }
    /** @inheritdoc */
    lineTo(x, y) {
        this.preStack.lineTo(x, y);
    }
    /** @inheritdoc */
    bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
        this.preStack.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
    }
    /** @inheritdoc */
    quadraticCurveTo(cpx, cpy, x, y) {
        this.preStack.quadraticCurveTo(cpx, cpy, x, y);
    }
    /** @inheritdoc */
    arc(x, y, radius, startAngle, endAngle, counterClockwise) {
        this.preStack.arc(x, y, radius, startAngle, endAngle, counterClockwise);
    }
    /** @inheritdoc */
    closePath() {
        this.preStack.closePath();
    }
}
