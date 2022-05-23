import { BitFlags } from 'msfssdk';
import { AbstractFlightPathPlanRenderer, FlightPathLegRenderPart, GeoProjectionPathStreamStack } from 'msfssdk/components/map';
import { LegDefinition, FlightPlan, LegDefinitionFlags } from 'msfssdk/flightplan';
import { LegType } from 'msfssdk/navigation';
import { FmsUtils } from 'garminsdk/flightplan';
import { LNavTransitionMode } from 'msfssdk/autopilot';
import {
  FlightPathDirectToCourseLegRenderer, FlightPathHoldLegRenderer, FlightPathLegContinuousLineRenderer,
  FlightPathObsLegRenderer, FlightPathProcTurnLegRenderer, FlightPathVtfLegRenderer
} from './MapFlightPathLegRenderers';
import { MapFlightPathStyles } from './MapFlightPathStyles';

/**
 * LNav data used by MapDefaultFlightPlanPathRenderer.
 */
export type DefaultFlightPathPlanRendererLNavData = {
  /** The global leg index of the currently tracked flight plan leg. */
  currentLegIndex: number;

  /** The index of the currently tracked flight path vector. */
  vectorIndex: number;

  /** The currently active LNAV transition mode. */
  transitionMode: LNavTransitionMode;

  /** Whether LNAV sequencing is suspended. */
  isSuspended: boolean;
};

/**
 * The default base-route flight plan renderer for G1000 maps. Only renders non-transition flight path vectors within
 * flight plan legs.
 */
export class DefaultBaseFlightPathPlanRenderer extends AbstractFlightPathPlanRenderer {
  private readonly lineRenderer = new FlightPathLegContinuousLineRenderer();
  private readonly dtoCourseRenderer = new FlightPathDirectToCourseLegRenderer();
  private readonly vtfRenderer = new FlightPathVtfLegRenderer();

  /** @inheritdoc */
  protected renderLeg(
    leg: LegDefinition,
    plan: FlightPlan,
    activeLeg: LegDefinition | undefined,
    legIndex: number,
    activeLegIndex: number,
    context: CanvasRenderingContext2D,
    streamStack: GeoProjectionPathStreamStack
  ): void {
    if (!BitFlags.isAll(leg.flags, LegDefinitionFlags.DirectTo) || legIndex === activeLegIndex) {
      switch (leg.leg.type) {
        case LegType.HF:
        case LegType.HM:
        case LegType.HA:
        case LegType.PI:
          break;
        case LegType.CF:
          if (BitFlags.isAll(leg.flags, LegDefinitionFlags.DirectTo)) {
            this.dtoCourseRenderer.render(
              leg, context, streamStack,
              MapFlightPathStyles.BASE_STROKE_WIDTH, MapFlightPathStyles.BASE_STROKE_COLOR
            );
            break;
          } else if (BitFlags.isAny(leg.flags, LegDefinitionFlags.VectorsToFinal)) {
            this.vtfRenderer.render(
              leg, context, streamStack,
              MapFlightPathStyles.BASE_STROKE_WIDTH, MapFlightPathStyles.BASE_STROKE_COLOR
            );
            break;
          }
        // eslint-disable-next-line no-fallthrough
        default:
          this.lineRenderer.render(
            leg, context, streamStack,
            FlightPathLegRenderPart.Base,
            MapFlightPathStyles.BASE_STROKE_WIDTH, MapFlightPathStyles.BASE_STROKE_COLOR
          );
      }
    }
  }
}

/**
 * The default full-route flight plan renderer for G1000 maps. Renders all flight path vectors within flight plan legs,
 * including transition vectors.
 */
