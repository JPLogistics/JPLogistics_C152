/**
 * Utility type to get the family of a unit type.
 */
export declare type FamilyOfUnit<U extends Unit<string>> = U extends Unit<infer T> ? T : never;
/**
 * Utility type to get the Unit type from a NumberUnit type.
 */
export declare type UnitOfNumber<N extends NumberUnitInterface<string>> = N extends NumberUnitInterface<string, infer U> ? U : never;
/**
 * A numeric value with unit type.
 */
export interface NumberUnitInterface<F extends string, U extends Unit<F> = Unit<F>> {
    /** This NumberUnit's numeric value. */
    number: number;
    /** This NumberUnit's unit type. */
    unit: U;
    /**
     * Adds a value to this NumberUnit and returns the result.
     * @param value The other value.
     * @param out The NumberUnit to which to write the result.
     * @returns The sum.
     * @throws Error if the supplied value cannot be converted to this NumberUnit's unit type.
     */
    add<OU extends Unit<F>>(value: NumberUnitInterface<F>, out: NumberUnit<F, OU>): NumberUnit<F, OU>;
    /**
     * Adds a value to this NumberUnit and returns the result.
     * @param value The other value.
     * @param unit The unit type of the other value.
     * @param out The NumberUnit to which to write the result.
     * @returns The sum.
     * @throws Error if the supplied value cannot be converted to this NumberUnit's unit type.
     */
    add<OU extends Unit<F>>(value: number, unit: Unit<F>, out: NumberUnit<F, OU>): NumberUnit<F, OU>;
    /**
     * Subtracts a value from this NumberUnit and returns the result.
     * @param value The other value.
     * @param out The NumberUnit to which to write the result.
     * @returns The difference.
     * @throws Error if the supplied value cannot be converted to this NumberUnit's unit type.
     */
    subtract<OU extends Unit<F>>(value: NumberUnitInterface<F>, out: NumberUnit<F, OU>): NumberUnit<F, OU>;
    /**
     * Subtracts a value from this NumberUnit and returns the result.
     * @param value The other value.
     * @param unit The unit type of the other value.
     * @param out The NumberUnit to which to write the result.
     * @returns The difference.
     * @throws Error if the supplied value cannot be converted to this NumberUnit's unit type.
     */
    subtract<OU extends Unit<F>>(value: number, unit: Unit<F>, out: NumberUnit<F, OU>): NumberUnit<F, OU>;
    /**
     * Scales this NumberUnit by a unit-less factor and returns the result.
     * @param factor The factor by which to scale.
     * @param out The NumberUnit to which to write the result.
     * @returns The scaled value.
     */
    scale<OU extends Unit<F>>(factor: number, out: NumberUnit<F, OU>): NumberUnit<F, OU>;
    /**
     * Finds the ratio of this NumberUnit to another value.
     * @param value The other value.
     * @returns The ratio.
     * @throws Error if the other value cannot be converted to this NumberUnit's unit type.
     */
    ratio(value: NumberUnitInterface<F>): number;
    /**
     * Finds the ratio of this NumberUnit to another value.
     * @param value The other value.
     * @param unit The unit type of the other value.
     * @returns the ratio.
     * @throws Error if the other value cannot be converted to this NumberUnit's unit type.
     */
    ratio(value: number, unit: Unit<F>): number;
    /**
     * Calculates the absolute value of this NumberUnit and returns the result.
     * @param out The NumberUnit to which to write the result.
     * @returns The absolute value.
     */
    abs<OU extends Unit<F>>(out: NumberUnit<F, OU>): NumberUnit<F, OU>;
    /**
     * Returns the numeric value of this NumberUnit after conversion to a specified unit.
     * @param unit The unit to which to convert.
     * @returns The converted numeric value.
     * @throws Error if this NumberUnit's unit type cannot be converted to the specified unit.
     */
    asUnit(unit: Unit<F>): number;
    /**
     * Checks whether this NumberUnit is greater than, equal to, or less than another value.
     * @param value The other value.
     * @returns 0 if this NumberUnit is equal to the other value, -1 if this number is less, 1 if this number is greater.
     * @throws Error if this NumberUnit cannot be compared to the other value.
     */
    compare(value: NumberUnitInterface<F>): number;
    /**
     * Checks whether this NumberUnit is greater than, equal to, or less than another value.
     * @param value The other value.
     * @param unit The unit type of the other value. Defaults to this NumberUnit's unit type.
     * @returns 0 if this NumberUnit is equal to the other value, -1 if this number is less, 1 if this number is greater.
     * @throws Error if this NumberUnit cannot be compared to the other value.
     */
    compare(value: number, unit?: Unit<F>): number;
    /**
     * Checks whether this NumberUnit is equal to another value.
     * @param value The other value.
     * @returns Whether this NumberUnit is equal to the other value.
     */
    equals(value: NumberUnitInterface<string>): boolean;
    /**
     * Checks whether this NumberUnit is equal to another value.
     * @param value The other value.
     * @param unit The unit type of the other value. Defaults to this NumberUnit's unit type.
     * @returns Whether this NumberUnit is equal to the other value.
     */
    equals(value: number, unit?: Unit<string>): boolean;
    /**
     * Checks whether this NumberUnit has a numeric value of NaN.
     * @returns Whether this NumberUnit has a numeric value of NaN.
     */
    isNaN(): boolean;
    /**
     * Copies this NumberUnit.
     * @returns A copy of this NumberUnit.
     */
    copy(): NumberUnit<F, U>;
}
/**
 * A number with an associated unit. Each NumberUnit is created with a reference unit type,
 * which cannot be changed after instantiation. The reference unit type determines how the
 * value of the NumberUnit is internally represented. Each NumberUnit also maintains an
 * active unit type, which can be dynamically changed at any time.
 */
