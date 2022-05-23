import { AbstractUnit } from '../math';
import { Subject } from '../sub/Subject';
import { GeoPoint } from './GeoPoint';
import { MagVar } from './MagVar';
/**
 * The possible reference norths for navigation angle units.
 */
export var NavAngleUnitReferenceNorth;
(function (NavAngleUnitReferenceNorth) {
    NavAngleUnitReferenceNorth["True"] = "true";
    NavAngleUnitReferenceNorth["Magnetic"] = "magnetic";
})(NavAngleUnitReferenceNorth || (NavAngleUnitReferenceNorth = {}));
/**
 * A navigation angle unit, which is a measure of angular degrees relative to either true or magnetic north.
 *
 * Unlike most other unit types, each instance of navigation angle unit contains state specific to that instance,
 * namely the location used to retrieve magnetic variation for conversions. Therefore, it is generally recommended
 * not to re-use the same NavAngleUnit instance to instantiate multiple NumberUnits.
 *
 * Conversions use the location of the NavAngleUnit instance whose conversion method is called; this also means that
 * when using `NumberUnit.asUnit()`, the location of the unit of the NumberUnit whose `asUnit()` method was called
 * will be used.
 */
export class NavAngleUnit extends AbstractUnit {
    // eslint-disable-next-line jsdoc/require-jsdoc
    constructor(type, arg1, arg2) {
        super(type === NavAngleUnitReferenceNorth.True ? 'true bearing' : 'magnetic bearing');
        /** @inheritdoc */
        this.family = NavAngleUnit.FAMILY;
        /** This location used to retrieve magnetic variation for conversions related to this unit. */
        this.location = new GeoPoint(0, 0);
        typeof arg1 === 'number' ? this.location.set(arg1, arg2) : this.location.set(arg1);
    }
    /**
     * Checks whether this nav angle unit is relative to magnetic north.
     * @returns Whether this nav angle unit is relative to magnetic north.
     */
    isMagnetic() {
        return this.name === 'magnetic bearing';
    }
    /**
     * Converts a value of this unit to another unit. This unit's location is used for the conversion.
     * @param value The value to convert.
     * @param toUnit The unit to which to convert.
     * @returns The converted value.
     * @throws Error if attempting an invalid conversion.
     */
    convertTo(value, toUnit) {
        if (!this.canConvert(toUnit)) {
            throw new Error(`Invalid conversion from ${this.name} to ${toUnit.name}.`);
        }
        if (!isFinite(value)) {
            return NaN;
        }
        if (toUnit.name === this.name) {
            return value;
        }
        return this.isMagnetic() ? MagVar.magneticToTrue(value, this.location) : MagVar.trueToMagnetic(value, this.location);
    }
    /**
     * Converts a value of another unit to this unit. This unit's location is used for the conversion.
     * @param value The value to convert.
     * @param fromUnit The unit from which to convert.
     * @returns The converted value.
     * @throws Error if attempting an invalid conversion.
     */
    convertFrom(value, fromUnit) {
        if (!this.canConvert(fromUnit)) {
            throw new Error(`Invalid conversion from ${fromUnit.name} to ${this.name}.`);
        }
        if (!isFinite(value)) {
            return NaN;
        }
        if (fromUnit.name === this.name) {
            return value;
        }
        return this.isMagnetic() ? MagVar.trueToMagnetic(value, this.location) : MagVar.magneticToTrue(value, this.location);
    }
    /** @inheritdoc */
    equals(other) {
        return other instanceof NavAngleUnit && this.name === other.name && this.location.equals(other.location);
    }
    /**
     * Creates an instance of NavAngleUnit. The location of the unit is initialized to {0 N, 0 E}.
     * @param isMagnetic Whether the new unit is relative to magnetic north.
     * @returns An instance of NavAngleUnit.
     */
    static create(isMagnetic) {
        return new NavAngleUnit(isMagnetic ? NavAngleUnitReferenceNorth.Magnetic : NavAngleUnitReferenceNorth.True, 0, 0);
    }
}
NavAngleUnit.FAMILY = 'navangle';
/**
 * A Subject which provides a navigation angle value.
 */
export class NavAngleSubject extends Subject {
    // eslint-disable-next-line jsdoc/require-jsdoc
    set(arg1, arg2, arg3) {
        const isArg1Number = typeof arg1 === 'number';
        const isArg2Number = typeof arg2 === 'number';
        const unit = isArg1Number
            ? isArg2Number || arg2 === undefined ? this.value.unit : arg2
            : arg1.unit;
        isArg2Number ? this.value.unit.location.set(arg2, arg3) : this.value.unit.location.set(unit.location);
        const equals = (isArg1Number ? this.value.equals(arg1, unit) : this.value.equals(arg1));
        if (!equals) {
            isArg1Number
                ? this.value.set(arg1, unit)
                : this.value.set(arg1);
            this.notify();
        }
    }
    /**
     * Creates a NavAngleSubject.
     * @param initialVal The initial value.
     * @returns a NavAngleSubject.
     */
    static createFromNavAngle(initialVal) {
        return new NavAngleSubject(initialVal, Subject.DEFAULT_EQUALITY_FUNC);
    }
}
