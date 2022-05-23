import { BitFlags, GeodesicResampler, GeoProjection, PathStream } from 'msfssdk';
import { MapAbstractFlightPlanPathRenderer } from 'msfssdk/components/map';
import { LegDefinition, FlightPlan, LegDefinitionFlags } from 'msfssdk/flightplan';
import { LegType } from 'msfssdk/navigation';
import { LNavData } from '../autopilot/directors/LNavDirector';
import { FmsUtils } from '../FlightPlan/FmsUtils';
import { MapFlightPlanDirectToCourseLegPathRenderer, MapFlightPlanHoldLegPathRenderer, MapFlightPlanLegLineRenderer, MapFlightPlanObsLegPathRenderer, MapFlightPlanVtfLegPathRenderer } from './MapFlightPlanLegPathRenderers';

/**
 * LNav data used by MapDefaultFlightPlanPathRenderer.
 */
export type MapDefaultFlightPlanPathRendererLNavData = Pick<LNavData, 'currentLegIndex' | 'vectorIndex' | 'transitionMode' | 'isSuspended'>;

/**
 * The default base-route flight plan renderer for G1000 maps. Only renders non-transition flight path vectors within
 * flight plan legs.
 */
export class MapDefaultBaseRouteFlightPlanPathRenderer extends MapAbstractFlightPlanPathRenderer {
  private static readonly STROKE_WIDTH = 2;
  private static readonly STROKE_COLOR = 'rgba(204, 204, 204, 0.5)';

  private readonly lineRenderer: MapFlightPlanLegLineRenderer;
  private readonly dtoCourseRenderer: MapFlightPlanDirectToCourseLegPathRenderer;
  private readonly vtfRenderer: MapFlightPlanVtfLegPathRenderer;

  /**
   * Constructor.
   * @param resampler The geodesic resampler used by this renderer.
   */
  constructor(resampler: GeodesicResampler) {
    super();

    this.lineRenderer = new MapFlightPlanLegLineRenderer(resampler);
    this.dtoCourseRenderer = new MapFlightPlanDirectToCourseLegPathRenderer(resampler);
    this.vtfRenderer = new MapFlightPlanVtfLegPathRenderer(resampler);
  }

  /** @inheritdoc */
  protected renderLeg(
    leg: LegDefinition,
    plan: FlightPlan,
    activeLeg: LegDefinition | undefined,
    legIndex: number,
    activeLegIndex: number,
    projection: GeoProjection,
    context: CanvasRenderingContext2D,
    stream: PathStream
  ): void {
    if (!BitFlags.isAll(leg.flags, LegDefinitionFlags.DirectTo) || legIndex === activeLegIndex) {
      if (BitFlags.isAll(leg.flags, LegDefinitionFlags.DirectTo) && leg.leg.type === LegType.CF) {
        this.dtoCourseRenderer.render(
          leg, projection, context, stream,
          MapDefaultBaseRouteFlightPlanPathRenderer.STROKE_WIDTH, MapDefaultBaseRouteFlightPlanPathRenderer.STROKE_COLOR
        );
      } else if (BitFlags.isAny(leg.flags, LegDefinitionFlags.VectorsToFinal) && leg.leg.type === LegType.CF) {
        this.vtfRenderer.render(
          leg, projection, context, stream,
          MapDefaultBaseRouteFlightPlanPathRenderer.STROKE_WIDTH, MapDefaultBaseRouteFlightPlanPathRenderer.STROKE_COLOR
        );
      } else {
        this.lineRenderer.render(
          leg, projection, context, stream,
          true, true,
          MapDefaultBaseRouteFlightPlanPathRenderer.STROKE_WIDTH, MapDefaultBaseRouteFlightPlanPathRenderer.STROKE_COLOR
        );
      }
    }
  }
}

/**
 * The default full-route flight plan renderer for G1000 maps. Renders all flight path vectors within flight plan legs,
 * including transition vectors.
 */
