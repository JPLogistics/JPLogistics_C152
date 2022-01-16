import { AbstractUnit, NumberUnit, NumberUnitInterface, Unit } from '../math';
import { Subject } from '../Subject';
import { LatLonInterface } from './GeoInterfaces';
import { GeoPoint } from './GeoPoint';
/**
 * The possible reference norths for navigation angle units.
 */
export declare enum NavAngleUnitReferenceNorth {
    True = "true",
    Magnetic = "magnetic"
}
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
export declare class NavAngleUnit extends AbstractUnit<typeof NavAngleUnit.FAMILY> {
    static readonly FAMILY = "navangle";
    /** @inheritdoc */
    readonly family = "navangle";
    /** This location used to retrieve magnetic variation for conversions related to this unit. */
    readonly location: GeoPoint;
    constructor(type: NavAngleUnitReferenceNorth, location: LatLonInterface);
    constructor(type: NavAngleUnitReferenceNorth, lat: number, lon: number);
    /**
     * Checks whether this nav angle unit is relative to magnetic north.
     * @returns Whether this nav angle unit is relative to magnetic north.
     */
    isMagnetic(): boolean;
    /**
     * Converts a value of this unit to another unit. This unit's location is used for the conversion.
     * @param value The value to convert.
     * @param toUnit The unit to which to convert.
     * @returns The converted value.
     * @throws Error if attempting an invalid conversion.
     */
    convertTo(value: number, toUnit: Unit<typeof NavAngleUnit.FAMILY>): number;
    /**
     * Converts a value of another unit to this unit. This unit's location is used for the conversion.
     * @param value The value to convert.
     * @param fromUnit The unit from which to convert.
     * @returns The converted value.
     * @throws Error if attempting an invalid conversion.
     */
    convertFrom(value: number, fromUnit: Unit<typeof NavAngleUnit.FAMILY>): number;
    /** @inheritdoc */
    equals(other: Unit<string>): boolean;
    /**
     * Creates an instance of NavAngleUnit. The location of the unit is initialized to {0 N, 0 E}.
     * @param isMagnetic Whether the new unit is relative to magnetic north.
     * @returns An instance of NavAngleUnit.
     */
    static create(isMagnetic: boolean): NavAngleUnit;
}
/**
 * A Subject which provides a navigation angle value.
 */
export declare class NavAngleSubject extends Subject<NumberUnitInterface<typeof NavAngleUnit.FAMILY, NavAngleUnit>> {
    /**
     * Sets the new value and notifies the subscribers if the value changed.
     * @param value The new value.
     */
    set(value: NumberUnitInterface<typeof NavAngleUnit.FAMILY, NavAngleUnit>): void;
    /**
     * Sets the new value and notifies the subscribers if the value changed.
     * @param value The numeric part of the new value.
     * @param unit The unit type of the new value. Defaults to the unit type of the NumberUnit used to create this
     * subject.
     */
    set(value: number, unit?: NavAngleUnit): void;
    /**
     * Sets the new value and notifies the subscribers if the value changed.
     * @param value The numeric part of the new value.
     * @param lat The latitude of the new value's location.
     * @param lon The longitude of the new value's location.
     */
    set(value: number, lat: number, lon: number): void;
    /**
     * Creates a NavAngleSubject.
     * @param initialVal The initial value.
     * @returns a NavAngleSubject.
     */
    static createFromNavAngle(initialVal: NumberUnit<typeof NavAngleUnit.FAMILY, NavAngleUnit>): NavAngleSubject;
}
//# sourceMappingURL=NavAngle.d.ts.map