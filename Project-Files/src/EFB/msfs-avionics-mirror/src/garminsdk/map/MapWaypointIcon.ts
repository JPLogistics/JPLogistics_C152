import { NavMath } from 'msfssdk';
import { IntersectionFacility, NdbFacility, RunwayFacility, UserFacility, VorFacility } from 'msfssdk/navigation';
import { AbstractMapWaypointIcon, AbstractMapWaypointIconOptions, MapProjection, MapWaypointImageIcon, MapWaypointSpriteIcon } from 'msfssdk/components/map';

import { AirportWaypoint, FacilityWaypoint, VNavWaypoint, Waypoint } from '../navigation/Waypoint';
import { WaypointIconImageCache } from '../ui/WaypointIconImageCache';

/**
 * An airport icon.
 */
export class MapAirportIcon<T extends AirportWaypoint<any>> extends MapWaypointSpriteIcon<T> {
  /**
   * Constructor.
   * @param waypoint The waypoint associated with this icon.
   * @param priority The render priority of this icon. Icons with higher priorities should be rendered above those
   * with lower priorities.
   * @param width The width at which this icon should be rendered, in pixels.
   * @param height The height at which this icon should be rendered, in pixels.
   * @param options Options with which to initialize this icon.
   */
  constructor(
    waypoint: T,
    priority: number,
    width: number,
    height: number,
    options?: AbstractMapWaypointIconOptions
  ) {
    super(waypoint, priority, WaypointIconImageCache.getAirportIcon(waypoint.facility), 32, 32, width, height, options);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected getSpriteFrame(mapProjection: MapProjection): number {
    if (!this.waypoint.longestRunway) {
      return 0;
    }

    const mapRotationDeg = mapProjection.getRotation() * Avionics.Utils.RAD2DEG;
    return Math.round(NavMath.normalizeHeading((this.waypoint.longestRunway.direction + mapRotationDeg)) / 22.5) % 8;
  }
}

/**
 * A VOR icon.
 */
export class MapVorIcon<T extends FacilityWaypoint<VorFacility>> extends MapWaypointImageIcon<T> {
  /**
   * Constructor.
   * @param waypoint The waypoint associated with this icon.
   * @param priority The render priority of this icon. Icons with higher priorities should be rendered above those
   * with lower priorities.
   * @param width The width at which this icon should be rendered, in pixels.
   * @param height The height at which this icon should be rendered, in pixels.
   * @param options Options with which to initialize this icon.
   */
  constructor(
    waypoint: T,
    priority: number,
    width: number,
    height: number,
    options?: AbstractMapWaypointIconOptions
  ) {
    super(waypoint, priority, WaypointIconImageCache.getVorIcon(waypoint.facility.type), width, height, options);
  }
}

/**
 * An intersection icon.
 */
export class MapNdbIcon<T extends FacilityWaypoint<NdbFacility>> extends MapWaypointImageIcon<T> {
  /**
   * Constructor.
   * @param waypoint The waypoint associated with this icon.
   * @param priority The render priority of this icon. Icons with higher priorities should be rendered above those
   * with lower priorities.
   * @param width The width at which this icon should be rendered, in pixels.
   * @param height The height at which this icon should be rendered, in pixels.
   * @param options Options with which to initialize this icon.
   */
  constructor(
    waypoint: T,
    priority: number,
    width: number,
    height: number,
    options?: AbstractMapWaypointIconOptions
  ) {
    super(waypoint, priority, WaypointIconImageCache.get('NDB'), width, height, options);
  }
}

/**
 * An intersection icon.
 */
export class MapIntersectionIcon<T extends FacilityWaypoint<IntersectionFacility>> extends MapWaypointImageIcon<T> {
  /**
   * Constructor.
   * @param waypoint The waypoint associated with this icon.
   * @param priority The render priority of this icon. Icons with higher priorities should be rendered above those
   * with lower priorities.
   * @param width The width at which this icon should be rendered, in pixels.
   * @param height The height at which this icon should be rendered, in pixels.
   * @param options Options with which to initialize this icon.
   */
  constructor(
    waypoint: T,
    priority: number,
    width: number,
    height: number,
    options?: AbstractMapWaypointIconOptions
  ) {
    super(waypoint, priority, WaypointIconImageCache.get('INTERSECTION_CYAN'), width, height, options);
  }
}

/**
 * A runway waypoint icon.
 */
export class MapRunwayWaypointIcon<T extends FacilityWaypoint<RunwayFacility>> extends MapWaypointImageIcon<T> {
  /**
   * Constructor.
   * @param waypoint The waypoint associated with this icon.
   * @param priority The render priority of this icon. Icons with higher priorities should be rendered above those
   * with lower priorities.
   * @param width The width at which this icon should be rendered, in pixels.
   * @param height The height at which this icon should be rendered, in pixels.
   * @param options Options with which to initialize this icon.
   */
  constructor(
    waypoint: T,
    priority: number,
    width: number,
    height: number,
    options?: AbstractMapWaypointIconOptions
  ) {
    super(waypoint, priority, WaypointIconImageCache.get('INTERSECTION_CYAN'), width, height, options);
  }
}

/**
 * A user waypoint icon.
 */
export class MapUserWaypointIcon<T extends FacilityWaypoint<UserFacility>> extends MapWaypointImageIcon<T> {
  /**
   * Constructor.
   * @param waypoint The waypoint associated with this icon.
   * @param priority The render priority of this icon. Icons with higher priorities should be rendered above those
   * with lower priorities.
   * @param width The width at which this icon should be rendered, in pixels.
   * @param height The height at which this icon should be rendered, in pixels.
   * @param options Options with which to initialize this icon.
   */
  constructor(
    waypoint: T,
    priority: number,
    width: number,
    height: number,
    options?: AbstractMapWaypointIconOptions
  ) {
    super(waypoint, priority, WaypointIconImageCache.get('USER'), width, height, options);
  }
}

/**
 * A flight path waypoint icon.
 */
export class MapFlightPathWaypointIcon<T extends Waypoint> extends MapWaypointImageIcon<T> {
  /**
   * Constructor.
   * @param waypoint The waypoint associated with this icon.
   * @param priority The render priority of this icon. Icons with higher priorities should be rendered above those
   * with lower priorities.
   * @param width The width at which this icon should be rendered, in pixels.
   * @param height The height at which this icon should be rendered, in pixels.
   * @param options Options with which to initialize this icon.
   */
  constructor(
    waypoint: T,
    priority: number,
    width: number,
    height: number,
    options?: AbstractMapWaypointIconOptions
  ) {
    super(waypoint, priority, WaypointIconImageCache.get('FPLN_WAYPOINT'), width, height, options);
  }
}

/**
 * A VNAV waypoint icon.
 */
export class MapVNavWaypointIcon extends MapWaypointImageIcon<VNavWaypoint> {
  /**
   * Constructor.
   * @param waypoint The waypoint associated with this icon.
   * @param priority The render priority of this icon. Icons with higher priorities should be rendered above those
   * with lower priorities.
   * @param width The width at which this icon should be rendered, in pixels.
   * @param height The height at which this icon should be rendered, in pixels.
   * @param options Options with which to initialize this icon.
   */
  constructor(
    waypoint: VNavWaypoint,
    priority: number,
    width: number,
    height: number,
    options?: AbstractMapWaypointIconOptions
  ) {
    super(waypoint, priority, WaypointIconImageCache.get('VNAV'), width, height, options);
  }
}

/**
 * Initialization options for a MapWaypointHighlightIcon.
 */
export type MapWaypointHighlightIconOptions = {
  /** The buffer of the ring around the base icon, in pixels. */
  ringRadiusBuffer?: number,

  /** The width of the stroke for the ring, in pixels. */
  strokeWidth?: number

  /** The color of the stroke for the ring. */
  strokeColor?: string

  /** The width of the outline for the ring, in pixels. */
  outlineWidth?: number

  /** The color of the outline for the ring. */
  outlineColor?: string

  /** The color of the ring background. */
  bgColor?: string;
}

/**
 * An icon for a highlighted waypoint. This icon embellishes a pre-existing ("base") icon with a surrounding ring and
 * background.
 */
export class MapWaypointHighlightIcon<T extends Waypoint> extends AbstractMapWaypointIcon<T> {
  /** The buffer of the ring around this icon's base icon, in pixels. */
  public readonly ringRadiusBuffer: number;

