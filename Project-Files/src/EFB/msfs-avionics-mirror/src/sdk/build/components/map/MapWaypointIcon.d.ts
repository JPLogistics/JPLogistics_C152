import { MapProjection } from './MapProjection';
import { MapWaypoint } from './MapWaypoint';
/**
 * An icon for a waypoint displayed on a map.
 */
export interface MapWaypointIcon<T extends MapWaypoint> {
    /** The waypoint associated with this icon. */
    readonly waypoint: T;
    /**
     * The render priority of this icon. Icons with higher priorities will be rendered on top of icons with lower
     * priorities.
     */
    readonly priority: number;
    /**
     * Renders this icon to a canvas.
     * @param context The canvas 2D rendering context to which to render.
     * @param mapProjection The projection to use for rendering.
     */
    draw(context: CanvasRenderingContext2D, mapProjection: MapProjection): void;
}
/**
 * A blank waypoint icon.
 */
export declare class MapBlankWaypointIcon<T extends MapWaypoint> implements MapWaypointIcon<T> {
    readonly waypoint: T;
    readonly priority: number;
    /**
     * Constructor.
     * @param waypoint The waypoint associated with this icon.
     * @param priority The render priority of this icon. Icons with higher priorities should be rendered above those
     * with lower priorities.
     */
    constructor(waypoint: T, priority: number);
    /**
     * Does nothing.
     */
    draw(): void;
}
/**
 * Initialization options for an AbstractMapWaypointIcon.
 */
export declare type AbstractMapWaypointIconOptions = {
    /**
     * The anchor point of the icon, expressed as `[x, y]` relative to its width and height. `[0, 0]` is the top-left
     * corner, and `[1, 1]` is the bottom-right corner.
     */
    anchor?: Float64Array;
    /** The offset of the icon from the projected position of its associated waypoint, in pixels. */
    offset?: Float64Array;
};
/**
 * An abstract implementation of MapWaypointIcon which supports an arbitrary anchor point and offset.
 */
export declare abstract class AbstractMapWaypointIcon<T extends MapWaypoint> implements MapWaypointIcon<T> {
    readonly waypoint: T;
    readonly priority: number;
    readonly width: number;
    readonly height: number;
    protected static readonly tempVec2: Float64Array;
    /**
     * The anchor point of this icon, expressed relative to its width and height. [0, 0] is the top-left corner, and
     * [1, 1] is the bottom-right corner.
     */
    readonly anchor: Float64Array;
    /** The offset of this icon from the projected position of its associated waypoint, in pixels. */
    readonly offset: Float64Array;
    private readonly totalOffsetX;
    private readonly totalOffsetY;
    /**
     * Constructor.
     * @param waypoint The waypoint associated with this icon.
     * @param priority The render priority of this icon. Icons with higher priorities should be rendered above those
     * with lower priorities.
     * @param width The width at which this icon should be rendered, in pixels.
     * @param height The height at which this icon should be rendered, in pixels.
     * @param options Options with which to initialize this icon.
     */
    constructor(waypoint: T, priority: number, width: number, height: number, options?: AbstractMapWaypointIconOptions);
    /** @inheritdoc */
    draw(context: CanvasRenderingContext2D, mapProjection: MapProjection): void;
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
export declare class MapWaypointImageIcon<T extends MapWaypoint> extends AbstractMapWaypointIcon<T> {
    protected readonly img: HTMLImageElement;
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
    constructor(waypoint: T, priority: number, img: HTMLImageElement, width: number, height: number, options?: AbstractMapWaypointIconOptions);
    /** @inheritdoc */
    protected drawIconAt(context: CanvasRenderingContext2D, mapProjection: MapProjection, left: number, top: number): void;
}
/**
 * A waypoint icon with a sprite as the icon's graphic source.
 */
export declare class MapWaypointSpriteIcon<T extends MapWaypoint> extends AbstractMapWaypointIcon<T> {
    protected readonly img: HTMLImageElement;
    protected readonly frameWidth: number;
    protected readonly frameHeight: number;
    private spriteFrameHandler?;
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
     * @param spriteFrameHandler An optional handler to determine the sprite frame to draw.
     */
    constructor(waypoint: T, priority: number, img: HTMLImageElement, frameWidth: number, frameHeight: number, width: number, height: number, options?: AbstractMapWaypointIconOptions, spriteFrameHandler?: ((mapProjection: MapProjection) => number) | undefined);
    /** @inheritdoc */
    protected drawIconAt(context: CanvasRenderingContext2D, mapProjection: MapProjection, left: number, top: number): void;
    /**
     * Gets the sprite frame to render.
     * @param mapProjection The map projection to use.
     * @returns The sprite frame to render.
     */
    protected getSpriteFrame(mapProjection: MapProjection): number;
}
//# sourceMappingURL=MapWaypointIcon.d.ts.map