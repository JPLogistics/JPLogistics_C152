import { Subject } from '../Subject';
import { Vec2Math, Vec3Math } from './VecMath';
/**
 * A Subject which allows a 2D vector to be observed.
 */
export class Vec2Subject extends Subject {
    // eslint-disable-next-line jsdoc/require-jsdoc
    set(arg1, arg2) {
        let x, y;
        if (typeof arg1 === 'number') {
            x = arg1;
            y = arg2;
        }
        else {
            x = arg1[0];
            y = arg1[1];
        }
        const equals = x === this.value[0] && y === this.value[1];
        if (!equals) {
            Vec2Math.set(x, y, this.value);
            this.notify();
        }
    }
    /**
     * Creates a Vec2Subject.
     * @param initialVal The initial value.
     * @returns A Vec2Subject.
     */
    static createFromVector(initialVal) {
        return new Vec2Subject(initialVal, Subject.DEFAULT_EQUALITY_FUNC);
    }
}
/**
 * A Subject which allows a 3D vector to be observed.
 */
export class Vec3Subject extends Subject {
    // eslint-disable-next-line jsdoc/require-jsdoc
    set(arg1, arg2, arg3) {
        let x, y, z;
        if (typeof arg1 === 'number') {
            x = arg1;
            y = arg2;
            z = arg3;
        }
        else {
            x = arg1[0];
            y = arg1[1];
            z = arg1[2];
        }
        const equals = x === this.value[0] && y === this.value[1] && z === this.value[2];
        if (!equals) {
            Vec3Math.set(x, y, z, this.value);
            this.notify();
        }
    }
    /**
     * Creates a Vec3Subject.
     * @param initialVal The initial value.
     * @returns A Vec3Subject.
     */
    static createFromVector(initialVal) {
        return new Vec3Subject(initialVal, Subject.DEFAULT_EQUALITY_FUNC);
    }
}
/**
 * A Subject which allows a N-D vector to be observed.
 */
export class VecNSubject extends Subject {
    // eslint-disable-next-line jsdoc/require-jsdoc
    set(arg1, ...args) {
        let array;
        if (typeof arg1 === 'number') {
            array = args;
            args.unshift(arg1);
        }
        else {
            array = arg1;
        }
        if (array.length > this.value.length) {
            throw new RangeError(`VecNSubject: Cannot set ${array.length} components on a vector of length ${this.value.length}`);
        }
        let equals = true;
        const len = array.length;
        for (let i = 0; i < len; i++) {
            if (array[i] !== this.value[i]) {
                equals = false;
                break;
            }
        }
        if (!equals) {
            this.value.set(array);
            this.notify();
        }
    }
    /**
     * Creates a VecNSubject.
     * @param initialVal The initial value.
     * @returns A VecNSubject.
     */
    static createFromVector(initialVal) {
        return new VecNSubject(initialVal, Subject.DEFAULT_EQUALITY_FUNC);
    }
}
