import { AbstractSubscribable } from './AbstractSubscribable';
import { MutableSubscribable } from './Subscribable';
/** Extracts the type argument from a Subject. */
export declare type ExtractSubjectType<P> = P extends Subject<infer T> ? T : never;
/** Generates an indexed type with all the Subjects extracted. */
export declare type ExtractSubjectTypes<P extends {
    [key: string]: Subject<any>;
}> = {
    [Key in keyof P]: ExtractSubjectType<P[Key]>;
};
/**
 * A subscribable subject whose value can be freely manipulated.
 */
export declare class Subject<T> extends AbstractSubscribable<T> implements MutableSubscribable<T> {
    protected value: T;
    protected readonly equalityFunc: (a: T, b: T) => boolean;
    protected readonly mutateFunc?: ((oldVal: T, newVal: T) => void) | undefined;
    readonly isMutableSubscribable = true;
    /**
     * Constructs an observable Subject.
     * @param value The initial value.
     * @param equalityFunc The function to use to check for equality.
     * @param mutateFunc The function to use to mutate the subject's value.
     */
    protected constructor(value: T, equalityFunc: (a: T, b: T) => boolean, mutateFunc?: ((oldVal: T, newVal: T) => void) | undefined);
    /**
     * Creates and returns a new Subject.
     * @param v The initial value of the subject.
     * @param equalityFunc The function to use to check for equality between subject values. Defaults to the strict
     * equality comparison (`===`).
     * @param mutateFunc The function to use to change the subject's value. If not defined, new values will replace
     * old values by variable assignment.
     * @returns A Subject instance.
     */
    static create<IT>(v: IT, equalityFunc?: (a: IT, b: IT) => boolean, mutateFunc?: (oldVal: IT, newVal: IT) => void): Subject<IT>;
    /** @inheritdoc */
    protected notifySub(sub: (v: T) => void): void;
    /**
     * Sets the value of this subject and notifies subscribers if the value changed.
     * @param value The new value.
     */
    set(value: T): void;
    /**
     * Applies a partial set of properties to this subject's value and notifies subscribers if the value changed as a
     * result.
     * @param value The properties to apply.
     */
    apply(value: Partial<T>): void;
    /** @inheritdoc */
    notify(): void;
    /**
     * Gets the value of this subject.
     * @returns The value of this subject.
     */
    get(): T;
}
//# sourceMappingURL=Subject.d.ts.map