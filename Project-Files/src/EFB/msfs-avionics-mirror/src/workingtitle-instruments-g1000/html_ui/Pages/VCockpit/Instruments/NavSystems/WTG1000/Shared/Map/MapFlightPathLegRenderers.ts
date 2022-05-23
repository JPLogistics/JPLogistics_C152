import { BitFlags, GeoCircle, GeoPoint, GeoProjection, MagVar, UnitType } from 'msfssdk';
import {
  FlightPathLegLineRenderer, GeoCircleLineRenderer, FlightPathLegLineStyle, FlightPathLegPatternRenderer,
  FlightPathLegPatternStyle, FlightPathLegRenderPart, GeoProjectionPathStreamStack
} from 'msfssdk/components/map';
import { LegDefinition, FlightPlan, CircleVector, LegDefinitionFlags, FlightPathUtils, FlightPathVectorFlags } from 'msfssdk/flightplan';
import { LNavTransitionMode } from 'msfssdk/autopilot';
import { LegType } from 'msfssdk/navigation';
import { MapFlightPathStyles } from './MapFlightPathStyles';
import { FlightPathArrowPattern } from './MapFlightPathPatterns';
import { DefaultFlightPathPlanRendererLNavData } from './MapDefaultFlightPathPlanRenderer';

/**
 * Renders flight plan legs as a continuous line.
 */
export class FlightPathLegContinuousLineRenderer extends FlightPathLegLineRenderer<[width: number, style: string, dash?: readonly number[]]> {
  /**
   * Constructor.
   */
  constructor() {
    super((
      vector: CircleVector,
      isIngress: boolean,
      isEgress: boolean,
      leg: LegDefinition,
      projection: GeoProjection,
      out: FlightPathLegLineStyle,
      width: number,
      style: string,
      dash?: readonly number[]
    ): FlightPathLegLineStyle => {
      out.strokeWidth = width;
      out.strokeStyle = style;
      out.strokeDash = dash ?? null;
      out.outlineWidth = 0;
      out.isContinuous = true;

      return out;
    });
  }
}

/**
 * Renders hold legs.
 */
export class FlightPathHoldLegRenderer {
  private static readonly NON_ACTIVE_STROKE_WIDTH = 2;
  private static readonly DASH = [4, 4];

  private readonly arrowPattern = new FlightPathArrowPattern();

  private readonly legContinuousLineRenderer = new FlightPathLegContinuousLineRenderer();
  private readonly legLineRenderer = new FlightPathLegLineRenderer<[number, number]>(this.selectLineStyle.bind(this));
  private readonly legPatternRenderer = new FlightPathLegPatternRenderer<[number, number]>(this.selectPatternStyle.bind(this));

