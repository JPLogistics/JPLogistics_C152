import { BitFlags, GeoCircle, GeodesicResampler, GeoPoint, GeoProjection, MagVar, PathStream, UnitType } from 'msfssdk';
import { MapAbstractFlightPlanLegPathRenderer, MapFlightPathVectorLineRenderer, MapGeoCircleLineRenderer } from 'msfssdk/components/map';
import { LegDefinition, FlightPlan, CircleVector, LegDefinitionFlags, FlightPathUtils } from 'msfssdk/flightplan';
import { LNavData, TransitionMode } from '../Autopilot/Directors/LNavDirector';

/**
 *
 */
export type MapFlightPlanLegPathLineRendererArgs = [width: number, style: string, dash?: readonly number[]];

/**
 * Renders flight plan legs as a series of lines.
 */
export class MapFlightPlanLegLineRenderer<Args extends MapFlightPlanLegPathLineRendererArgs = MapFlightPlanLegPathLineRendererArgs>
  extends MapAbstractFlightPlanLegPathRenderer<Args> {

  private readonly vectorRenderer: MapFlightPathVectorLineRenderer;

  /**
   * Constructor.
   * @param resampler The geodesic resampler used by this renderer.
   */
  constructor(resampler: GeodesicResampler) {
    super();

    this.vectorRenderer = new MapFlightPathVectorLineRenderer(resampler);
  }

  /** @inheritdoc */
  protected renderVector(
    vector: CircleVector,
    isIngress: boolean,
    isEgress: boolean,
    leg: LegDefinition,
    projection: GeoProjection,
    context: CanvasRenderingContext2D,
    stream: PathStream,
    width: number,
    style: string,
    dash?: readonly number[]
  ): void {
    this.vectorRenderer.render(vector, projection, context, stream, width, style, dash);
  }
}

/**
 * Renders hold legs.
 */
export class MapFlightPlanHoldLegPathRenderer {
  private readonly lineRenderer: MapFlightPlanLegLineRenderer;

  private readonly styles = {
    width: 0,
    style: 'white'
  };

  /**
   * Constructor.
   * @param resampler The geodesic resampler used by this renderer.
   */
  constructor(resampler: GeodesicResampler) {
    this.lineRenderer = new MapFlightPlanLegLineRenderer(resampler);
  }

  /**
   * Renders a hold leg to a canvas.
   * @param leg The leg to render.
   * @param projection The projection to use for rendering.
   * @param context The canvas 2D rendering context to which to render.
   * @param stream The path stream to which to render.
   * @param plan The flight plan containing the leg to render.
   * @param activeLeg The active flight plan leg.
   * @param legIndex The global index of the leg to render.
   * @param activeLegIndex The global index of the active flight plan leg.
   * @param lnavData LNAV tracking data for the flight plan containing the leg to render, or undefined if LNAV is not
   * tracking the flight plan.
   */
  public render(
    leg: LegDefinition,
    projection: GeoProjection,
    context: CanvasRenderingContext2D,
    stream: PathStream,
    plan: FlightPlan,
    activeLeg: LegDefinition | undefined,
    legIndex: number,
    activeLegIndex: number,
    lnavData: LNavData | undefined
  ): void {
    const isMissedApproachActive = !!activeLeg && BitFlags.isAny(activeLeg.flags, LegDefinitionFlags.MissedApproach);

    this.setStyles(leg, plan, activeLeg, legIndex, activeLegIndex, isMissedApproachActive);

    if (legIndex < activeLegIndex || (BitFlags.isAll(leg.flags, LegDefinitionFlags.MissedApproach) && !isMissedApproachActive)) {
      this.lineRenderer.render(leg, projection, context, stream, true, false, this.styles.width, this.styles.style);
    } else if (legIndex > activeLegIndex) {
      this.lineRenderer.render(leg, projection, context, stream, false, false, this.styles.width, this.styles.style);
    } else {
      const inHold = leg.calculated !== undefined && lnavData && lnavData.currentLegIndex === legIndex && lnavData.transitionMode !== TransitionMode.Ingress;

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      if (inHold && !lnavData!.isSuspended) {
        this.lineRenderer.render(leg, projection, context, stream, true, false, this.styles.width, this.styles.style);
      } else if (inHold) {
        this.lineRenderer.render(leg, projection, context, stream, true, true, this.styles.width, this.styles.style);
      } else {
        this.lineRenderer.render(leg, projection, context, stream, false, false, this.styles.width, this.styles.style);
      }
    }
  }

  /**
   * Sets the line stroke styles for a rendered leg.
   * @param leg The leg to render.
   * @param plan The flight plan containing the leg to render.
   * @param activeLeg The active flight plan leg.
   * @param legIndex The global index of the leg to render.
   * @param activeLegIndex The global index of the active flight plan leg.
   * @param isMissedApproachActive Whether the active flight plan leg is in the missed approach sequence.
   */
  private setStyles(
    leg: LegDefinition,
    plan: FlightPlan,
    activeLeg: LegDefinition | undefined,
    legIndex: number,
    activeLegIndex: number,
    isMissedApproachActive: boolean
  ): void {
    if (legIndex === activeLegIndex) {
      this.styles.width = 4;
      this.styles.style = 'magenta';
    } else if (legIndex < activeLegIndex) {
      this.styles.width = 2;
      this.styles.style = 'rgba(204, 204, 204, 0.5)';
    } else if (!isMissedApproachActive && BitFlags.isAny(leg.flags, LegDefinitionFlags.MissedApproach)) {
      this.styles.width = 1;
      this.styles.style = 'white';
    } else {
      this.styles.width = 4;
      this.styles.style = 'white';
    }
  }
}

