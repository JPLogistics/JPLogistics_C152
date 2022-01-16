import { Subject } from '../Subject';
/**
 * A Subject which allows a 2D vector to be observed.
 */
export declare class Vec2Subject extends Subject<Float64Array> {
    /**
     * Sets the new value and notifies the subscribers if the value changed.
     * @param value The new value.
     */
    set(value: Float64Array): void;
    /**
     * Sets the new value and notifies the subscribers if the value changed.
     * @param x The x component of the new value.
     * @param y The y component of the new value.
     */
    set(x: number, y: number): void;
    /**
     * Creates a Vec2Subject.
     * @param initialVal The initial value.
     * @returns A Vec2Subject.
     */
    static createFromVector(initialVal: Float64Array): Vec2Subject;
}
/**
 * A Subject which allows a 3D vector to be observed.
 */
export declare class Vec3Subject extends Subject<Float64Array> {
    /**
     * Sets the new value and notifies the subscribers if the value changed.
     * @param value The new value.
     */
    set(value: Float64Array): void;
    /**
     * Sets the new value and notifies the subscribers if the value changed.
     * @param x The x component of the new value.
     * @param y The y component of the new value.
     */
    set(x: number, y: number, z: number): void;
    /**
     * Creates a Vec3Subject.
     * @param initialVal The initial value.
     * @returns A Vec3Subject.
     */
    static createFromVector(initialVal: Float64Array): Vec3Subject;
}
/**
 * A Subject which allows a N-D vector to be observed.
 */
export declare class VecNSubject extends Subject<Float64Array> {
    /**
     * Sets the new value and notifies the subscribers if the value changed.
     * @param value The new value.
     */
    set(value: Float64Array): void;
    /**
     * Sets the new value and notifies the subscribers if the value changed.
     * @param args The individual components of the new value.
     */
    set(...args: number[]): void;
    /**
     * Creates a VecNSubject.
     * @param initialVal The initial value.
     * @returns A VecNSubject.
     */
    static createFromVector(initialVal: Float64Array): VecNSubject;
}
//# sourceMappingURL=VectorSubject.d.ts.map