  /**
   * Renders a hold leg to a canvas.
   * @param leg The leg to render.
   * @param context The canvas 2D rendering context to which to render.
   * @param streamStack The path stream stack to which to render.
   * @param plan The flight plan containing the leg to render.
   * @param activeLeg The active flight plan leg.
   * @param legIndex The global index of the leg to render.
   * @param activeLegIndex The global index of the active flight plan leg.
   * @param lnavData LNAV tracking data for the flight plan containing the leg to render, or undefined if LNAV is not
   * tracking the flight plan.
   */
  public render(
    leg: LegDefinition,
    context: CanvasRenderingContext2D,
    streamStack: GeoProjectionPathStreamStack,
    plan: FlightPlan,
    activeLeg: LegDefinition | undefined,
    legIndex: number,
    activeLegIndex: number,
    lnavData: DefaultFlightPathPlanRendererLNavData | undefined
  ): void {
    const isMissedApproachActive = !!activeLeg && BitFlags.isAny(activeLeg.flags, LegDefinitionFlags.MissedApproach);

    if (BitFlags.isAll(leg.flags, LegDefinitionFlags.MissedApproach) && !isMissedApproachActive) {
      this.legContinuousLineRenderer.render(
        leg, context, streamStack, FlightPathLegRenderPart.Base,
        MapFlightPathStyles.MISSED_APPROACH_STROKE_WIDTH, MapFlightPathStyles.MISSED_APPROACH_STROKE_COLOR
      );
    } else if (legIndex < activeLegIndex || legIndex > activeLegIndex + 1) {
      const partsToRender = leg.leg.type === LegType.HF ? FlightPathLegRenderPart.All : FlightPathLegRenderPart.Base | FlightPathLegRenderPart.Egress;
      this.legLineRenderer.render(leg, context, streamStack, partsToRender, legIndex, activeLegIndex);
    } else if (legIndex === activeLegIndex + 1) {
      this.arrowPattern.color = MapFlightPathStyles.STROKE_COLOR;
      this.arrowPattern.context = context;
      if (leg.leg.type === LegType.HF) {
        // Draw the entire hold as arrows
        this.legPatternRenderer.render(leg, context, streamStack, FlightPathLegRenderPart.All, legIndex, activeLegIndex);
      } else {
        // Draw the entire hold circuit as lines + ingress as arrows on top.
        this.legLineRenderer.render(leg, context, streamStack, FlightPathLegRenderPart.Base, legIndex, activeLegIndex);
        this.legPatternRenderer.render(leg, context, streamStack, FlightPathLegRenderPart.Ingress, legIndex, activeLegIndex);
      }
    } else { // legIndex === activeLegIndex
      let partsToRender = 0;
      if (!lnavData || lnavData.currentLegIndex !== legIndex) {
        partsToRender = leg.leg.type === LegType.HF ? FlightPathLegRenderPart.All : FlightPathLegRenderPart.Ingress | FlightPathLegRenderPart.Base;
      } else {
        partsToRender = FlightPathLegRenderPart.Base;

        if (lnavData.transitionMode === LNavTransitionMode.Ingress) {
          partsToRender |= FlightPathLegRenderPart.Ingress;
        }

        if (!lnavData.isSuspended) {
          partsToRender |= FlightPathLegRenderPart.Egress;
        }
      }

      // Draw the entire hold as arrows, except the inbound leg and egress.

      this.legLineRenderer.render(leg, context, streamStack, partsToRender, legIndex, activeLegIndex);

      this.arrowPattern.color = MapFlightPathStyles.ACTIVE_STROKE_COLOR;
      this.arrowPattern.context = context;
      this.legPatternRenderer.render(
        leg, context, streamStack,
        (FlightPathLegRenderPart.Ingress | FlightPathLegRenderPart.Base) & partsToRender,
        legIndex, activeLegIndex
      );
    }
  }

  /**
   * Selects a line style to render for a hold vector.
   * @param vector The vector for which to select a style.
   * @param isIngress Whether the vector is part of the ingress transition.
   * @param isEgress Whether the vector is part of the egress transition.
   * @param leg The flight plan leg containing the vector to render.
   * @param projection The map projection to use when rendering.
   * @param out The line style object to which to write the selected style.
   * @param legIndex The global index of the flight plan leg to which the vector belongs.
   * @param activeLegIndex The global index of the active flight plan leg.
   * @returns The selected line style for the vector.
   */
  private selectLineStyle(
    vector: CircleVector,
    isIngress: boolean,
    isEgress: boolean,
    leg: LegDefinition,
    projection: GeoProjection,
    out: FlightPathLegLineStyle,
    legIndex: number,
    activeLegIndex: number
  ): FlightPathLegLineStyle {
    let color, width, dash;

    const isInboundOrEgress = isEgress || BitFlags.isAll(vector.flags, FlightPathVectorFlags.HoldInboundLeg);

    if (legIndex < activeLegIndex || legIndex > activeLegIndex + 1) {
      // Draw all vectors as a line with the inbound leg and egress solid and rest dashed.
      width = FlightPathHoldLegRenderer.NON_ACTIVE_STROKE_WIDTH;
      color = legIndex < activeLegIndex ? MapFlightPathStyles.PRIOR_STROKE_COLOR : MapFlightPathStyles.STROKE_COLOR;
      dash = isInboundOrEgress ? null : FlightPathHoldLegRenderer.DASH;
    } else if (legIndex === activeLegIndex + 1) {
      // Draw the ingress with arrows, and the hold circuit as a line with the inbound leg solid and rest dashed.
      width = FlightPathHoldLegRenderer.NON_ACTIVE_STROKE_WIDTH;
      color = MapFlightPathStyles.STROKE_COLOR;
      dash = isInboundOrEgress ? null : FlightPathHoldLegRenderer.DASH;
    } else { // legIndex === activeLegIndex
      // Draw the inbound leg and egress as solid lines, and the rest as magenta arrow background.
      if (isInboundOrEgress) {
        width = MapFlightPathStyles.ACTIVE_STROKE_WIDTH;
        color = MapFlightPathStyles.ACTIVE_STROKE_COLOR;
      } else {
        width = MapFlightPathStyles.MAGENTA_ARROW_BG_WIDTH;
        color = MapFlightPathStyles.MAGENTA_ARROW_BG_COLOR;
      }

      dash = null;
    }

    out.strokeWidth = width;
    out.strokeStyle = color;
    out.strokeDash = dash;
    out.outlineWidth = 0;
    out.isContinuous = true;

    return out;
  }

