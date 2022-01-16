import { BitFlags, GeodesicResampler, GeoProjection, PathStream } from 'msfssdk';
import { MapAbstractFlightPlanPathRenderer } from 'msfssdk/components/map';
import { LegDefinition, FlightPlan, LegDefinitionFlags } from 'msfssdk/flightplan';
import { LegType } from 'msfssdk/navigation';
import { MapDefaultBaseRouteFlightPlanPathRenderer } from '../../../../Shared/Map/MapDefaultFlightPlanPathRenderer';
import { MapFlightPlanHoldLegPathRenderer, MapFlightPlanLegLineRenderer, MapFlightPlanVtfLegPathRenderer } from '../../../../Shared/Map/MapFlightPlanLegPathRenderers';

/**
 * The full-route renderer for procedure preview flight plan paths. Renders all flight path vectors within flight plan
 * legs, including transition vectors, with support for different styles for procedure and transition previews.
 */
export class MFDProcMapFullRouteFlightPlanPathRenderer extends MapAbstractFlightPlanPathRenderer<[isProcedure: boolean]> {
  private static readonly PROCEDURE_STROKE_WIDTH = 4;
  private static readonly PROCEDURE_STROKE_COLOR = 'white';
  private static readonly TRANSITION_STROKE_WIDTH = 2;
  private static readonly TRANSITION_STROKE_COLOR = '#666666';
  private static readonly MISSED_APPROACH_STROKE_WIDTH = 1;
  private static readonly MISSED_APPROACH_STROKE_COLOR = 'white';

  private readonly lineRenderer: MapFlightPlanLegLineRenderer;
  private readonly holdRenderer: MapFlightPlanHoldLegPathRenderer;
  private readonly vtfRenderer: MapFlightPlanVtfLegPathRenderer;

  /**
   * Constructor.
   * @param resampler The geodesic resampler used by this renderer.
   */
  constructor(resampler: GeodesicResampler) {
    super();

    this.lineRenderer = new MapFlightPlanLegLineRenderer(resampler);
    this.holdRenderer = new MapFlightPlanHoldLegPathRenderer(resampler);
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
    isProcedure: boolean
  ): void {
    let width, style;

    if (BitFlags.isAny(leg.flags, LegDefinitionFlags.MissedApproach)) {
      width = MFDProcMapFullRouteFlightPlanPathRenderer.MISSED_APPROACH_STROKE_WIDTH;
      style = MFDProcMapFullRouteFlightPlanPathRenderer.MISSED_APPROACH_STROKE_COLOR;
    } else if (isProcedure) {
      width = MFDProcMapFullRouteFlightPlanPathRenderer.PROCEDURE_STROKE_WIDTH;
      style = MFDProcMapFullRouteFlightPlanPathRenderer.PROCEDURE_STROKE_COLOR;
    } else {
      width = MFDProcMapFullRouteFlightPlanPathRenderer.TRANSITION_STROKE_WIDTH;
      style = MFDProcMapFullRouteFlightPlanPathRenderer.TRANSITION_STROKE_COLOR;
    }

    if (leg.leg.type === LegType.HM || leg.leg.type === LegType.HF || leg.leg.type === LegType.HA) {
      this.holdRenderer.render(leg, projection, context, stream, plan, undefined, legIndex, -1, undefined);
    } else if (BitFlags.isAny(leg.flags, LegDefinitionFlags.VectorsToFinal) && leg.leg.type === LegType.CF) {
      this.vtfRenderer.render(leg, projection, context, stream, width, style);
    } else {
      this.lineRenderer.render(leg, projection, context, stream, false, false, width, style);
    }
  }
}

/**
 * Renders procedure preview flight plan paths.
 */
export class MFDProcMapFlightPlanPathRenderer {
  private readonly baseRouteRenderer: MapDefaultBaseRouteFlightPlanPathRenderer;
  private readonly fullRouteRenderer: MFDProcMapFullRouteFlightPlanPathRenderer;

  /**
   * Constructor.
   * @param resampler The geodesic resampler used by this renderer.
   */
  constructor(resampler: GeodesicResampler) {
    this.baseRouteRenderer = new MapDefaultBaseRouteFlightPlanPathRenderer(resampler);
    this.fullRouteRenderer = new MFDProcMapFullRouteFlightPlanPathRenderer(resampler);
  }

  /**
   * Renders a flight plan to a canvas.
   * @param plan The flight plan to render.
   * @param projection The projection to use for rendering.
   * @param context The canvas 2D rendering context to which to render.
   * @param stream The path stream to which to render.
   * @param isProcedure Whether the rendered plan contains the primary previewed procedure.
   */
  public render(
    plan: FlightPlan,
    projection: GeoProjection,
    context: CanvasRenderingContext2D,
    stream: PathStream,
    isProcedure: boolean
  ): void {
    this.baseRouteRenderer.render(plan, undefined, undefined, projection, context, stream);
    this.fullRouteRenderer.render(plan, undefined, undefined, projection, context, stream, isProcedure);
  }
}