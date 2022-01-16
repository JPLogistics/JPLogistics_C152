import { GeodesicResampler, GeoProjection, PathStream } from '../..';
import { CircleVector } from '../../flightplan';
/**
 * Renders flight path vectors as a curved line.
 */
export declare class MapFlightPathVectorLineRenderer {
    private static readonly geoCircleCache;
    private readonly renderer;
    /**
     * Constructor.
     * @param resampler The geodesic resampler used by this renderer.
     */
    constructor(resampler: GeodesicResampler);
    /**
     * Renders a flight path vector to a canvas.
     * @param vector The flight path vector to render.
     * @param projection The projection to use when rendering.
     * @param context The canvas 2D rendering context to which to render.
     * @param stream The path stream to which to render.
     * @param width The width of the rendered line.
     * @param style The style of the rendered line.
     * @param dash The dash array of the rendered line. Defaults to no dash.
     */
    render(vector: CircleVector, projection: GeoProjection, context: CanvasRenderingContext2D, stream: PathStream, width: number, style: string, dash?: readonly number[]): void;
}
//# sourceMappingURL=MapFlightPathVectorLineRenderer.d.ts.map