  /**
   * Selects a pattern style to render for a hold vector.
   * @param vector The vector for which to select a style.
   * @param isIngress Whether the vector is part of the ingress transition.
   * @param isEgress Whether the vector is part of the egress transition.
   * @param leg The flight plan leg containing the vector to render.
   * @param projection The map projection to use when rendering.
   * @param out The line style object to which to write the selected style.
   * @param legIndex The global index of the flight plan leg to which the vector belongs.
   * @param activeLegIndex The global index of the active flight plan leg.
   * @returns The selected pattern style for the vector.
   */
  private selectPatternStyle(
    vector: CircleVector,
    isIngress: boolean,
    isEgress: boolean,
    leg: LegDefinition,
    projection: GeoProjection,
    out: FlightPathLegPatternStyle,
    legIndex: number,
    activeLegIndex: number
  ): FlightPathLegPatternStyle {
    if (legIndex !== activeLegIndex || !(isEgress || BitFlags.isAll(vector.flags, FlightPathVectorFlags.HoldInboundLeg))) {
      out.pattern = this.arrowPattern;
    } else {
      out.pattern = null;
    }

    out.isContinuous = true;

    return out;
  }
}

/**
 * Renders procedure turn legs.
 */
export class FlightPathProcTurnLegRenderer {
  private static readonly NON_ACTIVE_STROKE_WIDTH = 2;
  private static readonly DASH = [4, 4];

  private readonly arrowPattern: FlightPathArrowPattern;

  private readonly legLineRenderer: FlightPathLegContinuousLineRenderer;
  private readonly legPatternRenderer: FlightPathLegPatternRenderer;

  /**
   * Constructor.
   */
  constructor() {
    this.arrowPattern = new FlightPathArrowPattern();
    this.arrowPattern.color = MapFlightPathStyles.ACTIVE_STROKE_COLOR;

    this.legLineRenderer = new FlightPathLegContinuousLineRenderer();
    this.legPatternRenderer = new FlightPathLegPatternRenderer(
      (
        vector: CircleVector,
        isIngress: boolean,
        isEgress: boolean,
        leg: LegDefinition,
        projection: GeoProjection,
        out: FlightPathLegPatternStyle
      ): FlightPathLegPatternStyle => {
        out.pattern = this.arrowPattern;
        out.isContinuous = true;
        return out;
      }
    );
  }