export declare class NumberUnit<F extends string, U extends Unit<F> = Unit<F>> implements NumberUnitInterface<F, U> {
    private _number;
    private _unit;
    readonly readonly: NumberUnitReadOnly<F, U>;
    /**
     * Constructor.
     * @param number - the initial numeric value of the new NumberUnit.
     * @param unit - the unit type of the new NumberUnit.
     */
    constructor(number: number, unit: U);
    /**
     * Gets this NumberUnit's numeric value.
     * @returns This NumberUnit's numeric value.
     */
    get number(): number;
    /**
     * Gets this NumberUnit's unit type.
     * @returns This NumberUnit's unit type.
     */
    get unit(): U;
    /**
     * Converts a value to a numeric value with this NumberUnit's unit type.
     * @param value - the value.
     * @param unit - the unit type of the new value. Defaults to this NumberUnit's unit type. This argument is ignored if
     * value is a NumberUnit.
     * @returns the numeric of the value with this NumberUnit's unit type.
     */
    private toNumberOfThisUnit;
    /**
     * Sets this NumberUnit's numeric value. This method will not change this NumberUnit's unit type. If the supplied
     * value cannot be converted to this NumberUnit's unit type, this NumberUnit will not be changed and this method will
     * return undefined.
     * @param value - the new value.
     * @returns this NumberUnit, after it has been changed, or undefined if the operation could not be carried out.
     */
    set(value: NumberUnitInterface<F>): this;
    /**
     * Sets this NumberUnit's numeric value. This method will not change this NumberUnit's unit type.
     * @param value - the new value.
     * @param unit - the unit type of the new value. Defaults to this NumberUnit's unit type.
     * @returns this NumberUnit, after it has been changed.
     * @throws Error if the supplied value cannot be converted to this NumberUnit's unit type.
     */
    set(value: number, unit?: Unit<F>): this;
    /**
     * Adds a value to this NumberUnit and returns the result.
     * @param value The other value.
     * @param out The NumberUnit to which to write the result.
     * @returns The sum.
     * @throws Error if the supplied value cannot be converted to this NumberUnit's unit type.
     */
    add<OU extends Unit<F>>(value: NumberUnitInterface<F>, out: NumberUnit<F, OU>): NumberUnit<F, OU>;
    /**
     * Adds a value to this NumberUnit in place and returns the result.
     * @param value The other value.
     * @returns The sum.
     * @throws Error if the supplied value cannot be converted to this NumberUnit's unit type.
     */
    add(value: NumberUnitInterface<F>): this;
    /**
     * Adds a value to this NumberUnit and returns the result.
     * @param value The other value.
     * @param unit The unit type of the other value.
     * @param out The NumberUnit to which to write the result.
     * @returns The sum.
     * @throws Error if the supplied value cannot be converted to this NumberUnit's unit type.
     */
    add<OU extends Unit<F>>(value: number, unit: Unit<F>, out: NumberUnit<F, OU>): NumberUnit<F, OU>;
    /**
     * Adds a value to this NumberUnit in place and returns the result.
     * @param value The other value.
     * @param unit The unit type of the other value.
     * @returns The sum.
     * @throws Error if the supplied value cannot be converted to this NumberUnit's unit type.
     */
    add(value: number, unit: Unit<F>): this;
    /**
     * Subtracts a value from this NumberUnit and returns the result.
     * @param value The other value.
     * @param out The NumberUnit to which to write the result.
     * @returns The difference.
     * @throws Error if the supplied value cannot be converted to this NumberUnit's unit type.
     */
    subtract<OU extends Unit<F>>(value: NumberUnitInterface<F>, out: NumberUnit<F, OU>): NumberUnit<F, OU>;
    /**
     * Subtracts a value from this NumberUnit in place and returns the result.
     * @param value The other value.
     * @param out The NumberUnit to which to write the result. Defaults to this NumberUnit.
     * @returns The difference.
     * @throws Error if the supplied value cannot be converted to this NumberUnit's unit type.
     */
    subtract(value: NumberUnitInterface<F>): this;
    /**
     * Subtracts a value from this NumberUnit and returns the result.
     * @param value The other value.
     * @param unit The unit type of the other value.
     * @param out The NumberUnit to which to write the result.
     * @returns The difference.
     * @throws Error if the supplied value cannot be converted to this NumberUnit's unit type.
     */
    subtract<OU extends Unit<F>>(value: number, unit: Unit<F>, out: NumberUnit<F, OU>): NumberUnit<F, OU>;
    /**
     * Subtracts a value from this NumberUnit in place and returns the result.
     * @param value The other value.
     * @param unit The unit type of the other value.
     * @returns The difference.
     * @throws Error if the supplied value cannot be converted to this NumberUnit's unit type.
     */
    subtract(value: number, unit: Unit<F>): this;
    /**
     * Scales this NumberUnit by a unit-less factor and returns the result.
     * @param factor The factor by which to scale.
     * @param out The NumberUnit to which to write the result.
     * @returns The scaled value.
     */
    scale<OU extends Unit<F>>(factor: number, out: NumberUnit<F, OU>): NumberUnit<F, OU>;
    /**
     * Scales this NumberUnit by a unit-less factor in place and returns the result.
     * @param factor The factor by which to scale.
     * @param out The NumberUnit to which to write the result.
     * @returns The scaled value.
     */
    scale(factor: number): this;
    /**
     * Finds the ratio of this NumberUnit to another value.
     * @param value The other value.
     * @returns The ratio.
     * @throws Error if the other value cannot be converted to this NumberUnit's unit type.
     */
    ratio(value: NumberUnitInterface<F>): number;
    /**
     * Finds the ratio of this NumberUnit to another value.
     * @param value The other value.
     * @param unit The unit type of the other value.
     * @returns the ratio.
     * @throws Error if the other value cannot be converted to this NumberUnit's unit type.
     */
    ratio(value: number, unit: Unit<F>): number;
    /**
     * Calculates the absolute value of this NumberUnit and returns the result.
     * @param out The NumberUnit to which to write the result.
     * @returns The absolute value.
     */
    abs<OU extends Unit<F>>(out: NumberUnit<F, OU>): NumberUnit<F, OU>;
    /**
     * Calculates the absolute value of this NumberUnit in place and returns the result.
     * @returns The absolute value.
     */
    abs(): this;
    /**
     * Returns the numeric value of this NumberUnit after conversion to a specified unit.
     * @param unit The unit to which to convert.
     * @returns The converted numeric value.
     * @throws Error if this NumberUnit's unit type cannot be converted to the specified unit.
     */
    asUnit(unit: Unit<F>): number;
    /**
     * Checks whether this NumberUnit is greater than, equal to, or less than another value.
     * @param value The other value.
     * @returns 0 if this NumberUnit is equal to the other value, -1 if this number is less, 1 if this number is greater.
     * @throws Error if this NumberUnit cannot be compared to the other value.
     */
    compare(value: NumberUnitInterface<F>): number;
    /**
     * Checks whether this NumberUnit is greater than, equal to, or less than another value.
     * @param value The other value.
     * @param unit The unit type of the other value. Defaults to this NumberUnit's unit type.
     * @returns 0 if this NumberUnit is equal to the other value, -1 if this number is less, 1 if this number is greater.
     * @throws Error if this NumberUnit cannot be compared to the other value.
     */
    compare(value: number, unit?: Unit<F>): number;
    /**
     * Checks whether this NumberUnit is equal to another value.
     * @param value The other value.
     * @returns Whether this NumberUnit is equal to the other value.
     */
    equals(value: NumberUnitInterface<string>): boolean;
    /**
     * Checks whether this NumberUnit is equal to another value.
     * @param value The other value.
     * @param unit The unit type of the other value. Defaults to this NumberUnit's unit type.
     * @returns Whether this NumberUnit is equal to the other value.
     */
    equals(value: number, unit?: Unit<string>): boolean;
    /**
     * Checks whether this NumberUnit has a numeric value of NaN.
     * @returns Whether this NumberUnit has a numeric value of NaN.
     */
    isNaN(): boolean;
    /**
     * Copies this NumberUnit.
     * @returns A copy of this NumberUnit.
     */
    copy(): NumberUnit<F, U>;
}
/**
 * A read-only interface for a WT_NumberUnit.
 */
