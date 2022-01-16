import { Vec2Math } from './VecMath';
/**
 * A 2D affine transformation. By default, Transform2D objects are initially created as identity transformations.
 */
export class Transform2D {
    constructor() {
        this.array = new Float64Array([1, 0, 0, 0, 1, 0]);
    }
    /**
     * Gets the parameters of this transformation as a 6-tuple: `[scaleX, skewX, translateX, skewY, scaleY, translateY]`.
     * @returns The parameters of this transformation.
     */
    getParameters() {
        return this.array;
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    set(arg1, skewX, translateX, skewY, scaleY, translateY) {
        let scaleX = arg1;
        if (arg1 instanceof Transform2D) {
            [scaleX, skewX, translateX, skewY, scaleY, translateY] = arg1.array;
        }
        const array = this.array;
        array[0] = scaleX;
        array[1] = skewX;
        array[2] = translateX;
        array[3] = skewY;
        array[4] = scaleY;
        array[5] = translateY;
        return this;
    }
    /**
     * Sets the x scaling factor of this transformation.
     * @param value The new x scaling factor.
     * @returns This transformation, after it has been changed.
     */
    setScaleX(value) {
        this.array[0] = value;
        return this;
    }
    /**
     * Sets the y scaling factor of this transformation.
     * @param value The new y scaling factor.
     * @returns This transformation, after it has been changed.
     */
    setScaleY(value) {
        this.array[4] = value;
        return this;
    }
    /**
     * Sets the x and y scaling factors of this transformation.
     * @param x The new x scaling factor.
     * @param y The new y scaling factor.
     * @returns This transformation, after it has been changed.
     */
    setScale(x, y) {
        this.array[0] = x;
        this.array[4] = y;
        return this;
    }
    /**
     * Sets the x skew factor of this transformation.
     * @param value The new x skew factor.
     * @returns This transformation, after it has been changed.
     */
    setSkewX(value) {
        this.array[1] = value;
        return this;
    }
    /**
     * Sets the y skew factor of this transformation.
     * @param value The new y skew factor.
     * @returns This transformation, after it has been changed.
     */
    setSkewY(value) {
        this.array[3] = value;
        return this;
    }
    /**
     * Sets the x translation of this transformation.
     * @param value The new x translation.
     * @returns This transformation, after it has been changed.
     */
    setTranslateX(value) {
        this.array[2] = value;
        return this;
    }
    /**
     * Sets the y translation of this transformation.
     * @param value The new y translation.
     * @returns This transformation, after it has been changed.
     */
    setTranslateY(value) {
        this.array[5] = value;
        return this;
    }
    /**
     * Sets the x and y translations of this transformation.
     * @param x The new x translation.
     * @param y The new y translation.
     * @returns This transformation, after it has been changed.
     */
    setTranslate(x, y) {
        this.array[2] = x;
        this.array[5] = y;
        return this;
    }
    /**
     * Inverts this transformation.
     * @returns This transformation, after it has been inverted.
     */
    invert() {
        const array = this.array;
        const e_00 = array[0];
        const e_01 = array[1];
        const e_02 = array[2];
        const e_10 = array[3];
        const e_11 = array[4];
        const e_12 = array[5];
        const i_00 = e_11;
        const i_01 = -e_10;
        const i_10 = -e_01;
        const i_11 = e_00;
        const i_20 = e_01 * e_12 - e_02 * e_11;
        const i_21 = -(e_00 * e_12 - e_02 * e_10);
        const det = e_00 * i_00 + e_01 * i_01;
        return this.set(i_00 / det, i_10 / det, i_20 / det, i_01 / det, i_11 / det, i_21 / det);
    }
    /**
     * Copies this transformation.
     * @returns A copy of this transformation.
     */
    copy() {
        return new Transform2D().set(this);
    }
    /**
     * Applies this transformation to a 2D vector.
     * @param vec A 2D vector.
     * @param out The vector to which to write the result.
     * @returns The result of applying this transformation to `vec`.
     */
    apply(vec, out) {
        const array = this.array;
        const x = vec[0] * array[0] + vec[1] * array[1] + array[2];
        const y = vec[0] * array[3] + vec[1] * array[4] + array[5];
        return Vec2Math.set(x, y, out);
    }
    /**
     * Changes this transformation to the one that is the result of offsetting this transformation's origin.
     * @param x The x-coordinate of the offset origin.
     * @param y The y-coordinate of the offset origin.
     * @returns This transformation, after it has been changed.
     */
    offsetOrigin(x, y) {
        return Transform2D.concat(this, Transform2D.transformCache[2].toTranslation(-x, -y), this, Transform2D.transformCache[3].toTranslation(x, y));
    }
    /**
     * Sets this transformation to the identity transformation.
     * @returns This transformation, after it has been changed.
     */
    toIdentity() {
        return this.set(1, 0, 0, 0, 1, 0);
    }
    /**
     * Sets this transformation to a translation.
     * @param x The x translation.
     * @param y The y translation.
     * @returns This transformation, after it has been changed.
     */
    toTranslation(x, y) {
        return this.set(1, 0, x, 0, 1, y);
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    toScale(x, y, originX, originY) {
        this.set(x, 0, 0, 0, y, 0);
        if (originX && originY) {
            this.offsetOrigin(originX, originY);
        }
        return this;
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    toRotation(theta, originX, originY) {
        const sin = Math.sin(theta);
        const cos = Math.cos(theta);
        this.set(cos, -sin, 0, sin, cos, 0);
        if (originX && originY) {
            this.offsetOrigin(originX, originY);
        }
        return this;
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    reflection(theta, originX, originY) {
        const sin = Math.sin(2 * theta);
        const cos = Math.cos(2 * theta);
        this.set(cos, sin, 0, sin, -cos, 0);
        if (originX && originY) {
            this.offsetOrigin(originX, originY);
        }
        return this;
    }
    /**
     * Concatenates one or more transformations in order and returns the result.
     * @param out The transformation to which to write the result.
     * @param transforms The transformations to concatenate.
     * @returns The result of concatenating all transformations in `transforms`.
     */
    static concat(out, ...transforms) {
        if (transforms.length === 0) {
            return out.toIdentity();
        }
        if (transforms.length === 1) {
            return out.set(transforms[0]);
        }
        let index = 0;
        let next = transforms[index];
        const oldTransform = Transform2D.transformCache[0];
        const newTransform = Transform2D.transformCache[1].set(next);
        const oldArray = oldTransform.array;
        const newArray = newTransform.array;
        const end = transforms.length;
        while (++index < end) {
            next = transforms[index];
            const nextArray = next.array;
            oldTransform.set(newTransform);
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 2; j++) {
                    newArray[j * 3 + i] = oldArray[i] * nextArray[j * 3] + oldArray[3 + i] * nextArray[j * 3 + 1] + (i === 2 ? 1 : 0) * nextArray[j * 3 + 2];
                }
            }
        }
        return out.set(newTransform);
    }
}
Transform2D.transformCache = [new Transform2D(), new Transform2D(), new Transform2D(), new Transform2D()];
