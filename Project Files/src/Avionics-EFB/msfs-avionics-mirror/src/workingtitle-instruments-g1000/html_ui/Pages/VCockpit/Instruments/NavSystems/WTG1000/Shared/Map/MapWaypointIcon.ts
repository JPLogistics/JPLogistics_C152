import { NavMath } from 'msfssdk';
import { IntersectionFacility, NdbFacility, RunwayFacility, UserFacility, VorFacility } from 'msfssdk/navigation';
import { MapProjection } from 'msfssdk/components/map';

import { AirportWaypoint, FacilityWaypoint, VNavWaypoint, Waypoint } from '../Navigation/Waypoint';
import { WaypointIconImageCache } from '../WaypointIconImageCache';

/**
 * A waypoint icon displayed on a map.
 */
export interface MapWaypointIcon<T extends Waypoint> {
  /** The waypoint associated with this icon. */
  readonly waypoint: T;

  /**
   * The render priority of this icon. Icons with higher priorities should be rendered above those with lower
   * priorities.
   */
  readonly priority: number;

  /**
   * Draws this icon to a canvas.
   * @param context The canvas rendering context.
   * @param mapProjection The map projection to use.
   */
  draw(context: CanvasRenderingContext2D, mapProjection: MapProjection): void;
}

/**
 * A blank waypoint icon.
 */
export class MapBlankWaypointIcon<T extends Waypoint> implements MapWaypointIcon<T> {
  /**
   * Constructor.
   * @param waypoint The waypoint associated with this icon.
   * @param priority The render priority of this icon. Icons with higher priorities should be rendered above those
   * with lower priorities.
   */
  constructor(public readonly waypoint: T, public readonly priority: number) {
  }

  // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/no-unused-vars
  public draw(context: CanvasRenderingContext2D, mapProjection: MapProjection): void {
    // noop
  }
}

/**
 * Initialization options for an AbstractMapWaypointIcon.
 */
export type AbstractMapWaypointIconOptions = {
  /**
   * The anchor point of the icon, expressed relative to its width and height. [0, 0] is the top-left corner, and
   * [1, 1] is the bottom-right corner.
   */
  anchor?: Float64Array,

  /** The offset of the icon from the projected position of its associated waypoint, in pixels. */
  offset?: Float64Array
}

/**
 * An abstract implementation of MapWaypointIcon which supports an arbitrary anchor point and offset.
 */
export abstract class AbstractMapWaypointIcon<T extends Waypoint> implements MapWaypointIcon<T> {
  protected static readonly tempVec2 = new Float64Array(2);

  /**
   * The anchor point of this icon, expressed relative to its width and height. [0, 0] is the top-left corner, and
   * [1, 1] is the bottom-right corner.
   */
  public readonly anchor = new Float64Array([0.5, 0.5]);

  /** The offset of this icon from the projected position of its associated waypoint, in pixels. */
  public readonly offset = new Float64Array(2);

  private readonly totalOffsetX: number;
  private readonly totalOffsetY: number;

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
    public readonly waypoint: T,
    public readonly priority: number,
    public readonly width: number,
    public readonly height: number,
    options?: AbstractMapWaypointIconOptions
  ) {
    options?.anchor && this.anchor.set(options.anchor);
    options?.offset && this.offset.set(options.offset);

    this.totalOffsetX = this.offset[0] - this.anchor[0] * this.width;
    this.totalOffsetY = this.offset[1] - this.anchor[1] * this.height;
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public draw(context: CanvasRenderingContext2D, mapProjection: MapProjection): void {
    const projected = mapProjection.project(this.waypoint.location, MapWaypointImageIcon.tempVec2);
    const left = projected[0] + this.totalOffsetX;
    const top = projected[1] + this.totalOffsetY;
    this.drawIconAt(context, mapProjection, left, top);
  }

  /**
   * Draws the icon at the specified position.
   * @param context The canvas rendering context to use.
   * @param mapProjection The map projection to use.
   * @param left The x-coordinate of the left edge of the icon.
   * @param top The y-coordinate of the top edge of the icon.
   */
  protected abstract drawIconAt(context: CanvasRenderingContext2D, mapProjection: MapProjection, left: number, top: number): void;
}

/**
 * A waypoint icon with an image as the icon's graphic source.
 */
export class MapWaypointImageIcon<T extends Waypoint> extends AbstractMapWaypointIcon<T> {
  /**
   * Constructor.
   * @param waypoint The waypoint associated with this icon.
   * @param priority The render priority of this icon. Icons with higher priorities should be rendered above those
   * with lower priorities.
   * @param img This icon's image.
   * @param width The width at which this icon should be rendered, in pixels.
   * @param height The height at which this icon should be rendered, in pixels.
   * @param options Options with which to initialize this icon.
   */
  constructor(
    waypoint: T,
    priority: number,
    protected readonly img: HTMLImageElement,
    width: number,
    height: number,
    options?: AbstractMapWaypointIconOptions
  ) {
    super(waypoint, priority, width, height, options);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected drawIconAt(context: CanvasRenderingContext2D, mapProjection: MapProjection, left: number, top: number): void {
    context.drawImage(this.img, left, top, this.width, this.height);
  }
}

/**
 * A waypoint icon with a sprite as the icon's graphic source.
 */
export abstract class MapWaypointSpriteIcon<T extends Waypoint> extends AbstractMapWaypointIcon<T> {
  /**
   * Constructor.
   * @param waypoint The waypoint associated with this icon.
   * @param priority The render priority of this icon. Icons with higher priorities should be rendered above those
   * with lower priorities.
   * @param img This icon's sprite's image source.
   * @param frameWidth The frame width of the sprite, in pixels.
   * @param frameHeight The frame height of the sprite, in pixels.
   * @param width The width at which this icon should be rendered, in pixels.
   * @param height The height at which this icon should be rendered, in pixels.
   * @param options Options with which to initialize this icon.
   */
  constructor(
    waypoint: T,
    priority: number,
    protected readonly img: HTMLImageElement,
    protected readonly frameWidth: number,
    protected readonly frameHeight: number,
    width: number,
    height: number,
    options?: AbstractMapWaypointIconOptions
  ) {
    super(waypoint, priority, width, height, options);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected drawIconAt(context: CanvasRenderingContext2D, mapProjection: MapProjection, left: number, top: number): void {
    const spriteIndex = this.getSpriteFrame(mapProjection);
    const rowCount = Math.floor(this.img.naturalHeight / this.frameHeight);
    const colCount = Math.floor(this.img.naturalWidth / this.frameWidth);
    const row = Math.min(rowCount - 1, Math.floor(spriteIndex / colCount));
    const col = Math.min(colCount - 1, spriteIndex % colCount);
    const spriteLeft = col * this.frameWidth;
    const spriteTop = row * this.frameHeight;

    context.drawImage(this.img, spriteLeft, spriteTop, this.frameWidth, this.frameHeight, left, top, this.width, this.height);
  }

  /**
   * Gets the sprite frame to render.
   * @param mapProjection The map projection to use.
   * @returns The sprite frame to render.
   */
  protected abstract getSpriteFrame(mapProjection: MapProjection): number;
}

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