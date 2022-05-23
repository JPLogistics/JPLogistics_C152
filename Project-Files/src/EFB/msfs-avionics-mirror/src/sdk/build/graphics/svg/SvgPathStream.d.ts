import { PathStream } from '../path/PathStream';
/**
 * A path stream which builds SVG path strings from its input path commands.
 */
export declare class SvgPathStream implements PathStream {
    private static readonly vec2Cache;
    private svgPath;
    private precision;
    private formatter;
    private readonly firstPoint;
    private readonly prevPoint;
    /**
     * Constructor.
     * @param precision The precision of this stream. All coordinates will be rounded to this stream's precision when
     * building the SVG path string. A value of `0` indicates infinite precision. Defaults to `0`.
     */
    constructor(precision?: number);
    /**
     * Gets the SVG path string describing all path commands consumed by this stream since the last call to
     * `beginPath()`.
     * @returns The SVG path string describing all path commands consumed by this stream since the last call to
     * `beginPath()`.
     */
    getSvgPath(): string;
    /**
     * Gets the precision of this stream. All coordinates will be rounded to this stream's precision when building the
     * SVG path string. A value of `0` indicates infinite precision.
     * @returns The precision of this stream.
     */
    getPrecision(): number;
    /**
     * Sets the precision of this stream. All coordinates will be rounded to this stream's precision when building the
     * SVG path string. A value of `0` indicates infinite precision.
     * @param precision The precision of this stream. Negative numbers will be converted to their absolute values.
     */
    setPrecision(precision: number): void;
    /** @inheritdoc */
    beginPath(): void;
    /** @inheritdoc */
    moveTo(x: number, y: number): void;
    /** @inheritdoc */
    lineTo(x: number, y: number): void;
    /** @inheritdoc */
    bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void;
    /** @inheritdoc */
    quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void;
    /** @inheritdoc */
    arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterClockwise?: boolean): void;
    /** @inheritdoc */
    closePath(): void;
    /**
     * Resets the state of this stream.
     */
    private reset;
}
//# sourceMappingURL=SvgPathStream.d.ts.map