  /**
   * Renders a procedure turn leg to a canvas.
   * @param leg The leg to render.
   * @param context The canvas 2D rendering context to which to render.
   * @param streamStack The path stream stack to which to render.
   * @param plan The flight plan containing the leg to render.
   * @param activeLeg The active flight plan leg.
   * @param legIndex The global index of the leg to render.
   * @param activeLegIndex The global index of the active flight plan leg.
   */
  public render(
    leg: LegDefinition,
    context: CanvasRenderingContext2D,
    streamStack: GeoProjectionPathStreamStack,
    plan: FlightPlan,
    activeLeg: LegDefinition | undefined,
    legIndex: number,
    activeLegIndex: number
  ): void {
    const isMissedApproachActive = !!activeLeg && BitFlags.isAny(activeLeg.flags, LegDefinitionFlags.MissedApproach);

    if (legIndex === activeLegIndex) {
      this.legLineRenderer.render(
        leg, context, streamStack, FlightPathLegRenderPart.All, MapFlightPathStyles.MAGENTA_ARROW_BG_WIDTH, MapFlightPathStyles.MAGENTA_ARROW_BG_COLOR
      );
      this.arrowPattern.context = context;
      this.legPatternRenderer.render(leg, context, streamStack, FlightPathLegRenderPart.All);
    } else {
      let width, style;
      if (BitFlags.isAll(leg.flags, LegDefinitionFlags.MissedApproach) && !isMissedApproachActive) {
        width = MapFlightPathStyles.MISSED_APPROACH_STROKE_WIDTH;
        style = MapFlightPathStyles.MISSED_APPROACH_STROKE_COLOR;
      } else if (legIndex < activeLegIndex) {
        width = FlightPathProcTurnLegRenderer.NON_ACTIVE_STROKE_WIDTH;
        style = MapFlightPathStyles.PRIOR_STROKE_COLOR;
      } else {
        width = FlightPathProcTurnLegRenderer.NON_ACTIVE_STROKE_WIDTH;
        style = MapFlightPathStyles.STROKE_COLOR;
      }

      this.legLineRenderer.render(leg, context, streamStack, FlightPathLegRenderPart.All, width, style, FlightPathProcTurnLegRenderer.DASH);
    }
  }
}

/**
 * Renders Direct-To legs with user-defined courses. Each leg is rendered as a single line following a 500-nautical
 * mile great-circle path along the Direct-To course terminating at the end of the leg.
 */
export class FlightPathDirectToCourseLegRenderer {
  private static readonly geoPointCache = [new GeoPoint(0, 0), new GeoPoint(0, 0)];
  private static readonly geoCircleCache = [new GeoCircle(new Float64Array(3), 0)];

  private readonly lineRenderer = new GeoCircleLineRenderer();

  /**
   * Renders a Direct-To leg with user-defined course to a canvas.
   * @param leg The leg to render.
   * @param context The canvas 2D rendering context to which to render.
   * @param streamStack The path stream stack to which to render.
   * @param width The width of the rendered line.
   * @param style The style of the rendered line.
   * @param dash The dash array of the rendered line. Defaults to no dash.
   */
  public render(
    leg: LegDefinition,
    context: CanvasRenderingContext2D,
    streamStack: GeoProjectionPathStreamStack,
    width: number,
    style: string,
    dash?: readonly number[]
  ): void {
    if (leg.calculated?.endLat === undefined || leg.calculated?.endLon === undefined) {
      return;
    }

    const dtoFix = FlightPathDirectToCourseLegRenderer.geoPointCache[0].set(leg.calculated.endLat, leg.calculated.endLon);
    const dtoCourseTrue = MagVar.magneticToTrue(leg.leg.course, dtoFix.lat, dtoFix.lon);
    const dtoPath = FlightPathDirectToCourseLegRenderer.geoCircleCache[0].setAsGreatCircle(dtoFix, dtoCourseTrue);
    const start = dtoPath.offsetDistanceAlong(dtoFix, UnitType.NMILE.convertTo(-500, UnitType.GA_RADIAN), FlightPathDirectToCourseLegRenderer.geoPointCache[1]);

    this.lineRenderer.render(dtoPath, start.lat, start.lon, dtoFix.lat, dtoFix.lon, context, streamStack, width, style, dash);
  }
}

