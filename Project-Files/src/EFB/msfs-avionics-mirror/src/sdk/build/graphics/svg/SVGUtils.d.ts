/** A collection of handy SVG functions. */
export declare class SVGUtils {
    /**
     * Creates an arc using an SVG path.
     * From https://stackoverflow.com/questions/5736398/how-to-calculate-the-svg-path-for-an-arc-of-a-circle
     * @param x Arc center x position.
     * @param y Arc center y position.
     * @param radius Arc radius.
     * @param startAngle Arc start angle.
     * @param endAngle Arc end angle.
     * @returns The d value for and SVG path element.
     */
    static describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number): string;
}
//# sourceMappingURL=SVGUtils.d.ts.map