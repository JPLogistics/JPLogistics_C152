/**
 * Utility class for manipulating bit flags.
 */
export declare class BitFlags {
    /**
     * Generates a bit flag with a boolean value of true at a specified index.
     * @param index The index of the flag. Must be between 0 and 32, inclusive.
     * @returns a bit flag.
     * @throws Error if index is out of bounds.
     */
    static createFlag(index: number): number;
    /**
     * Gets the inverse of some bit flags.
     * @param flags The bit flag group containing the flags to invert.
     * @param mask An optional bit mask to use when applying the inverse operation. The operation will only be performed
     * at the indexes where the mask has a value of 1 (true). If a mask is not specified, the operation will be performed
     * at all indexes.
     * @returns the inverse
     */
    static not(flags: number, mask?: number): number;
    /**
     * Gets the union of zero or more bit flags.
     * @param flags A list of bit flags.
     * @returns the union of the bit flags.
     */
    static union(...flags: number[]): number;
    /**
     * Gets the intersection of zero or more bit flags.
     * @param flags A list of bit flags.
     * @returns the intersection of the bit flags.
     */
    static intersection(...flags: number[]): number;
    /**
     * Checks if a bit flag group meets at least one condition from a list of conditions.
     * @param flags A bit flag group.
     * @param conditions The conditions to meet, as a bit flag group.
     * @returns whether the bit flag group meets at least one condition.
     */
    static isAny(flags: number, conditions: number): boolean;
    /**
     * Checks if a bit flag group meets all the conditions from a list of conditions.
     * @param flags A bit flag group.
     * @param conditions The conditions to meet, as a bit flag group.
     * @returns whether the bit flag group meets all the conditions.
     */
    static isAll(flags: number, conditions: number): boolean;
    /**
     * Iterates through a bit flag group and executes a callback function once for each flag.
     * @param flags A bit flag group.
     * @param callback A function which will be called once for each flag.
     * @param valueFilter The value on which to filter. If defined, only flags with values equal to the filter will be
     * iterated, otherwise all flags will be iterated regardless of their values.
     * @param startIndex The index of the flag at which to start (inclusive). Defaults to 0.
     * @param endIndex The index of the flag at which to end (exclusive). Defaults to 32.
     */
    static forEach(flags: number, callback: (value: boolean, index: number, flags: number) => void, valueFilter?: boolean, startIndex?: number, endIndex?: number): void;
}
//# sourceMappingURL=BitFlags.d.ts.map