export declare class NumberUnitReadOnly<F extends string, U extends Unit<F> = Unit<F>> implements NumberUnitInterface<F, U> {
    private readonly source;
    /**
     * Constructor.
     * @param source - the source of the new read-only NumberUnit.
     */
    constructor(source: NumberUnit<F, U>);
    /**
     * Gets this NumberUnit's numeric value.
     * @returns This NumberUnit's numeric value.
     */
    get number(): number;
    /**
     * Gets this NumberUnit's unit type.
     * @returns This NumberUnit's unit type.
     */
    get unit(): U;
    /**
     * Adds a value to this NumberUnit and returns the result.
     * @param value The other value.
     * @param out The NumberUnit to which to write the result.
     * @returns The sum.
     * @throws Error if the supplied value cannot be converted to this NumberUnit's unit type.
     */
    add<OU extends Unit<F>>(value: NumberUnitInterface<F>, out: NumberUnit<F, OU>): NumberUnit<F, OU>;
    /**
     * Adds a value to this NumberUnit and returns the result.
     * @param value The other value.
     * @param unit The unit type of the other value.
     * @param out The NumberUnit to which to write the result.
     * @returns The sum.
     * @throws Error if the supplied value cannot be converted to this NumberUnit's unit type.
     */
    add<OU extends Unit<F>>(value: number, unit: Unit<F>, out: NumberUnit<F, OU>): NumberUnit<F, OU>;
    /**
     * Subtracts a value from this NumberUnit and returns the result.
     * @param value The other value.
     * @param out The NumberUnit to which to write the result.
     * @returns The difference.
     * @throws Error if the supplied value cannot be converted to this NumberUnit's unit type.
     */
    subtract<OU extends Unit<F>>(value: NumberUnitInterface<F>, out: NumberUnit<F, OU>): NumberUnit<F, OU>;
    /**
     * Subtracts a value from this NumberUnit and returns the result.
     * @param value The other value.
     * @param unit The unit type of the other value.
     * @param out The NumberUnit to which to write the result.
     * @returns The difference.
     * @throws Error if the supplied value cannot be converted to this NumberUnit's unit type.
     */
    subtract<OU extends Unit<F>>(value: number, unit: Unit<F>, out: NumberUnit<F, OU>): NumberUnit<F, OU>;
    /**
     * Scales this NumberUnit by a unit-less factor and returns the result.
     * @param factor The factor by which to scale.
     * @param out The NumberUnit to which to write the result.
     * @returns The scaled value.
     */
    scale<OU extends Unit<F>>(factor: number, out: NumberUnit<F, OU>): NumberUnit<F, OU>;
    /**
     * Finds the ratio of this NumberUnit to another value.
     * @param value The other value.
     * @returns The ratio.
     * @throws Error if the other value cannot be converted to this NumberUnit's unit type.
     */
    ratio(value: NumberUnitInterface<F>): number;
    /**
     * Finds the ratio of this NumberUnit to another value.
     * @param value The other value.
     * @param unit The unit type of the other value.
     * @returns the ratio.
     * @throws Error if the other value cannot be converted to this NumberUnit's unit type.
     */
    ratio(value: number, unit: Unit<F>): number;
    /**
     * Calculates the absolute value of this NumberUnit and returns the result.
     * @param out The NumberUnit to which to write the result.
     * @returns The absolute value.
     */
    abs<OU extends Unit<F>>(out: NumberUnit<F, OU>): NumberUnit<F, OU>;
    /**
     * Returns the numeric value of this NumberUnit after conversion to a specified unit.
     * @param unit The unit to which to convert.
     * @returns The converted numeric value.
     * @throws Error if this NumberUnit's unit type cannot be converted to the specified unit.
     */
    asUnit(unit: Unit<F>): number;
    /**
     * Checks whether this NumberUnit is greater than, equal to, or less than another value.
     * @param value The other value.
     * @returns 0 if this NumberUnit is equal to the other value, -1 if this number is less, 1 if this number is greater.
     * @throws Error if this NumberUnit cannot be compared to the other value.
     */
    compare(value: NumberUnitInterface<F>): number;
    /**
     * Checks whether this NumberUnit is greater than, equal to, or less than another value.
     * @param value The other value.
     * @param unit The unit type of the other value. Defaults to this NumberUnit's unit type.
     * @returns 0 if this NumberUnit is equal to the other value, -1 if this number is less, 1 if this number is greater.
     * @throws Error if this NumberUnit cannot be compared to the other value.
     */
    compare(value: number, unit?: Unit<F>): number;
    /**
     * Checks whether this NumberUnit is equal to another value.
     * @param value The other value.
     * @returns Whether this NumberUnit is equal to the other value.
     */
    equals(value: NumberUnitInterface<string>): boolean;
    /**
     * Checks whether this NumberUnit is equal to another value.
     * @param value The other value.
     * @param unit The unit type of the other value. Defaults to this NumberUnit's unit type.
     * @returns Whether this NumberUnit is equal to the other value.
     */
    equals(value: number, unit?: Unit<string>): boolean;
    /**
     * Checks whether this NumberUnit has a numeric value of NaN.
     * @returns Whether this NumberUnit has a numeric value of NaN.
     */
    isNaN(): boolean;
    /**
     * Copies this NumberUnit.
     * @returns A copy of this NumberUnit.
     */
    copy(): NumberUnit<F, U>;
}
/**
 * A unit of measurement.
 */
