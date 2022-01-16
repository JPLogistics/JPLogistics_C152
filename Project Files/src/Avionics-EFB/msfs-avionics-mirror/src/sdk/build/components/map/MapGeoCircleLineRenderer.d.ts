import { GeoCircle, GeodesicResampler, GeoProjection, PathStream } from '../..';
/**
 * Renders arcs along geo circles as curved lines.
 */
export declare class MapGeoCircleLineRenderer {
    private static readonly EMPTY_DASH;
    private static readonly geoPointCache;
    private static readonly vec3Cache;
    private readonly projection;
    private readonly projectionStream;
    /**
     * Constructor.
     * @param resampler The geodesic resampler used by this renderer.
     */
    constructor(resampler: GeodesicResampler);
    /**
     * Renders an arc along a geo circle to a canvas.
     * @param circle The geo circle containing the arc to render.
     * @param startLat The latitude of the start of the arc, in degrees.
     * @param startLon The longitude of the start of the arc, in degrees.
     * @param endLat The latitude of the end of the arc, in degrees.
     * @param endLon The longitude of the end of the arc, in degrees.
     * @param projection The projection to use when rendering.
     * @param context The canvas 2D rendering context to which to render.
     * @param stream The path stream to which to render.
     * @param width The width of the rendered line.
     * @param style The style of the rendered line.
     * @param dash The dash array of the rendered line. Defaults to no dash.
     */
    render(circle: GeoCircle, startLat: number, startLon: number, endLat: number, endLon: number, projection: GeoProjection, context: CanvasRenderingContext2D, stream: PathStream, width: number, style: string, dash?: readonly number[]): void;
}
//# sourceMappingURL=MapGeoCircleLineRenderer.d.ts.map