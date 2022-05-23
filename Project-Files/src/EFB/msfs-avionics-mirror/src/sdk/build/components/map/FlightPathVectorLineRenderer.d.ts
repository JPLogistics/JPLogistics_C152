import { CircleVector } from '../../flightplan';
import { GeoProjectionPathStreamStack } from './GeoProjectionPathStreamStack';
/**
 * Renders flight path vectors as a curved line.
 */
export declare class FlightPathVectorLineRenderer {
    private static readonly geoCircleCache;
    private readonly renderer;
    /**
     * Renders a flight path vector to a canvas.
     * @param vector The flight path vector to render.
     * @param context The canvas 2D rendering context to which to render.
     * @param streamStack The path stream to which to render.
     * @param width The width of the rendered line.
     * @param style The style of the rendered line.
     * @param dash The dash array of the rendered line. Defaults to no dash.
     */
    render(vector: CircleVector, context: CanvasRenderingContext2D, streamStack: GeoProjectionPathStreamStack, width: number, style: string, dash?: readonly number[]): void;
}
//# sourceMappingURL=FlightPathVectorLineRenderer.d.ts.map