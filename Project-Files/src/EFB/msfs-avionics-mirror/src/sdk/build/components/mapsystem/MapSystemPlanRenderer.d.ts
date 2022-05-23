import { CircleVector, FlightPlan, LegDefinition } from '../../flightplan';
import { AbstractFlightPathLegRenderer, AbstractFlightPathPlanRenderer, FlightPathPlanRenderOrder, FlightPathVectorLineRenderer, GeoProjectionPathStreamStack } from '../map';
/**
 * A handler that takes some leg data and returns the appropriate flight path rendering style.
 */
export declare type LegStyleHandler = (plan: FlightPlan, leg: LegDefinition, activeLeg: LegDefinition | undefined, legIndex: number, activeLegIndex: number) => FlightPathRenderStyle;
/**
 * A handler that takes some leg data and returns the waypoint rendering role that the
 * waypoint should be rendered under.
 */
export declare type LegWaypointHandler = (plan: FlightPlan, leg: LegDefinition, activeLeg: LegDefinition | null, legIndex: number, activeLegIndex: number) => number;
/**
 * A map flight plan renderer that can be supplied styling from the outside.
 */
export declare class MapSystemPlanRenderer extends AbstractFlightPathPlanRenderer {
    defaultRoleId: number;
    /**
     * Creates an instance of the MapSystemPlanRenderer.
     * @param defaultRoleId The default role ID to render the plan waypoints under.
     * @param renderOrder The order which this renderer renders the flight plan legs. Forward order renders the legs in a first-to-last
     * fashion. Reverse order renders the legs in a last-to-first fashion. Defaults to forward.
     * @param renderActiveLegLast Whether to render the active leg last. Defaults to true.
     */
    constructor(defaultRoleId: number, renderOrder?: FlightPathPlanRenderOrder, renderActiveLegLast?: boolean);
    protected readonly legRenderer: MapSystemLegRenderer;
    /**
     * A handler that returns a leg rendering style for a given set of leg data.
     * @returns A leg rendering style.
     */
    readonly legStyleHandlers: Map<number, LegStyleHandler>;
    /**
     * A handler that returns whether or not a leg waypoint should be displayed.
     * @returns Whether or not the leg should be displayed.
     */
    readonly legWaypointHandlers: Map<number, LegWaypointHandler>;
    /** Whether or not to render flight path ingress turns. */
    renderIngress: boolean;
    /** Whether or not to render flight path egress turns. */
    renderEgress: boolean;
    /** @inheritdoc */
    protected renderLeg(leg: LegDefinition, plan: FlightPlan, activeLeg: LegDefinition | undefined, legIndex: number, activeLegIndex: number, context: CanvasRenderingContext2D, streamStack: GeoProjectionPathStreamStack): void;
}
/**
 * A map system flight plan leg renderer that uses a swappable style.
 */
export declare class MapSystemLegRenderer extends AbstractFlightPathLegRenderer {
    protected readonly vectorRenderer: FlightPathVectorLineRenderer;
    currentRenderStyle: FlightPathRenderStyle;
    /** @inheritdoc */
    protected renderVector(vector: CircleVector, isIngress: boolean, isEgress: boolean, leg: LegDefinition, context: CanvasRenderingContext2D, streamStack: GeoProjectionPathStreamStack): void;
}
/**
 * A vector line rendering style to apply to a flight path display on the map.
 */
export declare class FlightPathRenderStyle {
    isDisplayed: boolean;
    /**
     * Creates an instance of a FlightPathRenderStyle.
     * @param isDisplayed Whether or not the path is displayed.
     */
    constructor(isDisplayed?: boolean);
    /** The pixel width of the path line. */
    width: number;
    /** The style string for the line. */
    style: string;
    /** A dash-array configuration for the line, if any. */
    dash?: number[];
    /** The default rendering style. */
    static readonly Default: FlightPathRenderStyle;
    /** A style that does not display the path. */
    static readonly Hidden: FlightPathRenderStyle;
}
//# sourceMappingURL=MapSystemPlanRenderer.d.ts.map