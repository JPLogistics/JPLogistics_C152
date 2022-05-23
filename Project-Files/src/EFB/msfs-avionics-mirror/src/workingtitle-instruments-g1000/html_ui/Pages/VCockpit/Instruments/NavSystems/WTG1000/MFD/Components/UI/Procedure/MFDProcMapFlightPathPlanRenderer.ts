import { BitFlags } from 'msfssdk';
import { AbstractFlightPathPlanRenderer, FlightPathLegRenderPart, GeoProjectionPathStreamStack } from 'msfssdk/components/map';
import { LegDefinition, FlightPlan, LegDefinitionFlags } from 'msfssdk/flightplan';
import { LegType } from 'msfssdk/navigation';
import { DefaultBaseFlightPathPlanRenderer } from '../../../../Shared/Map/MapDefaultFlightPathPlanRenderer';
import { FlightPathHoldLegRenderer, FlightPathLegContinuousLineRenderer, FlightPathProcTurnLegRenderer, FlightPathVtfLegRenderer } from '../../../../Shared/Map/MapFlightPathLegRenderers';
import { MapFlightPathStyles } from '../../../../Shared/Map/MapFlightPathStyles';

/**
 * The full-route renderer for procedure preview flight plan paths. Renders all flight path vectors within flight plan
 * legs, including transition vectors, with support for different styles for procedure and transition previews.
 */
export class MFDProcMapFullFlightPathPlanRenderer extends AbstractFlightPathPlanRenderer<[isProcedure: boolean]> {
  private readonly lineRenderer = new FlightPathLegContinuousLineRenderer();
  private readonly holdRenderer = new FlightPathHoldLegRenderer();
  private readonly procTurnRenderer = new FlightPathProcTurnLegRenderer();
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
    isProcedure: boolean
  ): void {
    let width, style;

    if (BitFlags.isAny(leg.flags, LegDefinitionFlags.MissedApproach)) {
      width = MapFlightPathStyles.MISSED_APPROACH_STROKE_WIDTH;
      style = MapFlightPathStyles.MISSED_APPROACH_STROKE_COLOR;
    } else if (isProcedure) {
      width = MapFlightPathStyles.STROKE_WIDTH;
      style = MapFlightPathStyles.STROKE_COLOR;
    } else {
      width = MapFlightPathStyles.TRANSITION_STROKE_WIDTH;
      style = MapFlightPathStyles.TRANSITION_STROKE_COLOR;
    }

    switch (leg.leg.type) {
      case LegType.HF:
      case LegType.HM:
      case LegType.HA:
        if (isProcedure) {
          this.holdRenderer.render(leg, context, streamStack, plan, activeLeg, legIndex, -1, undefined);
        } else {
          this.lineRenderer.render(leg, context, streamStack, FlightPathLegRenderPart.Base, width, style);
        }
        break;
      case LegType.PI:
        this.procTurnRenderer.render(leg, context, streamStack, plan, activeLeg, legIndex, -1);
        break;
      case LegType.CF:
        if (BitFlags.isAll(leg.flags, LegDefinitionFlags.VectorsToFinal)) {
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
 * Renders procedure preview flight plan paths.
 */
export class MFDProcMapFlightPathPlanRenderer {
  private readonly baseRouteRenderer = new DefaultBaseFlightPathPlanRenderer();
  private readonly fullRouteRenderer = new MFDProcMapFullFlightPathPlanRenderer();

  /**
   * Renders a procedure preview flight plan to a canvas.
   * @param plan The flight plan to render.
   * @param context The canvas 2D rendering context to which to render.
   * @param streamStack The path stream stack to which to render.
   * @param isProcedure Whether the rendered plan contains the primary previewed procedure.
   */
  public render(
    plan: FlightPlan,
    context: CanvasRenderingContext2D,
    streamStack: GeoProjectionPathStreamStack,
    isProcedure: boolean
  ): void {
    this.baseRouteRenderer.render(plan, undefined, undefined, context, streamStack);
    this.fullRouteRenderer.render(plan, undefined, undefined, context, streamStack, isProcedure);
  }
}