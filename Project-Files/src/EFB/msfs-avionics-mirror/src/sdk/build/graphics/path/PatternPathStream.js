import { Vec2Math, VecNSubject } from '../..';
import { AffineTransformPathStream } from './AffineTransformPathStream';
import { ClippedPathStream } from './ClippedPathStream';
/**
 * A {@link TransformingPathStream} which converts an input path into path commands to draw a repeating pattern along
 * the input path.
 */
export class PatternPathStream {
    /**
     * Constructor.
     * @param consumer The path stream that consumes this stream's transformed output.
     * @param pattern The pattern drawn by this stream. If the pattern is `null`, then this stream will pass through path
     * commands to its consumer without transforming them into a pattern.
     */
    constructor(consumer, pattern) {
        this.pattern = pattern;
        this.clipBounds = VecNSubject.createFromVector(new Float64Array([Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER]));
        this.firstPoint = new Float64Array([NaN, NaN]);
        this.prevPoint = new Float64Array([NaN, NaN]);
        this.distanceLeft = NaN;
        this.transformStream = new AffineTransformPathStream(consumer);
        this.clipStream = new ClippedPathStream(this.transformStream, this.clipBounds);
    }
    /**
     * Gets the pattern drawn by this stream.
     * @returns The pattern drawn by this stream.
     */
    getPattern() {
        return this.pattern;
    }
    /**
     * Sets the pattern drawn by this stream. If the pattern is `null`, then this stream will pass through path commands
     * to its consumer without transforming them into a pattern.
     * @param pattern A pattern.
     */
    setPattern(pattern) {
        if (!isNaN(this.distanceLeft) && this.pattern) {
            this.distanceLeft = Math.max(0, this.distanceLeft - this.pattern.anchor * this.pattern.length);
        }
        this.pattern = pattern;
        if (pattern) {
            if (!isNaN(this.distanceLeft)) {
                this.distanceLeft += pattern.anchor * pattern.length;
            }
        }
        else {
            this.distanceLeft = NaN;
        }
    }
    /** @inheritdoc */
    getConsumer() {
        return this.transformStream.getConsumer();
    }
    /** @inheritdoc */
    setConsumer(consumer) {
        this.transformStream.setConsumer(consumer);
    }
    /** @inheritdoc */
    beginPath() {
        this.reset();
        this.getConsumer().beginPath();
    }
    /** @inheritdoc */
    moveTo(x, y) {
        if (!(isFinite(x) && isFinite(y))) {
            return;
        }
        if (this.prevPoint[0] === x && this.prevPoint[1] === y) {
            return;
        }
        if (isNaN(this.firstPoint[0])) {
            Vec2Math.set(x, y, this.firstPoint);
        }
        Vec2Math.set(x, y, this.prevPoint);
        this.distanceLeft = NaN;
    }
    /** @inheritdoc */
    lineTo(x, y) {
        if (!(isFinite(x) && isFinite(y))) {
            return;
        }
        if (this.prevPoint[0] === x && this.prevPoint[1] === y) {
            return;
        }
        if (isNaN(this.prevPoint[0])) {
            this.moveTo(x, y);
            return;
        }
        if (this.pattern) {
            const x0 = this.prevPoint[0];
            const y0 = this.prevPoint[1];
            const dx = x - x0;
            const dy = y - y0;
            const distance = Math.hypot(dx, dy);
            const angle = Math.atan2(dy, dx);
            this.transformStream.resetTransform()
                .addRotation(angle)
                .addTranslation(x0, y0);
            let nextLength = this.pattern.length;
            if (nextLength > 0) {
                let nextAnchor = Utils.Clamp(this.pattern.anchor, 0, 1);
                let distanceToNextAnchor = isNaN(this.distanceLeft) ? nextLength * nextAnchor : this.distanceLeft;
                this.distanceLeft = distance;
                while (distanceToNextAnchor <= this.distanceLeft && this.distanceLeft >= 0) {
                    this.transformStream.addTranslation(distanceToNextAnchor, 0, 'before');
                    this.clipBounds.set(-nextLength * nextAnchor, Number.MIN_SAFE_INTEGER, nextLength * (1 - nextAnchor), Number.MAX_SAFE_INTEGER);
                    this.clipStream.beginPath();
                    this.pattern.draw(this.clipStream);
                    this.distanceLeft -= distanceToNextAnchor;
                    distanceToNextAnchor = nextLength * (1 - nextAnchor);
                    nextLength = this.pattern.length;
                    if (nextLength <= 0) {
                        this.distanceLeft = NaN;
                        break;
                    }
                    nextAnchor = Utils.Clamp(this.pattern.anchor, 0, 1);
                    distanceToNextAnchor += nextLength * nextAnchor;
                }
                if (!isNaN(this.distanceLeft)) {
                    this.distanceLeft = Math.max(0, distanceToNextAnchor - this.distanceLeft);
                }
            }
        }
        else {
            this.getConsumer().lineTo(x, y);
        }
        Vec2Math.set(x, y, this.prevPoint);
    }
    /**
     * Not supported by this path stream. Calling this method will execute a `moveTo()` command to the specified end
     * point.
     * @param cp1x The x-coordinate of the first control point.
     * @param cp1y The y-coordinate of the first control point.
     * @param cp2x The x-coordinate of the second control point.
     * @param cp2y The y-coordinate of the second control point.
     * @param x The x-coordinate of the end point.
     * @param y The y-coordinate of the end point.
     */
    bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
        this.moveTo(x, y);
    }
    /**
     * Not supported by this path stream. Calling this method will execute a `moveTo()` command to the specified end
     * point.
     * @param cpx The x-coordinate of the control point.
     * @param cpy The y-coordinate of the control point.
     * @param x The x-coordinate of the end point.
     * @param y The y-coordinate of the end point.
     */
    quadraticCurveTo(cpx, cpy, x, y) {
        this.moveTo(x, y);
    }
    /** @inheritdoc */
    arc(x, y, radius, startAngle, endAngle, counterClockwise) {
        if (!(isFinite(x) && isFinite(y) && isFinite(radius) && isFinite(startAngle) && isFinite(endAngle))) {
            return;
        }
        if (radius === 0 || startAngle === endAngle) {
            return;
        }
        const startPoint = Vec2Math.add(Vec2Math.set(x, y, PatternPathStream.vec2Cache[0]), Vec2Math.setFromPolar(radius, startAngle, PatternPathStream.vec2Cache[1]), PatternPathStream.vec2Cache[0]);
        if (isNaN(this.prevPoint[0])) {
            this.moveTo(startPoint[0], startPoint[1]);
        }
        else if (!Vec2Math.equals(this.prevPoint, startPoint)) {
            this.lineTo(startPoint[0], startPoint[1]);
        }
        if (this.pattern) {
            const pi2 = 2 * Math.PI;
            const directionSign = counterClockwise ? -1 : 1;
            if (Math.sign(endAngle - startAngle) !== directionSign) {
                // Replicate behavior of canvas context arc() when the sign of the difference between start and end angles
                // doesn't match the counterClockwise flag.
                const angleDiff = ((counterClockwise ? startAngle - endAngle : endAngle - startAngle) % pi2 + pi2) % pi2;
                endAngle = startAngle + angleDiff * directionSign;
            }
            // Clamp to 2pi because we don't need to draw anything past a full circle.
            const angularWidth = (endAngle - startAngle) * directionSign;
            const distance = angularWidth * radius;
            let nextLength = this.pattern.length;
            if (nextLength > 0) {
                let nextAnchor = Utils.Clamp(this.pattern.anchor, 0, 1);
                let distanceToNextAnchor = isNaN(this.distanceLeft) ? nextLength * nextAnchor : this.distanceLeft;
                let angle = startAngle;
                this.distanceLeft = distance;
                while (distanceToNextAnchor <= this.distanceLeft && this.distanceLeft >= 0) {
                    this.clipBounds.set(-nextLength * nextAnchor, Number.MIN_SAFE_INTEGER, nextLength * (1 - nextAnchor), Number.MAX_SAFE_INTEGER);
                    angle += distanceToNextAnchor / radius * directionSign;
                    this.transformStream.resetTransform()
                        .addRotation(Math.PI / 2 * directionSign)
                        .addTranslation(radius, 0)
                        .addRotation(angle)
                        .addTranslation(x, y);
                    this.clipStream.beginPath();
                    this.pattern.draw(this.clipStream);
                    this.distanceLeft -= distanceToNextAnchor;
                    distanceToNextAnchor = nextLength * (1 - nextAnchor);
                    nextLength = this.pattern.length;
                    if (nextLength <= 0) {
                        this.distanceLeft = NaN;
                        break;
                    }
                    nextAnchor = Utils.Clamp(this.pattern.anchor, 0, 1);
                    distanceToNextAnchor += nextLength * nextAnchor;
                }
                if (!isNaN(this.distanceLeft)) {
                    this.distanceLeft = Math.max(0, distanceToNextAnchor - this.distanceLeft);
                }
            }
        }
        else {
            this.getConsumer().arc(x, y, radius, startAngle, endAngle, counterClockwise);
        }
        Vec2Math.add(Vec2Math.set(x, y, PatternPathStream.vec2Cache[0]), Vec2Math.setFromPolar(radius, endAngle, PatternPathStream.vec2Cache[1]), this.prevPoint);
    }
    /** @inheritdoc */
    closePath() {
        if (!isNaN(this.firstPoint[0])) {
            this.lineTo(this.firstPoint[0], this.firstPoint[1]);
        }
    }
    /**
     * Resets the state of this stream.
     */
    reset() {
        Vec2Math.set(NaN, NaN, this.firstPoint);
        Vec2Math.set(NaN, NaN, this.prevPoint);
        this.distanceLeft = NaN;
    }
}
PatternPathStream.vec2Cache = [new Float64Array(2), new Float64Array(2)];