  /** The width of the stroke for this icon's ring, in pixels. */
  public readonly strokeWidth: number;

  /** The color of the stroke for this icon's ring. */
  public readonly strokeColor: string;

  /** The width of the outline for this icon's ring, in pixels. */
  public readonly outlineWidth: number;

  /** The color of the outline for this icon's ring. */
  public readonly outlineColor: string;

  /** The color of this icon's ring background. */
  public readonly bgColor: string;

  private readonly radius: number;

  /**
   * Constructor.
   * @param baseIcon This icon's base waypoint icon.
   * @param priority The render priority of this icon. Icons with higher priorities should be rendered above those
   * with lower priorities.
   * @param options Options with which to initialize this icon.
   */
  constructor(private readonly baseIcon: AbstractMapWaypointIcon<T>, priority: number, options?: MapWaypointHighlightIconOptions) {
    super(baseIcon.waypoint, priority, baseIcon.width, baseIcon.height, { offset: baseIcon.offset, anchor: baseIcon.anchor });

    this.ringRadiusBuffer = options?.ringRadiusBuffer ?? 0;
    this.strokeWidth = options?.strokeWidth ?? 2;
    this.strokeColor = options?.strokeColor ?? 'white';
    this.outlineWidth = options?.outlineWidth ?? 0;
    this.outlineColor = options?.outlineColor ?? 'black';
    this.bgColor = options?.bgColor ?? '#3c3c3c';

    this.radius = Math.hypot(baseIcon.width, baseIcon.height) / 2 + this.ringRadiusBuffer;
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected drawIconAt(context: CanvasRenderingContext2D, mapProjection: MapProjection, left: number, top: number): void {
    const x = left + this.baseIcon.width / 2;
    const y = top + this.baseIcon.height / 2;
    context.beginPath();
    context.arc(x, y, this.radius, 0, 2 * Math.PI);

    this.drawRingBackground(context);
    this.baseIcon.draw(context, mapProjection);
    this.drawRing(context);
  }

  /**
   * Draws the ring background for this icon.
   * @param context  A canvas rendering context.
   */
  private drawRingBackground(context: CanvasRenderingContext2D): void {
    context.fillStyle = this.bgColor;
    context.fill();
  }

  /**
   * Draws the ring for this icon.
   * @param context  A canvas rendering context.
   */
  private drawRing(context: CanvasRenderingContext2D): void {
    if (this.outlineWidth > 0) {
      this.applyStroke(context, (this.strokeWidth + 2 * this.outlineWidth), this.outlineColor);
    }
    this.applyStroke(context, this.strokeWidth, this.strokeColor);
  }

  /**
   * Applies a stroke to a canvas rendering context.
   * @param context A canvas rendering context.
   * @param lineWidth The width of the stroke.
   * @param strokeStyle The style of the stroke.
   */
  private applyStroke(context: CanvasRenderingContext2D, lineWidth: number, strokeStyle: string | CanvasGradient | CanvasPattern): void {
    context.lineWidth = lineWidth;
    context.strokeStyle = strokeStyle;
    context.stroke();
  }
}