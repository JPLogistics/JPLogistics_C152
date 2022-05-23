/**
 * Utility class for manipulating bit flags.
 */
export class BitFlags {
    /**
     * Generates a bit flag with a boolean value of true at a specified index.
     * @param index The index of the flag. Must be between 0 and 32, inclusive.
     * @returns a bit flag.
     * @throws Error if index is out of bounds.
     */
    static createFlag(index) {
        if (index < 0 || index > 32) {
            throw new Error(`Invalid index ${index} for bit flag. Index must be between 0 and 32.`);
        }
        return 1 << index;
    }
    /**
     * Gets the inverse of some bit flags.
     * @param flags The bit flag group containing the flags to invert.
     * @param mask An optional bit mask to use when applying the inverse operation. The operation will only be performed
     * at the indexes where the mask has a value of 1 (true). If a mask is not specified, the operation will be performed
     * at all indexes.
     * @returns the inverse
     */
    static not(flags, mask = ~0) {
        return flags ^ mask;
    }
    /**
     * Gets the union of zero or more bit flags.
     * @param flags A list of bit flags.
     * @returns the union of the bit flags.
     */
    static union(...flags) {
        let result = 0;
        const len = flags.length;
        for (let i = 0; i < len; i++) {
            result |= flags[i];
        }
        return result;
    }
    /**
     * Gets the intersection of zero or more bit flags.
     * @param flags A list of bit flags.
     * @returns the intersection of the bit flags.
     */
    static intersection(...flags) {
        const len = flags.length;
        if (len === 0) {
            return 0;
        }
        let result = flags[0];
        for (let i = 1; i < len; i++) {
            result &= flags[i];
        }
        return result;
    }
    /**
     * Checks if a bit flag group meets at least one condition from a list of conditions.
     * @param flags A bit flag group.
     * @param conditions The conditions to meet, as a bit flag group.
     * @returns whether the bit flag group meets at least one condition.
     */
    static isAny(flags, conditions) {
        return (flags & conditions) !== 0;
    }
    /**
     * Checks if a bit flag group meets all the conditions from a list of conditions.
     * @param flags A bit flag group.
     * @param conditions The conditions to meet, as a bit flag group.
     * @returns whether the bit flag group meets all the conditions.
     */
    static isAll(flags, conditions) {
        return (flags & conditions) === conditions;
    }
    /**
     * Iterates through a bit flag group and executes a callback function once for each flag.
     * @param flags A bit flag group.
     * @param callback A function which will be called once for each flag.
     * @param valueFilter The value on which to filter. If defined, only flags with values equal to the filter will be
     * iterated, otherwise all flags will be iterated regardless of their values.
     * @param startIndex The index of the flag at which to start (inclusive). Defaults to 0.
     * @param endIndex The index of the flag at which to end (exclusive). Defaults to 32.
     */
    static forEach(flags, callback, valueFilter, startIndex, endIndex) {
        startIndex = Utils.Clamp(startIndex !== null && startIndex !== void 0 ? startIndex : (startIndex = 0), 0, 32);
        endIndex = Utils.Clamp(endIndex !== null && endIndex !== void 0 ? endIndex : (endIndex = 32), 0, 32);
        for (let i = startIndex; i < endIndex; i++) {
            const value = (flags & (1 << i)) !== 0;
            if (valueFilter === undefined || valueFilter === value) {
                callback(value, i, flags);
            }
        }
    }
}
