import { Subject } from '../sub/Subject';
import { NumberUnit, NumberUnitInterface, Unit } from './NumberUnit';
/**
 * A Subject which provides a NumberUnitInterface value.
 */
export declare class NumberUnitSubject<F extends string, U extends Unit<F> = Unit<F>> extends Subject<NumberUnitInterface<F, U>> {
    /**
     * Sets the new value and notifies the subscribers if the value changed.
     * @param value The new value.
     */
    set(value: NumberUnitInterface<F>): void;
    /**
     * Sets the new value and notifies the subscribers if the value changed.
     * @param value The numeric part of the new value.
     * @param unit The unit type of the new value. Defaults to the unit type of the NumberUnit used to create this
     * subject.
     */
    set(value: number, unit?: Unit<F>): void;
    /**
     * Creates a NumberUnitSubject.
     * @param initialVal The initial value.
     * @returns a NumberUnitSubject.
     */
    static createFromNumberUnit<F extends string, U extends Unit<F>>(initialVal: NumberUnit<F, U>): NumberUnitSubject<F, U>;
}
//# sourceMappingURL=NumberUnitSubject.d.ts.map