export class MapDefaultFullRouteFlightPlanPathRenderer
  extends MapAbstractFlightPlanPathRenderer<[lnavData: MapDefaultFlightPlanPathRendererLNavData | undefined, isMissedApproachActive: boolean]> {

  private static readonly STROKE_WIDTH = 4;
  private static readonly STROKE_COLOR = 'white';
  private static readonly ACTIVE_STROKE_WIDTH = 4;
  private static readonly ACTIVE_STROKE_COLOR = 'magenta';
  private static readonly PRIOR_STROKE_WIDTH = 2;
  private static readonly PRIOR_STROKE_COLOR = '#cccccc';
  private static readonly MISSED_APPROACH_STROKE_WIDTH = 1;
  private static readonly MISSED_APPROACH_STROKE_COLOR = 'white';

  private readonly lineRenderer: MapFlightPlanLegLineRenderer;
  private readonly holdRenderer: MapFlightPlanHoldLegPathRenderer;
  private readonly dtoCourseRenderer: MapFlightPlanDirectToCourseLegPathRenderer;
  private readonly vtfRenderer: MapFlightPlanVtfLegPathRenderer;

  /**
   * Constructor.
   * @param resampler The geodesic resampler used by this renderer.
   */
  constructor(resampler: GeodesicResampler) {
    super();

    this.lineRenderer = new MapFlightPlanLegLineRenderer(resampler);
    this.holdRenderer = new MapFlightPlanHoldLegPathRenderer(resampler);
    this.dtoCourseRenderer = new MapFlightPlanDirectToCourseLegPathRenderer(resampler);
    this.vtfRenderer = new MapFlightPlanVtfLegPathRenderer(resampler);
  }

  /** @inheritdoc */
  protected renderLeg(
    leg: LegDefinition,
    plan: FlightPlan,
    activeLeg: LegDefinition | undefined,
    legIndex: number,
    activeLegIndex: number,
    projection: GeoProjection,
    context: CanvasRenderingContext2D,
    stream: PathStream,
    lnavData: LNavData | undefined,
    isMissedApproachActive: boolean
  ): void {
    let width, style;

    if (legIndex === activeLegIndex) {
      width = MapDefaultFullRouteFlightPlanPathRenderer.ACTIVE_STROKE_WIDTH;
      style = MapDefaultFullRouteFlightPlanPathRenderer.ACTIVE_STROKE_COLOR;
    } else if (legIndex < activeLegIndex) {
      width = MapDefaultFullRouteFlightPlanPathRenderer.PRIOR_STROKE_WIDTH;
      style = MapDefaultFullRouteFlightPlanPathRenderer.PRIOR_STROKE_COLOR;
    } else if (!isMissedApproachActive && BitFlags.isAny(leg.flags, LegDefinitionFlags.MissedApproach)) {
      width = MapDefaultFullRouteFlightPlanPathRenderer.MISSED_APPROACH_STROKE_WIDTH;
      style = MapDefaultFullRouteFlightPlanPathRenderer.MISSED_APPROACH_STROKE_COLOR;
    } else {
      width = MapDefaultFullRouteFlightPlanPathRenderer.STROKE_WIDTH;
      style = MapDefaultFullRouteFlightPlanPathRenderer.STROKE_COLOR;
    }

    if (leg.leg.type === LegType.HM || leg.leg.type === LegType.HF || leg.leg.type === LegType.HA) {
      this.holdRenderer.render(leg, projection, context, stream, plan, activeLeg, legIndex, activeLegIndex, lnavData);
    } else if (BitFlags.isAll(leg.flags, LegDefinitionFlags.DirectTo) && leg.leg.type === LegType.CF) {
      this.dtoCourseRenderer.render(leg, projection, context, stream, width, style);
    } else if (BitFlags.isAll(leg.flags, LegDefinitionFlags.VectorsToFinal) && leg.leg.type === LegType.CF) {
      this.vtfRenderer.render(leg, projection, context, stream, width, style);
    } else {
      this.lineRenderer.render(leg, projection, context, stream, false, false, width, style);
    }
  }
}

/**
 * The default flight plan renderer for G1000 maps.
 */
export class MapDefaultFlightPlanPathRenderer {
  private readonly baseRouteRenderer: MapDefaultBaseRouteFlightPlanPathRenderer;
  private readonly fullRouteRenderer: MapDefaultFullRouteFlightPlanPathRenderer;
  private readonly obsRenderer: MapFlightPlanObsLegPathRenderer;

  /**
   * Constructor.
   * @param resampler The geodesic resampler used by this renderer.
   */
  constructor(resampler: GeodesicResampler) {
    this.baseRouteRenderer = new MapDefaultBaseRouteFlightPlanPathRenderer(resampler);
    this.fullRouteRenderer = new MapDefaultFullRouteFlightPlanPathRenderer(resampler);
    this.obsRenderer = new MapFlightPlanObsLegPathRenderer(resampler);
  }

