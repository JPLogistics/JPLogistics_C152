import { GeoCircle, GeoPoint } from '../..';
import { FlightPathVector, LegDefinition } from '../../flightplan';
import { GeoProjectionPathStreamStack } from './GeoProjectionPathStreamStack';
/**
 * Parts of a flight plan leg path to render.
 */
export declare enum FlightPathLegRenderPart {
    /** None. */
    None = 0,
    /** The ingress transition. */
    Ingress = 1,
    /** The base path. */
    Base = 2,
    /** The egress transition. */
    Egress = 4,
    /** The entire leg path. */
    All = 7
}
/**
 * Renders flight plan leg paths one vector at a time, optionally excluding the ingress and/or egress transition
 * vectors.
 */
export declare abstract class AbstractFlightPathLegRenderer<Args extends any[] = []> {
    protected static readonly geoPointCache: GeoPoint[];
    protected static readonly geoCircleCache: GeoCircle[];
    protected readonly tempVector: import("../../flightplan").CircleVector;
    /**
     * Renders a flight plan leg path to a canvas.
     * @param leg The flight plan leg to render.
     * @param context The canvas 2D rendering context to which to render.
     * @param streamStack The path stream stack to which to render.
     * @param partsToRender The parts of the leg to render, as a combination of {@link FlightPathLegRenderPart}
     * values.
     * @param args Additional arguments.
     */
    render(leg: LegDefinition, context: CanvasRenderingContext2D, streamStack: GeoProjectionPathStreamStack, partsToRender: number, ...args: Args): void;
    /**
     * Renders a flight path vector.
     * @param vector The flight path vector to render.
     * @param isIngress Whether the vector is part of the ingress transition.
     * @param isEgress Whether the vector is part of the egress transition.
     * @param leg The flight plan leg containing the vector to render.
     * @param projection The map projection to use when rendering.
     * @param context The canvas 2D rendering context to which to render.
     * @param streamStack The path stream stack to which to render.
     */
    protected abstract renderVector(vector: FlightPathVector, isIngress: boolean, isEgress: boolean, leg: LegDefinition, context: CanvasRenderingContext2D, streamStack: GeoProjectionPathStreamStack, ...args: Args): void;
}
//# sourceMappingURL=AbstractFlightPathLegRenderer.d.ts.map