import { Transform2D, Vec2Math } from '../..';
import { AbstractTransformingPathStream } from './PathStream';
/**
 * A {@link TransformingPathStream} which applies an affine transformation to its input.
 *
 * The types of transformation supported by this class are:
 * * Translation.
 * * Uniform scaling.
 * * Rotation.
 */
export class AffineTransformPathStream extends AbstractTransformingPathStream {
    constructor() {
        super(...arguments);
        this.transform = new Transform2D();
        this.scale = 1;
        this.rotation = 0;
    }
    /**
     * Adds a translation to this stream's transformation.
     * @param x The x translation.
     * @param y The y translation.
     * @param order The order in which to add the translation (defaults to `'after'`):
     * * `'before'` - Applies the translation before this stream's current transformation.
     * * `'after'` - Applies the translation after this stream's current transformation.
     * @returns This stream, after its transformation has been changed.
     */
    addTranslation(x, y, order = 'after') {
        const translation = AffineTransformPathStream.transformCache[0].toTranslation(x, y);
        order === 'before'
            ? Transform2D.concat(this.transform, translation, this.transform)
            : Transform2D.concat(this.transform, this.transform, translation);
        return this;
    }
    /**
     * Adds a uniform scaling to this stream's transformation.
     * @param factor The scaling factor.
     * @param order The order in which to add the translation (defaults to `'after'`):
     * * `'before'` - Applies the scaling before this stream's current transformation.
     * * `'after'` - Applies the scaling after this stream's current transformation.
     * @returns This stream, after its transformation has been changed.
     */
    addScale(factor, order = 'after') {
        const scale = AffineTransformPathStream.transformCache[0].toScale(factor, factor);
        order === 'before'
            ? Transform2D.concat(this.transform, scale, this.transform)
            : Transform2D.concat(this.transform, this.transform, scale);
        this.updateScaleRotation();
        return this;
    }
    /**
     * Adds a rotation to this stream's transformation.
     * @param angle The rotation angle, in radians.
     * @param order The order in which to add the translation (defaults to `'after'`):
     * * `'before'` - Applies the rotation before this stream's current transformation.
     * * `'after'` - Applies the rotation after this stream's current transformation.
     * @returns This stream, after its transformation has been changed.
     */
    addRotation(angle, order = 'after') {
        const rotation = AffineTransformPathStream.transformCache[0].toRotation(angle);
        order === 'before'
            ? Transform2D.concat(this.transform, rotation, this.transform)
            : Transform2D.concat(this.transform, this.transform, rotation);
        this.updateScaleRotation();
        return this;
    }
    /**
     * Resets this stream's transformation to the identity transformation.
     * @returns This stream, after its transformation has been changed.
     */
    resetTransform() {
        this.transform.toIdentity();
        this.updateScaleRotation();
        return this;
    }
    /** @inheritdoc */
    beginPath() {
        this.consumer.beginPath();
    }
    /** @inheritdoc */
    moveTo(x, y) {
        const transformed = this.applyTransform(x, y);
        this.consumer.moveTo(transformed[0], transformed[1]);
    }
    /** @inheritdoc */
    lineTo(x, y) {
        const transformed = this.applyTransform(x, y);
        this.consumer.lineTo(transformed[0], transformed[1]);
    }
    /** @inheritdoc */
    bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y) {
        const cp1Transformed = this.applyTransform(cp1x, cp1y);
        cp1x = cp1Transformed[0];
        cp1y = cp1Transformed[1];
        const cp2Transformed = this.applyTransform(cp2x, cp2y);
        cp2x = cp2Transformed[0];
        cp2y = cp2Transformed[1];
        const endTransformed = this.applyTransform(x, y);
        x = endTransformed[0];
        y = endTransformed[1];
        this.consumer.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
    }
    /** @inheritdoc */
    quadraticCurveTo(cpx, cpy, x, y) {
        const cpTransformed = this.applyTransform(cpx, cpy);
        cpx = cpTransformed[0];
        cpy = cpTransformed[1];
        const endTransformed = this.applyTransform(x, y);
        x = endTransformed[0];
        y = endTransformed[1];
        this.consumer.quadraticCurveTo(cpx, cpy, x, y);
    }
    /** @inheritdoc */
    arc(x, y, radius, startAngle, endAngle, counterClockwise) {
        const transformed = this.applyTransform(x, y);
        this.consumer.arc(transformed[0], transformed[1], radius * this.scale, startAngle + this.rotation, endAngle + this.rotation, counterClockwise);
    }
    /** @inheritdoc */
    closePath() {
        this.consumer.closePath();
    }
    /**
     * Updates this stream's cached scale and rotation values from its transformation.
     */
    updateScaleRotation() {
        const params = this.transform.getParameters();
        this.scale = Math.sqrt(params[0] * params[0] + params[3] * params[3]);
        this.rotation = Math.atan2(params[0], params[3]);
    }
    /**
     * Applies this stream's transformation to a point.
     * @param x The x-coordinate of the point to transform.
     * @param y The y-coordinate of the point to transform.
     * @returns The transformed point.
     */
    applyTransform(x, y) {
        const vec = Vec2Math.set(x, y, AffineTransformPathStream.vec2Cache[0]);
        return this.transform.apply(vec, vec);
    }
}
AffineTransformPathStream.vec2Cache = [new Float64Array(2)];
AffineTransformPathStream.transformCache = [new Transform2D()];
