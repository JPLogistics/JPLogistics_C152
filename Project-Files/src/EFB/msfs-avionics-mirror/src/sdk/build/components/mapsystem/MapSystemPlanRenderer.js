import { FlightPathLegRenderPart, AbstractFlightPathLegRenderer, AbstractFlightPathPlanRenderer, FlightPathVectorLineRenderer } from '../map';
/**
 * A map flight plan renderer that can be supplied styling from the outside.
 */
export class MapSystemPlanRenderer extends AbstractFlightPathPlanRenderer {
    /**
     * Creates an instance of the MapSystemPlanRenderer.
     * @param defaultRoleId The default role ID to render the plan waypoints under.
     * @param renderOrder The order which this renderer renders the flight plan legs. Forward order renders the legs in a first-to-last
     * fashion. Reverse order renders the legs in a last-to-first fashion. Defaults to forward.
     * @param renderActiveLegLast Whether to render the active leg last. Defaults to true.
     */
    constructor(defaultRoleId, renderOrder, renderActiveLegLast) {
        super(renderOrder, renderActiveLegLast);
        this.defaultRoleId = defaultRoleId;
        this.legRenderer = new MapSystemLegRenderer();
        /**
         * A handler that returns a leg rendering style for a given set of leg data.
         * @returns A leg rendering style.
         */
        this.legStyleHandlers = new Map();
        /**
         * A handler that returns whether or not a leg waypoint should be displayed.
         * @returns Whether or not the leg should be displayed.
         */
        this.legWaypointHandlers = new Map();
        /** Whether or not to render flight path ingress turns. */
        this.renderIngress = false;
        /** Whether or not to render flight path egress turns. */
        this.renderEgress = false;
    }
    /** @inheritdoc */
    renderLeg(leg, plan, activeLeg, legIndex, activeLegIndex, context, streamStack) {
        this.legRenderer.currentRenderStyle = FlightPathRenderStyle.Default;
        const handler = this.legStyleHandlers.get(plan.planIndex);
        if (handler !== undefined) {
            this.legRenderer.currentRenderStyle = handler(plan, leg, activeLeg, legIndex, activeLegIndex);
        }
        const partsToRender = FlightPathLegRenderPart.Base
            | (this.renderIngress ? FlightPathLegRenderPart.Ingress : 0)
            | (this.renderEgress ? FlightPathLegRenderPart.Egress : 0);
        this.legRenderer.render(leg, context, streamStack, partsToRender);
    }
}
/**
 * A map system flight plan leg renderer that uses a swappable style.
 */
export class MapSystemLegRenderer extends AbstractFlightPathLegRenderer {
    constructor() {
        super(...arguments);
        this.vectorRenderer = new FlightPathVectorLineRenderer();
        this.currentRenderStyle = new FlightPathRenderStyle();
    }
    /** @inheritdoc */
    renderVector(vector, isIngress, isEgress, leg, context, streamStack) {
        if (this.currentRenderStyle.isDisplayed) {
            this.vectorRenderer.render(vector, context, streamStack, this.currentRenderStyle.width, this.currentRenderStyle.style, this.currentRenderStyle.dash);
        }
    }
}
/**
 * A vector line rendering style to apply to a flight path display on the map.
 */
export class FlightPathRenderStyle {
    /**
     * Creates an instance of a FlightPathRenderStyle.
     * @param isDisplayed Whether or not the path is displayed.
     */
    constructor(isDisplayed = true) {
        this.isDisplayed = isDisplayed;
        /** The pixel width of the path line. */
        this.width = 3;
        /** The style string for the line. */
        this.style = '';
    }
}
/** The default rendering style. */
FlightPathRenderStyle.Default = new FlightPathRenderStyle();
/** A style that does not display the path. */
FlightPathRenderStyle.Hidden = new FlightPathRenderStyle(false);
