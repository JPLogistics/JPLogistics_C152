import { GeoPoint, GeoPointInterface, GeoPointReadOnly } from '../../utils/geo/GeoPoint';
import { MapProjection } from './MapProjection';
/**
 * A text label to be displayed on a map.
 */
export interface MapTextLabel {
    /** The text of this label. */
    readonly text: string;
    /** The render priority of this label. */
    readonly priority: number;
    /**
     * Draws this label to a canvas.
     * @param context The canvas rendering context to use to draw.
     * @param mapProjection The projection to use to project the location of the label.
     */
    draw(context: CanvasRenderingContext2D, mapProjection: MapProjection): void;
}
/**
 * Options for a AbstractMapTextLabel.
 */
export interface AbstractMapTextLabelOptions {
    /**
     * The anchor point of the label, expressed relative to the width/height of the label. [0, 0] is the top-left
     * corner, and [1, 1] is the bottom-right corner.
     */
    anchor?: Float64Array;
    /** The font type of the label. */
    font?: string;
    /** The font size of the label, in pixels. */
    fontSize?: number;
    /** The font color of the label. */
    fontColor?: string;
    /** The font outline width of the label, in pixels. */
    fontOutlineWidth?: number;
    /** The font outline color of the label. */
    fontOutlineColor?: string;
    /** Whether to show the background for the label. */
    showBg?: boolean;
    /** The label's background color. */
    bgColor?: string;
    /** The padding of the label's background, in pixels. Expressed as [left, top, right, bottom]. */
    bgPadding?: number[];
    /** The border radius of the label's background. */
    bgBorderRadius?: number;
    /** The outline width of the label's background. */
    bgOutlineWidth?: number;
    /** The outline color of the label's background. */
    bgOutlineColor?: string;
}
/**
 * An abstract implementation of a map text label.
 */
export declare abstract class AbstractMapTextLabel implements MapTextLabel {
    readonly text: string;
    readonly priority: number;
    protected static readonly tempVec2: Float64Array;
    /**
     * The anchor point of this label, expressed relative to this label's width/height. [0, 0] is the top-left corner,
     * and [1, 1] is the bottom-right corner.
     */
    readonly anchor: Float64Array;
    /** The font type of this label. */
    readonly font: string;
    /** The font size of this label, in pixels. */
    readonly fontSize: number;
    /** The font color of this label. */
    readonly fontColor: string;
    /** The font outline width of this label, in pixels. */
    readonly fontOutlineWidth: number;
    /** The font outline color of this label. */
    readonly fontOutlineColor: string;
    /** Whether to show the background for this label. */
    readonly showBg: boolean;
    /** This label's background color. */
    readonly bgColor: string;
    /** The padding of this label's background, in pixels. Expressed as [top, right, bottom, left]. */
    readonly bgPadding: Float64Array;
    /** The border radius of this label's background. */
    readonly bgBorderRadius: number;
    /** The outline width of this label's background. */
    readonly bgOutlineWidth: number;
    /** The outline color of this label's background. */
    readonly bgOutlineColor: string;
    /**
     * Constructor.
     * @param text The text of this label.
     * @param priority The render priority of this label.
     * @param options Options with which to initialize this label.
     */
    constructor(text: string, priority: number, options?: AbstractMapTextLabelOptions);
    draw(context: CanvasRenderingContext2D, mapProjection: MapProjection): void;
    /**
     * Gets the projected position of the label, in pixels.
     * @param mapProjection The map projection to use.
     * @param out The vector to which to write the result.
     * @returns The projected position of the label.
     */
    protected abstract getPosition(mapProjection: MapProjection, out: Float64Array): Float64Array;
    /**
     * Loads this label's text style to a canvas rendering context.
     * @param context The canvas rendering context to use.
     */
    protected setTextStyle(context: CanvasRenderingContext2D): void;
    /**
     * Draws this label's text to a canvas.
     * @param context The canvas rendering context.
     * @param centerX The x-coordinate of the center of the label, in pixels.
     * @param centerY the y-coordinate of the center of the label, in pixels.
     */
    protected drawText(context: CanvasRenderingContext2D, centerX: number, centerY: number): void;
    /**
     * Draws this label's background to a canvas.
     * @param context The canvas rendering context.
     * @param centerX The x-coordinate of the center of the label, in pixels.
     * @param centerY the y-coordinate of the center of the label, in pixels.
     * @param width The width of the background, in pixels.
     * @param height The height of the background, in pixels.
     */
    protected drawBackground(context: CanvasRenderingContext2D, centerX: number, centerY: number, width: number, height: number): void;
    /**
     * Loads the path of this label's background to a canvas rendering context.
     * @param context The canvas rendering context to use.
     * @param left The x-coordinate of the left edge of the background, in pixels.
     * @param top The y-coordinate of the top edge of the background, in pixels.
     * @param width The width of the background, in pixels.
     * @param height The height of the background, in pixels.
     * @param radius The border radius of the background, in pixels.
     */
    protected loadBackgroundPath(context: CanvasRenderingContext2D, left: number, top: number, width: number, height: number, radius: number): void;
}
/**
 * Options for a MapLocationTextLabel.
 */
export interface MapLocationTextLabelOptions extends AbstractMapTextLabelOptions {
    /** The offset of the label, in pixels, from its projected position. */
    offset?: Float64Array;
}
/**
 * A text label associated with a specific geographic location.
 */
export declare class MapLocationTextLabel extends AbstractMapTextLabel {
    protected readonly _location: GeoPoint;
    /** The geographic location of this label. */
    readonly location: GeoPointReadOnly;
    readonly offset: Float64Array;
    /**
     * Constructor.
     * @param text The text of this label.
     * @param priority The render priority of this label.
     * @param location The geographic location of this label.
     * @param options Options with which to initialize this label.
     */
    constructor(text: string, priority: number, location: GeoPointInterface, options?: MapLocationTextLabelOptions);
    protected getPosition(mapProjection: MapProjection, out: Float64Array): Float64Array;
}
//# sourceMappingURL=MapTextLabel.d.ts.map