/**
 * Renders OBS legs. Each leg is rendered as two lines: a magenta 500-nautical mile great-circle path along the OBS
 * course terminating at the end of the leg, and a white 500-nautical mile great-circle path along the OBS course
 * starting at the end of the leg.
 */
export class MapFlightPlanObsLegPathRenderer {
  private static readonly geoPointCache = [new GeoPoint(0, 0), new GeoPoint(0, 0)];
  private static readonly geoCircleCache = [new GeoCircle(new Float64Array(3), 0)];

  private readonly lineRenderer: MapGeoCircleLineRenderer;

  /**
   * Constructor.
   * @param resampler The geodesic resampler used by this renderer.
   */
  constructor(resampler: GeodesicResampler) {
    this.lineRenderer = new MapGeoCircleLineRenderer(resampler);
  }

  /**
   * Renders an OBS leg to a canvas.
   * @param leg The leg to render.
   * @param projection The projection to use for rendering.
   * @param context The canvas 2D rendering context to which to render.
   * @param stream The path stream to which to render.
   * @param course The OBS course, in degrees magnetic.
   */
  public render(
    leg: LegDefinition,
    projection: GeoProjection,
    context: CanvasRenderingContext2D,
    stream: PathStream,
    course: number
  ): void {
    if (leg.calculated?.endLat === undefined || leg.calculated?.endLon === undefined) {
      return;
    }

    const obsFix = MapFlightPlanObsLegPathRenderer.geoPointCache[0].set(leg.calculated.endLat, leg.calculated.endLon);
    const obsLat = obsFix.lat;
    const obsLon = obsFix.lon;

    const obsCourseTrue = MagVar.magneticToTrue(course, obsLat, obsLon);
    const obsPath = MapFlightPlanObsLegPathRenderer.geoCircleCache[0].setAsGreatCircle(obsFix, obsCourseTrue);

    const start = obsPath.offsetDistanceAlong(obsFix, UnitType.NMILE.convertTo(-500, UnitType.GA_RADIAN), MapFlightPlanObsLegPathRenderer.geoPointCache[1]);
    const startLat = start.lat;
    const startLon = start.lon;

    const end = obsPath.offsetDistanceAlong(obsFix, UnitType.NMILE.convertTo(500, UnitType.GA_RADIAN), MapFlightPlanObsLegPathRenderer.geoPointCache[1]);
    const endLat = end.lat;
    const endLon = end.lon;

    this.lineRenderer.render(obsPath, startLat, startLon, obsLat, obsLon, projection, context, stream, 4, 'magenta');
    this.lineRenderer.render(obsPath, obsLat, obsLon, endLat, endLon, projection, context, stream, 4, 'white');
  }
}

/**
 * Renders vectors-to-final legs. Each leg is rendered as a line representing a 30-nautical mile great-circle path
 * along the VTF course terminating at the end of the leg.
 */
export class MapFlightPlanVtfLegPathRenderer {
  private static readonly geoPointCache = [new GeoPoint(0, 0), new GeoPoint(0, 0)];
  private static readonly geoCircleCache = [new GeoCircle(new Float64Array(3), 0)];

  private readonly lineRenderer: MapGeoCircleLineRenderer;

  /**
   * Constructor.
   * @param resampler The geodesic resampler used by this renderer.
   */
  constructor(resampler: GeodesicResampler) {
    this.lineRenderer = new MapGeoCircleLineRenderer(resampler);
  }

  /**
   * Renders a vectors-to-final leg to a canvas.
   * @param leg The leg to render.
   * @param projection The projection to use for rendering.
   * @param context The canvas 2D rendering context to which to render.
   * @param stream The path stream to which to render.
   * @param width The width of the rendered line.
   * @param style The style of the rendered line.
   * @param dash The dash array of the rendered line. Defaults to no dash.
   */
  public render(
    leg: LegDefinition,
    projection: GeoProjection,
    context: CanvasRenderingContext2D,
    stream: PathStream,
    width: number,
    style: string,
    dash?: readonly number[]
  ): void {
    const vector = leg.calculated?.flightPath[0];

    if (!vector) {
      return;
    }

    const vectorCircle = FlightPathUtils.setGeoCircleFromVector(vector, MapFlightPlanVtfLegPathRenderer.geoCircleCache[0]);
    const end = MapFlightPlanVtfLegPathRenderer.geoPointCache[0].set(vector.endLat, vector.endLon);
    const start = vectorCircle.offsetDistanceAlong(end, UnitType.NMILE.convertTo(-30, UnitType.GA_RADIAN), MapFlightPlanVtfLegPathRenderer.geoPointCache[1]);

    this.lineRenderer.render(vectorCircle, start.lat, start.lon, end.lat, end.lon, projection, context, stream, width, style, dash);
  }
}