export class DefaultFullFlightPathPlanRenderer
  extends AbstractFlightPathPlanRenderer<[lnavData: DefaultFlightPathPlanRendererLNavData | undefined, isMissedApproachActive: boolean]> {

  private readonly lineRenderer = new FlightPathLegContinuousLineRenderer();
  private readonly holdRenderer = new FlightPathHoldLegRenderer();
  private readonly procTurnRenderer = new FlightPathProcTurnLegRenderer();
  private readonly dtoCourseRenderer = new FlightPathDirectToCourseLegRenderer();
  private readonly vtfRenderer = new FlightPathVtfLegRenderer();

  /** @inheritdoc */
  protected renderLeg(
    leg: LegDefinition,
    plan: FlightPlan,
    activeLeg: LegDefinition | undefined,
    legIndex: number,
    activeLegIndex: number,
    context: CanvasRenderingContext2D,
    streamStack: GeoProjectionPathStreamStack,
    lnavData: DefaultFlightPathPlanRendererLNavData | undefined,
    isMissedApproachActive: boolean
  ): void {
    let width, style;

    if (legIndex === activeLegIndex) {
      width = MapFlightPathStyles.ACTIVE_STROKE_WIDTH;
      style = MapFlightPathStyles.ACTIVE_STROKE_COLOR;
    } else if (legIndex < activeLegIndex) {
      width = MapFlightPathStyles.PRIOR_STROKE_WIDTH;
      style = MapFlightPathStyles.PRIOR_STROKE_COLOR;
    } else if (!isMissedApproachActive && BitFlags.isAny(leg.flags, LegDefinitionFlags.MissedApproach)) {
      width = MapFlightPathStyles.MISSED_APPROACH_STROKE_WIDTH;
      style = MapFlightPathStyles.MISSED_APPROACH_STROKE_COLOR;
    } else {
      width = MapFlightPathStyles.STROKE_WIDTH;
      style = MapFlightPathStyles.STROKE_COLOR;
    }

    switch (leg.leg.type) {
      case LegType.HF:
      case LegType.HM:
      case LegType.HA:
        this.holdRenderer.render(leg, context, streamStack, plan, activeLeg, legIndex, activeLegIndex, lnavData);
        break;
      case LegType.PI:
        this.procTurnRenderer.render(leg, context, streamStack, plan, activeLeg, legIndex, activeLegIndex);
        break;
      case LegType.CF:
        if (BitFlags.isAll(leg.flags, LegDefinitionFlags.DirectTo)) {
          this.dtoCourseRenderer.render(leg, context, streamStack, width, style);
          break;
        } else if (BitFlags.isAll(leg.flags, LegDefinitionFlags.VectorsToFinal)) {
          this.vtfRenderer.render(leg, context, streamStack, width, style);
          break;
        }
      // eslint-disable-next-line no-fallthrough
      default:
        this.lineRenderer.render(leg, context, streamStack, FlightPathLegRenderPart.All, width, style);
    }
  }
}

/**
 * The default flight plan renderer for G1000 maps.
 */
export class DefaultFlightPathPlanRenderer {
  private readonly baseRouteRenderer = new DefaultBaseFlightPathPlanRenderer();
  private readonly fullRouteRenderer = new DefaultFullFlightPathPlanRenderer();
  private readonly obsRenderer = new FlightPathObsLegRenderer();

  /**
   * Renders a flight plan to a canvas.
   * @param plan The flight plan to render.
   * @param context The canvas 2D rendering context to which to render.
   * @param streamStack The path stream stack to which to render.
   * @param renderEntirePlan Whether to render the entire plan. If false, only the active leg and legs after the active
   * leg will be rendered.
   * @param activeLegIndex The global index of the active flight plan leg, or -1 if there is no active leg.
   * @param lnavData LNAV tracking data for the flight plan to render, or undefined if LNAV is not tracking the flight
   * plan.
   * @param obsCourse The active OBS course, or undefined if OBS is not active.
   */
  public render(
    plan: FlightPlan,
    context: CanvasRenderingContext2D,
    streamStack: GeoProjectionPathStreamStack,
    renderEntirePlan: boolean,
    activeLegIndex: number,
    lnavData: DefaultFlightPathPlanRendererLNavData | undefined,
    obsCourse: number | undefined
  ): void {
    const isObsActive = obsCourse !== undefined;

    const baseRouteStartIndex = this.getBaseRouteStartIndex(plan, renderEntirePlan, activeLegIndex, isObsActive);
    this.baseRouteRenderer.render(plan, baseRouteStartIndex, undefined, context, streamStack);

    if (isObsActive) {
      this.obsRenderer.render(plan.getLeg(activeLegIndex), context, streamStack, obsCourse);
    } else {
      const fullRouteStartIndex = this.getFullRouteStartIndex(plan, renderEntirePlan, activeLegIndex);
      const isMissedApproachActive = activeLegIndex >= 0
        && activeLegIndex < plan.length
        && BitFlags.isAny(plan.getLeg(activeLegIndex).flags, LegDefinitionFlags.MissedApproach);
      this.fullRouteRenderer.render(plan, fullRouteStartIndex, undefined, context, streamStack, lnavData, isMissedApproachActive);
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