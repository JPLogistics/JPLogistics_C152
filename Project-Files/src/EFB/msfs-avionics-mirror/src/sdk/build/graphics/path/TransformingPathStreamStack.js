import { AbstractTransformingPathStream, NullPathStream } from './PathStream';
/**
 * A stack of {@link TransformingPathStream}s. Inputs are passed through the entire stack from top to bottom before the
 * final transformed output is sent to a consuming stream.
 */
export class TransformingPathStreamStack extends AbstractTransformingPathStream {
    constructor() {
        super(...arguments);
        this.stack = [];
    }
    /**
     * Adds a transforming path stream to the top of this stack.
     * @param stream A transforming path stream.
     */
    push(stream) {
        var _a;
        stream.setConsumer((_a = this.stack[this.stack.length - 1]) !== null && _a !== void 0 ? _a : this.consumer);
        this.stack.push(stream);
    }
    /**
     * Removes the top-most path stream from this stack. The removed stream will have its consumer set to
     * {@link NullPathStream.INSTANCE}.
     * @returns The removed path stream, or undefined if this stack was empty.
     */
    pop() {
        const removed = this.stack.pop();
        removed === null || removed === void 0 ? void 0 : removed.setConsumer(NullPathStream.INSTANCE);
        return removed;
    }
    /**
     * Adds a transforming path stream to the bottom of this stack.
     * @param stream A transforming path stream.
     */
    unshift(stream) {
        const displaced = this.stack[0];
        displaced === null || displaced === void 0 ? void 0 : displaced.setConsumer(stream);
        stream.setConsumer(this.consumer);
        this.stack.unshift(stream);
    }
    /**
     * Removes the bottom-most path stream from this stack. The removed stream will have its consumer set to
     * {@link NullPathStream.INSTANCE}.
     * @returns The removed path stream, or undefined if this stack was empty.
     */
    shift() {
        var _a;
        const removed = this.stack.shift();
        removed === null || removed === void 0 ? void 0 : removed.setConsumer(NullPathStream.INSTANCE);
        (_a = this.stack[0]) === null || _a === void 0 ? void 0 : _a.setConsumer(this.consumer);
        return removed;
    }
    /** @inheritdoc */
    setConsumer(consumer) {
        var _a;
        (_a = this.stack[0]) === null || _a === void 0 ? void 0 : _a.setConsumer(consumer);
        super.setConsumer(consumer);
    }
    /** @inheritdoc */
    beginPath() {
        var _a;
        ((_a = this.stack[this.stack.length - 1]) !== null && _a !== void 0 ? _a : this.consumer).beginPath();
    }
    /** @inheritdoc */
    moveTo(x, y) {
        var _a;
        ((_a = this.stack[this.stack.length - 1]) !== null && _a !== void 0 ? _a : this.consumer).moveTo(x, y);
    }
    /** @inheritdoc */
    lineTo(x, y) {
        var _a;
        ((_a = this.stack[this.stack.length - 1]) !== null && _a !== void 0 ? _a : this.consumer).lineTo(x, y);
    }
    /** @inheritdoc */
    bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
        var _a;
        ((_a = this.stack[this.stack.length - 1]) !== null && _a !== void 0 ? _a : this.consumer).bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
    }
    /** @inheritdoc */
    quadraticCurveTo(cpx, cpy, x, y) {
        var _a;
        ((_a = this.stack[this.stack.length - 1]) !== null && _a !== void 0 ? _a : this.consumer).quadraticCurveTo(cpx, cpy, x, y);
    }
    /** @inheritdoc */
    arc(x, y, radius, startAngle, endAngle, counterClockwise) {
        var _a;
        ((_a = this.stack[this.stack.length - 1]) !== null && _a !== void 0 ? _a : this.consumer).arc(x, y, radius, startAngle, endAngle, counterClockwise);
    }
    /** @inheritdoc */
    closePath() {
        this.stack[this.stack.length - 1].closePath();
    }
}