export interface Unit<F extends string> {
    /** This unit's family. */
    readonly family: F;
    /** This unit's name. */
    readonly name: string;
    /**
     * Checks whether conversions between this unit and another unit are possible.
     * @param otherUnit The other unit.
     * @returns Whether conversions between this unit and another unit are possible.
     */
    canConvert(otherUnit: Unit<string>): boolean;
    /**
     * Converts a value of this unit to another unit.
     * @param value The value to convert.
     * @param toUnit The unit to which to convert.
     * @returns The converted value.
     * @throws Error if attempting an invalid conversion.
     */
    convertTo(value: number, toUnit: Unit<F>): number;
    /**
     * Converts a value of another unit to this unit.
     * @param value The value to convert.
     * @param fromUnit The unit from which to convert.
     * @returns The converted value.
     * @throws Error if attempting an invalid conversion.
     */
    convertFrom(value: number, fromUnit: Unit<F>): number;
    /**
     * Creates a NumberUnit with a specified initial value of this unit type.
     * @param value The numeric value of the new NumberUnit.
     * @returns A NumberUnit of this unit type.
     */
    createNumber(value: number): NumberUnit<F, this>;
    /**
     * Checks whether this unit is equal to another unit. Returns true if and only if the other unit belongs to the same
     * family and has the same name as this unit.
     * @param other The other unit to which to compare.
     * @returns Whether this unit is equal to the comparison.
     */
    equals(other: Unit<string>): boolean;
}
/**
 * A unit type that can be compounded.
 */
