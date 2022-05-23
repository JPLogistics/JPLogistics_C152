import { MathUtils } from '../..';
import { SortedArray } from './SortedArray';
/**
 * A linearly interpolated N-dimensional lookup table.
 */
export class LerpLookupTable {
    // eslint-disable-next-line jsdoc/require-jsdoc
    constructor(arg) {
        this.table = new SortedArray(LerpLookupTable.BREAKPOINT_COMPARATOR);
        if (typeof arg === 'number') {
            this._dimensionCount = isNaN(arg) ? 0 : Math.max(0, arg);
            return;
        }
        const leastDimension = arg.reduce((accum, current) => (current.length < accum.length) ? current : accum);
        this._dimensionCount = Math.max(0, leastDimension ? (leastDimension.length - 1) : 0);
        if (this._dimensionCount === 0) {
            return;
        }
        for (let i = 0; i < arg.length; i++) {
            this.insertBreakpoint(arg[i]);
        }
    }
    // eslint-disable-next-line jsdoc/require-returns
    /** The number of dimensions in this table. */
    get dimensionCount() {
        return this._dimensionCount;
    }
    /**
     * Inserts a breakpoint into this table. If the breakpoint has more dimensions than this table, only the first `N`
     * keys of the breakpoint will be used, where `N` is the dimension count of this table.
     * @param breakpoint A breakpoint, as a number array with the value at index 0 followed by the keys for each
     * dimension.
     * @returns This table, after the breakpoint has been inserted.
     * @throws Error if this table has zero dimensions, or the breakpoint has fewer dimensions than this table.
     */
    insertBreakpoint(breakpoint) {
        if (this._dimensionCount === 0) {
            throw new Error('LerpLookupTable: cannot insert a breakpoint into a 0-dimensional table');
        }
        if (breakpoint.length - 1 < this._dimensionCount) {
            throw new Error(`LerpLookupTable: cannot insert a ${breakpoint.length - 1}-dimensional breakpoint into a ${this._dimensionCount}-dimensional table`);
        }
        this.insertBreakpointHelper(breakpoint, 0, this.table);
        return this;
    }
    /**
     * Helper method for inserting a breakpoint into this table.
     * @param breakpoint The breakpoint to insert.
     * @param dimension The current dimension being evaluated.
     * @param array The array of dimensional breakpoints into which the breakpoint should be inserted.
     */
    insertBreakpointHelper(breakpoint, dimension, array) {
        const dimensionKey = breakpoint[dimension + 1];
        const query = LerpLookupTable.tempBreakpoint;
        query.key = dimensionKey;
        if (dimension === this._dimensionCount - 1) {
            let match = array.match(query);
            if (!match) {
                match = { key: dimensionKey, value: breakpoint[0] };
                array.insert(match);
            }
        }
        else {
            let next = array.match(query);
            if (!next) {
                array.insert(next = { key: dimensionKey, array: new SortedArray(LerpLookupTable.BREAKPOINT_COMPARATOR) });
            }
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            this.insertBreakpointHelper(breakpoint, dimension + 1, next.array);
        }
    }
    /**
     * Looks up a value in this table using a specified key. The returned value will be linearly interpolated from
     * surrounding breakpoints if the key is not an exact match for any of the table's breakpoints.
     * @param key The lookup key, as an ordered N-tuple of numbers.
     * @returns The value corresponding to the specified key, or undefined if a value could not be retrieved.
     * @throws Error if this table has zero dimensions, the key has fewer dimensions than this table, or a value could
     * not be retrieved.
     */
    get(...key) {
        if (this._dimensionCount === 0) {
            throw new Error('LerpLookupTable: cannot look up a key in a 0-dimensional table');
        }
        if (key.length < this._dimensionCount) {
            throw new Error(`LerpLookupTable: cannot look up a ${key.length}-dimensional key in a ${this._dimensionCount}-dimensional table`);
        }
        const value = this.lookupHelper(key, 0, this.table);
        if (value === undefined) {
            throw new Error(`LerpLookupTable: could not retrieve value for key ${key}`);
        }
        return value;
    }
    /**
     * Helper method for looking up a key in this table.
     * @param key The key to look up.
     * @param dimension The current dimension being evaluated.
     * @param lookupArray The array containing breakpoints in the next lower dimension in which to search for the key.
     * @returns The interpolated value of the key at the specified dimension.
     */
    lookupHelper(key, dimension, lookupArray) {
        const dimensionKey = key[dimension];
        const query = LerpLookupTable.tempBreakpoint;
        query.key = dimensionKey;
        const index = lookupArray.matchIndex(query);
        let start;
        let end;
        if (index >= 0) {
            start = lookupArray.get(index);
            end = start;
        }
        else {
            start = lookupArray.get(-index - 2);
            end = lookupArray.get(-index - 1);
            if (!start) {
                start = end;
            }
            if (!end) {
                end = start;
            }
        }
        if (!start || !end) {
            return undefined;
        }
        let startValue;
        let endValue;
        if (dimension === this.dimensionCount - 1) {
            startValue = start.value;
            endValue = end.value;
        }
        else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            startValue = this.lookupHelper(key, dimension + 1, start.array);
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            endValue = this.lookupHelper(key, dimension + 1, end.array);
        }
        if (startValue === undefined || endValue === undefined) {
            return undefined;
        }
        if (startValue === endValue) {
            return startValue;
        }
        return MathUtils.lerp(dimensionKey, start.key, end.key, startValue, endValue);
    }
}
LerpLookupTable.BREAKPOINT_COMPARATOR = (a, b) => a.key - b.key;
LerpLookupTable.tempBreakpoint = { key: 0 };
