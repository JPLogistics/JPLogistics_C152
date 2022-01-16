import { GeoProjection, PathStream } from '../..';
import { FlightPlan, LegDefinition } from '../../flightplan';
/**
 * Rendering order of flight plan legs.
 */
export declare type MapAbstractFlightPlanPathRendererRenderOrder = 'forward' | 'reverse';
/**
 * Renders flight plan paths one leg at a time in either forward or reverse order. Optionally forces the rendering of
 * the active flight plan leg to be last.
 */
export declare abstract class MapAbstractFlightPlanPathRenderer<Args extends any[] = []> {
    protected readonly renderOrder: MapAbstractFlightPlanPathRendererRenderOrder;
    protected readonly renderActiveLegLast: boolean;
    /**
     * Constructor.
     * @param renderOrder The order which this renderer renders the flight plan legs. Forward order renders the legs in
     * a first-to-last fashion. Reverse order renders the legs in a last-to-first fashion. Defaults to forward.
     * @param renderActiveLegLast Whether to render the active leg last. Defaults to true.
     */
    constructor(renderOrder?: MapAbstractFlightPlanPathRendererRenderOrder, renderActiveLegLast?: boolean);
    /**
     * Renders a flight plan path to a canvas.
     * @param plan The flight plan to render.
     * @param startIndex The global index of the first flight plan leg to render, inclusive. Defaults to `0`.
     * @param endIndex The global index of the last flight plan leg to render, inclusive. Defaults to `plan.length - 1`.
     * @param projection The projection to use for rendering.
     * @param context The canvas 2D rendering context to which to render.
     * @param stream The path stream to which to render.
     * @param args Additional arguments.
     */
    render(plan: FlightPlan, startIndex: number | undefined, endIndex: number | undefined, projection: GeoProjection, context: CanvasRenderingContext2D, stream: PathStream, ...args: Args): void;
    /**
     * Renders a flight plan leg.
     * @param leg The flight plan leg to render.
     * @param plan The flight plan containing the leg to render.
     * @param activeLeg The active leg in the flight plan.
     * @param legIndex The global index of the leg in its flight plan.
     * @param activeLegIndex The global index of the active flight plan leg.
     * @param projection The map projection to use when rendering.
     * @param context The canvas 2D rendering context to which to render.
     * @param stream The path stream to which to render.
     */
    protected abstract renderLeg(leg: LegDefinition, plan: FlightPlan, activeLeg: LegDefinition | undefined, legIndex: number, activeLegIndex: number, projection: GeoProjection, context: CanvasRenderingContext2D, stream: PathStream, ...args: Args): void;
}
//# sourceMappingURL=MapAbstractFlightPlanPathRenderer.d.ts.map