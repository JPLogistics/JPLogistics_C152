import { Subject } from '../Subject';
/**
 * A Subject which provides a NumberUnitInterface value.
 */
export class NumberUnitSubject extends Subject {
    // eslint-disable-next-line jsdoc/require-jsdoc
    set(arg1, arg2) {
        const isArg1Number = typeof arg1 === 'number';
        const equals = isArg1Number ? this.value.equals(arg1, arg2) : this.value.equals(arg1);
        if (!equals) {
            isArg1Number ? this.value.set(arg1, arg2) : this.value.set(arg1);
            this.notify();
        }
    }
    /**
     * Creates a NumberUnitSubject.
     * @param initialVal The initial value.
     * @returns a NumberUnitSubject.
     */
    static createFromNumberUnit(initialVal) {
        return new NumberUnitSubject(initialVal, Subject.DEFAULT_EQUALITY_FUNC);
    }
}
