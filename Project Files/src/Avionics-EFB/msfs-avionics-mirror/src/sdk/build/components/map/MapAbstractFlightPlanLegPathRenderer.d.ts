import { GeoCircle, GeoPoint, GeoProjection, PathStream } from '../..';
import { FlightPathVector, LegDefinition } from '../../flightplan';
/**
 * Renders flight plan leg paths one vector at a time, optionally excluding the ingress and/or egress transition
 * vectors.
 */
export declare abstract class MapAbstractFlightPlanLegPathRenderer<Args extends any[] = []> {
    protected static readonly geoPointCache: GeoPoint[];
    protected static readonly geoCircleCache: GeoCircle[];
    protected readonly tempVector: import("../..").CircleVector;
    /**
     * Renders a flight plan leg path to a canvas.
     * @param leg The flight plan leg to render.
     * @param projection The projection to use for rendering.
     * @param context The canvas 2D rendering context to which to render.
     * @param stream The path stream to which to render.
     * @param excludeIngress Whether to exclude the ingress transition vectors.
     * @param excludeEgress Whether to exclude the egress transition vectors.
     * @param args Additional arguments.
     */
    render(leg: LegDefinition, projection: GeoProjection, context: CanvasRenderingContext2D, stream: PathStream, excludeIngress: boolean, excludeEgress: boolean, ...args: Args): void;
    /**
     * Renders a flight path vector.
     * @param vector The flight path vector to render.
     * @param isIngress Whether the vector is part of the ingress transition.
     * @param isEgress Whether the vector is part of the egress transition.
     * @param leg The flight plan leg containing the vector to render.
     * @param projection The map projection to use when rendering.
     * @param context The canvas 2D rendering context to which to render.
     * @param stream The path stream to which to render.
     */
    protected abstract renderVector(vector: FlightPathVector, isIngress: boolean, isEgress: boolean, leg: LegDefinition, projection: GeoProjection, context: CanvasRenderingContext2D, stream: PathStream, ...args: Args): void;
}
//# sourceMappingURL=MapAbstractFlightPlanLegPathRenderer.d.ts.map