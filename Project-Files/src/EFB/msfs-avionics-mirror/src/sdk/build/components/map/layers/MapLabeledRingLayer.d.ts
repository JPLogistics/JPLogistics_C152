import { ReadonlyFloat64Array } from '../../../math/VecMath';
import { DisplayComponent, VNode } from '../../FSComponent';
import { MapLayer, MapLayerProps } from '../MapLayer';
import { MapProjection } from '../MapProjection';
import { MapSyncedCanvasLayer } from './MapSyncedCanvasLayer';
/**
 * A ring label.
 */
export interface MapLabeledRingLabel<T> {
    /** The content of this label. */
    readonly content: T;
    /**
     * Gets this label's anchor point. The anchor point is expressed relative to the label's width and height, such that
     * (0, 0) is located at the top-left corner and (1, 1) is located at the bottom-right corner.
     * @returns this label's anchor point.
     */
    getAnchor(): ReadonlyFloat64Array;
    /**
     * Gets the angle of the radial on which this label is positioned, in radians. Radial 0 is in the positive x
     * direction.
     * @returns the angle of the radial on which this label is positioned.
     */
    getRadialAngle(): number;
    /**
     * Gets the radial offset of this label from its parent ring, in pixels. Positive values denote displacement away
     * from the center of the ring.
     * @returns the radial offset of this label from its parent ring, in pixels.
     */
    getRadialOffset(): number;
    /**
     * Sets this label's anchor point. The anchor point is expressed relative to the label's width and height, such that
     * (0, 0) is located at the top-left corner and (1, 1) is located at the bottom-right corner.
     * @param anchor The new anchor point.
     */
    setAnchor(anchor: ReadonlyFloat64Array): void;
    /**
     * Sets the angle of the radial on which this label is positioned, in radians. Radial 0 is in the positive x
     * direction.
     * @param angle The new radial angle.
     */
    setRadialAngle(angle: number): void;
    /**
     * Sets the radial offset of this label from its parent ring, in pixels. Positive values denote displacement away
     * from the center of the ring.
     * @param offset The new radial offset.
     */
    setRadialOffset(offset: number): void;
}
/**
 * A map layer which displays a ring (circle) with one or more labels.
 */
export declare class MapLabeledRingLayer<T extends MapLayerProps<any>> extends MapLayer<T> {
    protected readonly labelContainerRef: import("../../FSComponent").NodeReference<HTMLDivElement>;
    protected readonly canvasLayerRef: import("../../FSComponent").NodeReference<MapSyncedCanvasLayer<MapLayerProps<any>>>;
    private readonly center;
    private radius;
    private strokeWidth;
    private strokeStyle;
    private strokeDash;
    private outlineWidth;
    private outlineStyle;
    private outlineDash;
    private needUpdateRingPosition;
    protected isInit: boolean;
    private readonly labels;
    /**
     * Gets the center position of this layer's ring, in pixels.
     * @returns the center position of this layer's ring.
     */
    getRingCenter(): ReadonlyFloat64Array;
    /**
     * Gets the radius of this layer's ring, in pixels.
     * @returns the radius of this layer's ring.
     */
    getRingRadius(): number;
    /**
     * Sets the center and radius of this layer's ring.
     * @param center The new center, in pixels.
     * @param radius The new radius, in pixels.
     */
    setRingPosition(center: ReadonlyFloat64Array, radius: number): void;
    /**
     * Sets the styling for this layer's ring stroke. Any style that is not explicitly defined will be left unchanged.
     * @param width The new stroke width.
     * @param style The new stroke style.
     * @param dash The new stroke dash.
     */
    setRingStrokeStyles(width?: number, style?: string | CanvasGradient | CanvasPattern, dash?: number[]): void;
    /**
     * Sets the styling for this layer's ring outline. Any style that is not explicitly defined will be left unchanged.
     * @param width The new outline width.
     * @param style The new outline style.
     * @param dash The new outline dash.
     */
    setRingOutlineStyles(width?: number, style?: string | CanvasGradient | CanvasPattern, dash?: number[]): void;
    /**
     * Creates a ring label. Labels can only be created after this layer has been rendered.
     * @param content The content of the new label.
     * @returns the newly created ring label, or null if a label could not be created.
     */
    createLabel<L extends string | number | HTMLElement | DisplayComponent<any> | SVGElement>(content: VNode): MapLabeledRingLabel<L> | null;
    /** @inheritdoc */
    onVisibilityChanged(isVisible: boolean): void;
    /** @inheritdoc */
    onAttached(): void;
    /** @inheritdoc */
    onMapProjectionChanged(mapProjection: MapProjection, changeFlags: number): void;
    /** @inheritdoc */
    onUpdated(time: number, elapsed: number): void;
    /**
     * Updates this layer according to its current visibility.
     */
    protected updateFromVisibility(): void;
    /**
     * Updates the position of this layer's ring.
     */
    protected updateRingPosition(): void;
    /**
     * Draws this layer's ring to canvas.
     */
    private drawRing;
    /**
     * Checks whether this layer's ring is in view.
     * @returns whether this layer's ring is in view.
     */
    protected isRingInView(): boolean;
    /**
     * Applies a stroke to a canvas rendering context.
     * @param context The canvas to which to apply a stroke.
     * @param lineWidth The stroke width.
     * @param strokeStyle The stroke style.
     * @param dash The stroke dash.
     */
    protected applyStrokeToContext(context: CanvasRenderingContext2D, lineWidth: number, strokeStyle: string | CanvasGradient | CanvasPattern, dash: number[]): void;
    /**
     * Updates the position of this layer's labels based on the position of the ring.
     */
    private updateLabelPositions;
    /** @inheritdoc */
    render(): VNode;
}
//# sourceMappingURL=MapLabeledRingLayer.d.ts.map