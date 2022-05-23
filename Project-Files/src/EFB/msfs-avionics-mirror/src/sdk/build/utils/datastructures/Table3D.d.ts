/**
 * A 3D table for intepolating across multiple dimensions.
 */
export declare class Table3D {
    private readonly data;
    /**
     * Adds a range of values to the table.
     * @param x The x value for this range of values.
     * @param values The range of values in [y, z]
     */
    addRange(x: number, values: Float64Array[]): void;
    /**
     * Gets the interpolated value from the table given an x and y position.
     * @param x The x position to interpolate for.
     * @param y The y position to interpolate for.
     * @returns The interpolated number.
     */
    getValue(x: number, y: number): number;
    /**
     * Interpolates a range of values given a starting y value.
     * @param y The y value to use.
     * @param range The range of values to interpolate over.
     * @returns A resultant interpolated z value.
     */
    private interpRange;
    /**
     * Interpolates in two dimensions.
     * @param y The input y value.
     * @param y0 The bottom y value for interpolation.
     * @param y1 The top y value for interpolation.
     * @param z0 The bottom z number for interpolation
     * @param z1 The top z number for interpolation.
     * @returns An interpolated z result given the input y.
     */
    private interp2d;
}
//# sourceMappingURL=Table3D.d.ts.map