/**
 * Renders OBS legs. Each leg is rendered as two lines: a magenta 500-nautical mile great-circle path along the OBS
 * course terminating at the end of the leg, and a white 500-nautical mile great-circle path along the OBS course
 * starting at the end of the leg.
 */
export class FlightPathObsLegRenderer {
  private static readonly geoPointCache = [new GeoPoint(0, 0), new GeoPoint(0, 0)];
  private static readonly geoCircleCache = [new GeoCircle(new Float64Array(3), 0)];

  private readonly lineRenderer = new GeoCircleLineRenderer();

  /**
   * Renders an OBS leg to a canvas.
   * @param leg The leg to render.
   * @param context The canvas 2D rendering context to which to render.
   * @param streamStack The path stream stack to which to render.
   * @param course The OBS course, in degrees magnetic.
   */
  public render(
    leg: LegDefinition,
    context: CanvasRenderingContext2D,
    streamStack: GeoProjectionPathStreamStack,
    course: number
  ): void {
    if (leg.calculated?.endLat === undefined || leg.calculated?.endLon === undefined) {
      return;
    }

    const obsFix = FlightPathObsLegRenderer.geoPointCache[0].set(leg.calculated.endLat, leg.calculated.endLon);
    const obsLat = obsFix.lat;
    const obsLon = obsFix.lon;

    const obsCourseTrue = MagVar.magneticToTrue(course, obsLat, obsLon);
    const obsPath = FlightPathObsLegRenderer.geoCircleCache[0].setAsGreatCircle(obsFix, obsCourseTrue);

    const start = obsPath.offsetDistanceAlong(obsFix, UnitType.NMILE.convertTo(-500, UnitType.GA_RADIAN), FlightPathObsLegRenderer.geoPointCache[1]);
    const startLat = start.lat;
    const startLon = start.lon;

    const end = obsPath.offsetDistanceAlong(obsFix, UnitType.NMILE.convertTo(500, UnitType.GA_RADIAN), FlightPathObsLegRenderer.geoPointCache[1]);
    const endLat = end.lat;
    const endLon = end.lon;

    this.lineRenderer.render(obsPath, startLat, startLon, obsLat, obsLon, context, streamStack, 4, 'magenta');
    this.lineRenderer.render(obsPath, obsLat, obsLon, endLat, endLon, context, streamStack, 4, 'white');
  }
}

/**
 * Renders vectors-to-final legs. Each leg is rendered as a line representing a 30-nautical mile great-circle path
 * along the VTF course terminating at the end of the leg.
 */
export class FlightPathVtfLegRenderer {
  private static readonly geoPointCache = [new GeoPoint(0, 0), new GeoPoint(0, 0)];
  private static readonly geoCircleCache = [new GeoCircle(new Float64Array(3), 0)];

  private readonly lineRenderer = new GeoCircleLineRenderer();

  /**
   * Renders a vectors-to-final leg to a canvas.
   * @param leg The leg to render.
   * @param context The canvas 2D rendering context to which to render.
   * @param streamStack The path stream stack to which to render.
   * @param width The width of the rendered line.
   * @param style The style of the rendered line.
   * @param dash The dash array of the rendered line. Defaults to no dash.
   */
  public render(
    leg: LegDefinition,
    context: CanvasRenderingContext2D,
    streamStack: GeoProjectionPathStreamStack,
    width: number,
    style: string,
    dash?: readonly number[]
  ): void {
    const vector = leg.calculated?.flightPath[0];

    if (!vector) {
      return;
    }

    const vectorCircle = FlightPathUtils.setGeoCircleFromVector(vector, FlightPathVtfLegRenderer.geoCircleCache[0]);
    const end = FlightPathVtfLegRenderer.geoPointCache[0].set(vector.endLat, vector.endLon);
    const start = vectorCircle.offsetDistanceAlong(end, UnitType.NMILE.convertTo(-30, UnitType.GA_RADIAN), FlightPathVtfLegRenderer.geoPointCache[1]);

    this.lineRenderer.render(vectorCircle, start.lat, start.lon, end.lat, end.lon, context, streamStack, width, style, dash);
  }
}