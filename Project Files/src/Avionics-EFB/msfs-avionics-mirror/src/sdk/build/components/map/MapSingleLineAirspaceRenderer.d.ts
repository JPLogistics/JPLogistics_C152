import { GeoProjection, PathStream } from '../..';
import { LodBoundaryShape } from '../../navigation';
import { MapAbstractAirspaceRenderer } from './MapAirspaceRenderer';
/**
 * An airspace renderer which renders airspace borders as a single line.
 */
export declare class MapSingleLineAirspaceRenderer extends MapAbstractAirspaceRenderer {
    readonly lineWidth: number;
    readonly strokeStyle: string | CanvasGradient | CanvasPattern;
    readonly dash: readonly number[];
    private static readonly geoPointCache;
    private static readonly vec2Cache;
    private static readonly vec3Cache;
    /**
     * Constructor.
     * @param lineWidth The stroke width of the rendered airspace line.
     * @param strokeStyle The stroke style of the rendered airspace line.
     * @param dash The dash of the rendered airspace line.
     */
    constructor(lineWidth: number, strokeStyle: string | CanvasGradient | CanvasPattern, dash: readonly number[]);
    /** @inheritdoc */
    protected renderShape(shape: Readonly<LodBoundaryShape>, projection: GeoProjection, context: CanvasRenderingContext2D, stream?: PathStream): void;
    /**
     * Loads a projection of a great-circle path into a canvas rendering context.
     * @param circle The great circle defining the path.
     * @param start The start point of the path.
     * @param end The end point of the path.
     * @param projection The projection to use.
     * @param stream The path stream to which to load the projected path.
     */
    private pathGreatCircle;
    /**
     * Loads a projection of a small-circle path into a canvas rendering context.
     * @param circle The small circle defining the path.
     * @param start The start point of the path.
     * @param end The end point of the path.
     * @param projection The projection to use.
     * @param stream The path stream to which to load the projected path.
     */
    private pathSmallCircle;
}
//# sourceMappingURL=MapSingleLineAirspaceRenderer.d.ts.map