  /**
   * Renders a flight plan to a canvas.
   * @param plan The flight plan to render.
   * @param projection The projection to use for rendering.
   * @param context The canvas 2D rendering context to which to render.
   * @param stream The path stream to which to render.
   * @param renderEntirePlan Whether to render the entire plan. If false, only the active leg and legs after the active
   * leg will be rendered.
   * @param activeLegIndex The global index of the active flight plan leg, or -1 if there is no active leg.
   * @param lnavData LNAV tracking data for the flight plan to render, or undefined if LNAV is not tracking the flight
   * plan.
   * @param obsCourse The active OBS course, or undefined if OBS is not active.
   */
  public render(
    plan: FlightPlan,
    projection: GeoProjection,
    context: CanvasRenderingContext2D,
    stream: PathStream,
    renderEntirePlan: boolean,
    activeLegIndex: number,
    lnavData: MapDefaultFlightPlanPathRendererLNavData | undefined,
    obsCourse: number | undefined
  ): void {
    const isObsActive = obsCourse !== undefined;

    const baseRouteStartIndex = this.getBaseRouteStartIndex(plan, renderEntirePlan, activeLegIndex, isObsActive);
    this.baseRouteRenderer.render(plan, baseRouteStartIndex, undefined, projection, context, stream);

    if (isObsActive) {
      this.obsRenderer.render(plan.getLeg(activeLegIndex), projection, context, stream, obsCourse);
    } else {
      const fullRouteStartIndex = this.getFullRouteStartIndex(plan, renderEntirePlan, activeLegIndex);
      const isMissedApproachActive = activeLegIndex >= 0
        && activeLegIndex < plan.length
        && BitFlags.isAny(plan.getLeg(activeLegIndex).flags, LegDefinitionFlags.MissedApproach);
      this.fullRouteRenderer.render(plan, fullRouteStartIndex, undefined, projection, context, stream, lnavData, isMissedApproachActive);
    }
  }

  /**
   * Gets the global index of the first leg for which to render the base route.
   * @param plan The flight plan to render.
   * @param renderEntirePlan Whether to render the entire plan.
   * @param activeLegIndex The global index of the active flight plan leg, or -1 if there is no active leg.
   * @param isObsActive Whether OBS is active.
   * @returns The global index of the first leg for which to render the base route.
   */
  private getBaseRouteStartIndex(plan: FlightPlan, renderEntirePlan: boolean, activeLegIndex: number, isObsActive: boolean): number {
    if (renderEntirePlan) {
      return 0;
    }

    if (activeLegIndex < 0) {
      return plan.length;
    }

    if (isObsActive) {
      return activeLegIndex;
    }

    return Math.max(0, this.getActiveFromLegIndex(plan, activeLegIndex));
  }

  /**
   * Gets the global index of the first leg for which to render the full route.
   * @param plan The flight plan to render.
   * @param renderEntirePlan Whether to render the entire plan.
   * @param activeLegIndex The global index of the active flight plan leg, or -1 if there is no active leg.
   * @returns The global index of the first leg for which to render the full route.
   */
  private getFullRouteStartIndex(plan: FlightPlan, renderEntirePlan: boolean, activeLegIndex: number): number {
    if (renderEntirePlan) {
      return 0;
    }

    if (activeLegIndex < 0) {
      return plan.length;
    }

    return Math.max(0, this.getActiveFromLegIndex(plan, activeLegIndex));
  }

  /**
   * Gets the global index of the leg from which the active leg of a flight plan originates.
   * @param plan A flight plan.
   * @param activeLegIndex The global index of the active flight plan leg.
   * @returns The global index of the leg from which the active leg originates, or -1 if one could not be found.
   */
  private getActiveFromLegIndex(plan: FlightPlan, activeLegIndex: number): number {
    const activeLeg = plan.tryGetLeg(activeLegIndex);

    if (!activeLeg) {
      return -1;
    }

    const segmentIndex = plan.getSegmentIndex(activeLegIndex);
    const segmentLegIndex = activeLegIndex - plan.getSegment(segmentIndex).offset;

    return FmsUtils.getNominalFromLegIndex(plan, segmentIndex, segmentLegIndex);
  }
}