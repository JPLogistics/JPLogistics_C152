import { GeoPoint, Vec2Math } from 'msfssdk';
import { MapProjection } from 'msfssdk/components/map';
import { LegDefinition } from 'msfssdk/flightplan';
import { FlightPlanFocus } from '../UI/FPL/FPLTypesAndProps';

/**
 * A map range and target solution to fit a flight plan focus.
 */
export type MapFlightPlanFocusRangeTarget = {
  /** The range of the focus, in great-arc radians. */
  range: number;

  /** The target location of the focus. */
  target: GeoPoint;
}

/**
 * Calculates map projection parameters to fit flight plan foci.
 */
export class MapFlightPlanFocusCalculator {
  private static readonly MAX_ITER = 20;
  private static readonly RANGE_TOLERANCE = 0.01;

  private static readonly geoPointCache = [new GeoPoint(0, 0), new GeoPoint(0, 0)];
  private static readonly vec2Cache = [new Float64Array(2), new Float64Array(2)];

  private readonly tempProjection = new MapProjection(100, 100);

  /**
   * Constructor.
   * @param mapProjection This calculator's map projection.
   */
  constructor(private readonly mapProjection: MapProjection) {
  }

  /**
   * Calculates a maximum range and target center for a given flight plan focus such that the terminators of all legs
   * in the focus are visible in this calculator's map projection. If there is only one leg terminator in the specified
   * focus, the calculated range will be equal to 0. If a range and target could not be calculated, NaN will be written
   * to the results.
   * @param focus The array of legs on which to focus.
   * @param margins The margins around the projected map boundaries to respect. Expressed as [left, top, right, bottom].
   * @param out The object to which to write the results.
   * @returns The calculated range and target for the specified focus.
   */
  public calculateRangeTarget(focus: FlightPlanFocus, margins: Float64Array, out: MapFlightPlanFocusRangeTarget): MapFlightPlanFocusRangeTarget {
    out.range = NaN;
    out.target.set(NaN, NaN);

    if (!focus) {
      return out;
    }

    if (!(focus instanceof Array)) {
      out.range = 0;
      out.target.set(focus);
      return out;
    }

    focus = focus as readonly LegDefinition[];

    const targetWidth = this.mapProjection.getProjectedSize()[0] - margins[0] - margins[2];
    const targetHeight = this.mapProjection.getProjectedSize()[1] - margins[1] - margins[3];

    if (targetWidth * targetHeight <= 0) {
      return out;
    }

    let minX: number | undefined;
    let minY: number | undefined;
    let maxX: number | undefined;
    let maxY: number | undefined;

    let currentLat = NaN;
    let currentLon = NaN;

    const len = focus.length;
    for (let i = 0; i < len; i++) {
      const leg = focus[i];

      if (
        leg.calculated?.startLat !== undefined && leg.calculated?.startLon !== undefined
        && leg.calculated?.startLat !== currentLat && leg.calculated?.startLon !== currentLon
      ) {
        currentLat = leg.calculated.startLat;
        currentLon = leg.calculated.startLon;

        const projected = this.mapProjection.project(
          MapFlightPlanFocusCalculator.geoPointCache[0].set(currentLat, currentLon),
          MapFlightPlanFocusCalculator.vec2Cache[0]
        );

        minX = Math.min(projected[0], minX ?? Infinity);
        minY = Math.min(projected[1], minY ?? Infinity);
        maxX = Math.max(projected[0], maxX ?? -Infinity);
        maxY = Math.max(projected[1], maxY ?? -Infinity);
      }

      if (
        leg.calculated?.endLat !== undefined && leg.calculated?.endLon !== undefined
        && leg.calculated?.endLat !== currentLat && leg.calculated?.endLon !== currentLon
      ) {
        currentLat = leg.calculated.endLat;
        currentLon = leg.calculated.endLon;

        const projected = this.mapProjection.project(
          MapFlightPlanFocusCalculator.geoPointCache[0].set(currentLat, currentLon),
          MapFlightPlanFocusCalculator.vec2Cache[0]
        );

        minX = Math.min(projected[0], minX ?? Infinity);
        minY = Math.min(projected[1], minY ?? Infinity);
        maxX = Math.max(projected[0], maxX ?? -Infinity);
        maxY = Math.max(projected[1], maxY ?? -Infinity);
      }
    }

    if (minX === undefined || minY === undefined || maxX === undefined || maxY === undefined) {
      return out;
    }

    let focusWidth = maxX - minX;
    let focusHeight = maxY - minY;

    this.mapProjection.invert(Vec2Math.set((minX + maxX) / 2, (minY + maxY) / 2, MapFlightPlanFocusCalculator.vec2Cache[0]), out.target);

    if (focusWidth === 0 && focusHeight === 0) {
      out.range = 0;
      return out;
    }

    let widthRatio = focusWidth / targetWidth;
    let heightRatio = focusHeight / targetHeight;

    let constrainedRatio = Math.max(widthRatio, heightRatio);
    const range = out.range = this.mapProjection.getRange();

    const topLeft = this.mapProjection.invert(Vec2Math.set(minX, minY, MapFlightPlanFocusCalculator.vec2Cache[0]), MapFlightPlanFocusCalculator.geoPointCache[0]);
    const bottomRight = this.mapProjection.invert(Vec2Math.set(maxX, maxY, MapFlightPlanFocusCalculator.vec2Cache[0]), MapFlightPlanFocusCalculator.geoPointCache[1]);

    this.tempProjection.set({ projectedSize: this.mapProjection.getProjectedSize(), rotation: this.mapProjection.getRotation(), target: out.target, range });

    // Iteratively solve for exact range
    let iterCount = 0;
    const rangeParam = { range };
    let ratioError = Math.abs(constrainedRatio - 1);
    let deltaRatioError = MapFlightPlanFocusCalculator.RANGE_TOLERANCE + 1;
    while (
      iterCount++ < MapFlightPlanFocusCalculator.MAX_ITER
      && ratioError > MapFlightPlanFocusCalculator.RANGE_TOLERANCE
      && deltaRatioError > MapFlightPlanFocusCalculator.RANGE_TOLERANCE
    ) {
      rangeParam.range = out.range = this.tempProjection.getRange() * constrainedRatio;

      if (out.range <= GeoPoint.EQUALITY_TOLERANCE) {
        // if the estimated range is too small, iteratively solving for the range will be unreliable due to floating
        // point errors
        out.range = GeoPoint.EQUALITY_TOLERANCE;
        return out;
      }

      this.tempProjection.set(rangeParam);

      const topLeftProjected = this.tempProjection.project(topLeft, MapFlightPlanFocusCalculator.vec2Cache[0]);
      const bottomRightProjected = this.tempProjection.project(bottomRight, MapFlightPlanFocusCalculator.vec2Cache[1]);

      focusWidth = bottomRightProjected[0] - topLeftProjected[0];
      focusHeight = bottomRightProjected[1] - topLeftProjected[1];

      widthRatio = focusWidth / targetWidth;
      heightRatio = focusHeight / targetHeight;

      constrainedRatio = Math.max(widthRatio, heightRatio);

      const newRatioError = Math.abs(constrainedRatio - 1);
      deltaRatioError = Math.abs(newRatioError - ratioError);
      ratioError = newRatioError;
    }

    return out;
  }
}