export interface CompoundableUnit<F extends string> extends Unit<F> {
    /** The relative linear scale of this unit compared to the standard unit of the same family. */
    readonly scaleFactor: number;
}
/**
 * A unit of measurement.
 */
export declare abstract class AbstractUnit<F extends string> implements Unit<F> {
    readonly name: string;
    abstract readonly family: F;
    /**
     * Constructor.
     * @param name The name of this unit.
     */
    constructor(name: string);
    /** @inheritdoc */
    canConvert(otherUnit: Unit<string>): boolean;
    /** @inheritdoc */
    abstract convertTo(value: number, toUnit: Unit<F>): number;
    /** @inheritdoc */
    abstract convertFrom(value: number, fromUnit: Unit<F>): number;
    /** @inheritdoc */
    createNumber(value: number): NumberUnit<F, this>;
    /** @inheritdoc */
    equals(other: Unit<string>): boolean;
}
/**
 * A unit that can be converted to another unit of the same type via a fixed linear transformation.
 */
export declare class SimpleUnit<F extends string> extends AbstractUnit<F> implements CompoundableUnit<F> {
    readonly family: F;
    readonly scaleFactor: number;
    readonly zeroOffset: number;
    /**
     * Constructor.
     * @param family The family to which this unit belongs.
     * @param name The name of this unit.
     * @param scaleFactor The relative linear scale of the new unit compared to the standard unit of the same family.
     * @param zeroOffset The zero offset of the new unit compared to the standard unit of the same family.
     */
    constructor(family: F, name: string, scaleFactor: number, zeroOffset?: number);
    /** @inheritdoc */
    canConvert(otherUnit: Unit<string>): boolean;
    /** @inheritdoc */
    convertTo(value: number, toUnit: Unit<F>): number;
    /** @inheritdoc */
    convertFrom(value: number, fromUnit: Unit<F>): number;
}
/**
 * A unit of measure composed of the multiplicative combination of multiple elementary units.
 */
