/**
 * A linearly interpolated N-dimensional lookup table.
 */
export declare class LerpLookupTable {
    private static readonly BREAKPOINT_COMPARATOR;
    private static readonly tempBreakpoint;
    private readonly _dimensionCount;
    /** The number of dimensions in this table. */
    get dimensionCount(): number;
    private readonly table;
    /**
     * Creates a lookup table of a specified dimension.
     * @param dimensionCount The number of dimensions in the new table. Values less than 0 will be clamped to 0.
     */
    constructor(dimensionCount: number);
    /**
     * Creates a lookup table initialized with an array of breakpoints.
     * @param breakpoints An array of breakpoints with which to initialize the new table. Each breakpoint should be
     * expressed as a number array, where the first element represents the breakpoint value, and the next N elements
     * represent the breakpoint key in each dimension. If not all breakpoint arrays have the same length, the dimension
     * of the table will be set equal to `N - 1`, where `N` is the length of the shortest array. For arrays with length
     * greater than `N`, all keys after index `N - 1` will be ignored. If the table ends up with zero dimensions, it will
     * be initialized to an empty table.
     */
    constructor(breakpoints: number[][]);
    /**
     * Inserts a breakpoint into this table. If the breakpoint has more dimensions than this table, only the first `N`
     * keys of the breakpoint will be used, where `N` is the dimension count of this table.
     * @param breakpoint A breakpoint, as a number array with the value at index 0 followed by the keys for each
     * dimension.
     * @returns This table, after the breakpoint has been inserted.
     * @throws Error if this table has zero dimensions, or the breakpoint has fewer dimensions than this table.
     */
    insertBreakpoint(breakpoint: number[]): this;
    /**
     * Helper method for inserting a breakpoint into this table.
     * @param breakpoint The breakpoint to insert.
     * @param dimension The current dimension being evaluated.
     * @param array The array of dimensional breakpoints into which the breakpoint should be inserted.
     */
    private insertBreakpointHelper;
    /**
     * Looks up a value in this table using a specified key. The returned value will be linearly interpolated from
     * surrounding breakpoints if the key is not an exact match for any of the table's breakpoints.
     * @param key The lookup key, as an ordered N-tuple of numbers.
     * @returns The value corresponding to the specified key, or undefined if a value could not be retrieved.
     * @throws Error if this table has zero dimensions, the key has fewer dimensions than this table, or a value could
     * not be retrieved.
     */
    get(...key: number[]): number;
    /**
     * Helper method for looking up a key in this table.
     * @param key The key to look up.
     * @param dimension The current dimension being evaluated.
     * @param lookupArray The array containing breakpoints in the next lower dimension in which to search for the key.
     * @returns The interpolated value of the key at the specified dimension.
     */
    private lookupHelper;
}
//# sourceMappingURL=LerpLookupTable.d.ts.map