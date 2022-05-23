import { CircleVector } from '../../flightplan';
import { PathPattern } from '../../graphics/path';
import { GeoProjectionPathStreamStack } from './GeoProjectionPathStreamStack';
/**
 * Renders flight path vectors as repeating patterns.
 */
export declare class FlightPathVectorPatternRenderer {
    private static readonly geoCircleCache;
    private readonly renderer;
    /**
     * Renders a flight path vector to a canvas.
     * @param vector The flight path vector to render.
     * @param context The canvas 2D rendering context to which to render.
     * @param streamStack The path stream to which to render.
     * @param pattern The pattern to render.
     * @param continuePath Whether to continue the previously rendered path. If true, a discontinuity in the rendered
     * path will not be inserted before the vector is rendered. This may lead to undesired artifacts if the previously
     * rendered path does not terminate at the point where the projected vector starts. Defaults to false.
     */
    render(vector: CircleVector, context: CanvasRenderingContext2D, streamStack: GeoProjectionPathStreamStack, pattern: PathPattern, continuePath?: boolean): void;
}
//# sourceMappingURL=FlightPathVectorPatternRenderer.d.ts.map