export declare class CompoundUnit<F extends string> extends AbstractUnit<F> {
    readonly family: F;
    private readonly numerator;
    private readonly denominator;
    protected readonly scaleFactor: number;
    /**
     * Constructor.
     * @param family The family to which this unit belongs.
     * @param numerator An array of CompoundableUnits containing all the units in the numerator of the compound unit.
     * @param denominator An array of CompoundableUnits containing all the units in the denominator of the compound unit.
     * @param name The name of this unit. If not defined, one will be automatically generated.
     */
    constructor(family: F, numerator: CompoundableUnit<string>[], denominator: CompoundableUnit<string>[], name?: string);
    /**
     * Gets the scale factor for this unit.
     * @returns the scale factor for this unit.
     */
    private getScaleFactor;
    /** @inheritdoc */
    canConvert(otherUnit: Unit<string>): boolean;
    /** @inheritdoc */
    convertTo(value: number, toUnit: Unit<F>): number;
    /** @inheritdoc */
    convertFrom(value: number, fromUnit: Unit<F>): number;
}
/**
 * Predefined unit families.
 */
export declare enum UnitFamily {
    Distance = "distance",
    Angle = "angle",
    Duration = "duration",
    Weight = "weight",
    Volume = "volume",
    Pressure = "pressure",
    Temperature = "temperature",
    Speed = "speed",
    Acceleration = "acceleration",
    WeightFlux = "weight_flux",
    VolumeFlux = "volume_flux"
}
/**
 * Predefined unit types.
 */
export declare class UnitType {
    static readonly METER: SimpleUnit<UnitFamily.Distance>;
    static readonly FOOT: SimpleUnit<UnitFamily.Distance>;
    static readonly KILOMETER: SimpleUnit<UnitFamily.Distance>;
    /** Statute mile. */
    static readonly MILE: SimpleUnit<UnitFamily.Distance>;
    /** Nautical mile. */
    static readonly NMILE: SimpleUnit<UnitFamily.Distance>;
    /** Great-arc radian. The average radius of Earth. */
    static readonly GA_RADIAN: SimpleUnit<UnitFamily.Distance>;
    static readonly RADIAN: SimpleUnit<UnitFamily.Angle>;
    static readonly DEGREE: SimpleUnit<UnitFamily.Angle>;
    static readonly ARC_MIN: SimpleUnit<UnitFamily.Angle>;
    static readonly ARC_SEC: SimpleUnit<UnitFamily.Angle>;
    static readonly MILLISECOND: SimpleUnit<UnitFamily.Duration>;
    static readonly SECOND: SimpleUnit<UnitFamily.Duration>;
    static readonly MINUTE: SimpleUnit<UnitFamily.Duration>;
    static readonly HOUR: SimpleUnit<UnitFamily.Duration>;
    static readonly KILOGRAM: SimpleUnit<UnitFamily.Weight>;
    static readonly POUND: SimpleUnit<UnitFamily.Weight>;
    static readonly TON: SimpleUnit<UnitFamily.Weight>;
    static readonly TONNE: SimpleUnit<UnitFamily.Weight>;
    /** Weight equivalent of one liter of fuel, using the generic conversion 1 gallon = 6.7 pounds. */
    static readonly LITER_FUEL: SimpleUnit<UnitFamily.Weight>;
    /** Weight equivalent of one pound of fuel, using the generic conversion 1 gallon = 6.7 pounds. */
    static readonly GALLON_FUEL: SimpleUnit<UnitFamily.Weight>;
    static readonly LITER: SimpleUnit<UnitFamily.Volume>;
    static readonly GALLON: SimpleUnit<UnitFamily.Volume>;
    /** Hectopascal. */
    static readonly HPA: SimpleUnit<UnitFamily.Pressure>;
    /** Atmosphere. */
    static readonly ATM: SimpleUnit<UnitFamily.Pressure>;
    /** Inch of mercury. */
    static readonly IN_HG: SimpleUnit<UnitFamily.Pressure>;
    /** Millimeter of mercury. */
    static readonly MM_HG: SimpleUnit<UnitFamily.Pressure>;
    static readonly CELSIUS: SimpleUnit<UnitFamily.Temperature>;
    static readonly FAHRENHEIT: SimpleUnit<UnitFamily.Temperature>;
    static readonly KNOT: CompoundUnit<UnitFamily.Speed>;
    /** Kilometer per hour. */
    static readonly KPH: CompoundUnit<UnitFamily.Speed>;
    /** Miles per hour. */
    static readonly MPH: CompoundUnit<UnitFamily.Speed>;
    /** Meter per minute. */
    static readonly MPM: CompoundUnit<UnitFamily.Speed>;
    /** Meter per second. */
    static readonly MPS: CompoundUnit<UnitFamily.Speed>;
    /** Foot per minute. */
    static readonly FPM: CompoundUnit<UnitFamily.Speed>;
    /** Foot per second. */
    static readonly FPS: CompoundUnit<UnitFamily.Speed>;
    /** Meter per minute per second. */
    static readonly MPM_PER_SEC: CompoundUnit<UnitFamily.Acceleration>;
    /** Meter per second per second. */
    static readonly MPS_PER_SEC: CompoundUnit<UnitFamily.Acceleration>;
    /** Foot per minute per second. */
    static readonly FPM_PER_SEC: CompoundUnit<UnitFamily.Acceleration>;
    /** Foot per second per second. */
    static readonly FPS_PER_SEC: CompoundUnit<UnitFamily.Acceleration>;
    /** Average gravitational acceleration on Earth at sea level. */
    static readonly G_ACCEL: CompoundUnit<UnitFamily.Acceleration>;
    /** Kilogram per hour. */
    static readonly KGH: CompoundUnit<UnitFamily.WeightFlux>;
    /** Pound per hour. */
    static readonly PPH: CompoundUnit<UnitFamily.WeightFlux>;
    /** Weight equivalent of one liter of fuel per hour, using the generic conversion 1 gallon = 6.7 pounds. */
    static readonly LPH_FUEL: CompoundUnit<UnitFamily.WeightFlux>;
    /** Weight equivalent of one gallon fuel per hour, using the generic conversion 1 gallon = 6.7 pounds. */
    static readonly GPH_FUEL: CompoundUnit<UnitFamily.WeightFlux>;
}
//# sourceMappingURL=NumberUnit.d.ts.map