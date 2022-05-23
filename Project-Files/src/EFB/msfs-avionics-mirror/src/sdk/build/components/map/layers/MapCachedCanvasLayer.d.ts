import { MapProjection } from '../MapProjection';
import { GeoPointReadOnly } from '../../../geo/GeoPoint';
import { GeoProjection } from '../../../geo/GeoProjection';
import { ReadonlyFloat64Array } from '../../../math/VecMath';
import { MapCanvasLayer, MapCanvasLayerCanvasInstance, MapCanvasLayerCanvasInstanceClass } from './MapCanvasLayer';
import { MapLayerProps } from '../MapLayer';
/**
 * Properties for a MapCachedCanvasLayer.
 */
export interface MapCachedCanvasLayerProps<M> extends MapLayerProps<M> {
    /** Whether to include an offscreen buffer. Must be true. */
    useBuffer: true;
    /** The factor by which the canvas should be overdrawn. Values less than 1 will be clamped to 1. */
    overdrawFactor: number;
}
/**
 * A description of the reference projection of a MapCachedCanvasLayer.
 */
export interface MapCachedCanvasLayerReference {
    /** The map center of this reference. */
    readonly center: GeoPointReadOnly;
    /** The projection scale factor of this reference. */
    readonly scaleFactor: number;
    /** The rotation angle, in radians, of this reference. */
    readonly rotation: number;
}
/**
 * A description of the transformation of a MapCachedCanvasLayer's canvas element.
 */
export interface MapCachedCanvasLayerTransform {
    /** The scaling factor of this transform. */
    readonly scale: number;
    /** The rotation angle, in radians, of this transform. */
    readonly rotation: number;
    /** The translation, in pixels, of this transform. */
    readonly translation: Float64Array;
    /**
     * The total margin, in pixels, available for translation without invalidating the canvas with this transform's
     * scale factor taken into account.
     */
    readonly margin: number;
    /**
     * The remaining margin, in pixels, available for translation without invalidating the canvas given this transform's
     * current translation and scale factor.
     */
    readonly marginRemaining: number;
}
/**
 * An instance of a canvas within a MapCachedCanvasLayer.
 */
export interface MapCachedCanvasLayerCanvasInstance extends MapCanvasLayerCanvasInstance {
    /**
     * This instance's map projection reference. The rendering of items to this instance's canvas is based on this
     * reference.
     */
    readonly reference: MapCachedCanvasLayerReference;
    /** This instance's transform. */
    readonly transform: MapCachedCanvasLayerTransform;
    /** Whether this instance's transform is invalid. */
    readonly isInvalid: boolean;
    /** The projection used to draw this instance's canvas image. */
    readonly geoProjection: GeoProjection;
    /**
     * Syncs this canvas instance with the current map projection.
     * @param mapProjection The current map projection.
     */
    syncWithMapProjection(mapProjection: MapProjection): void;
    /**
     * Syncs this canvas instance with another canvas instance.
     * @param other - the canvas instance with which to sync.
     */
    syncWithCanvasInstance(other: MapCachedCanvasLayerCanvasInstance): void;
    /**
     * Invalidates this canvas instance. This also clears the canvas.
     */
    invalidate(): void;
}
/**
 * An implementation of MapCachedCanvasLayerCanvasInstance.
 */
export declare class MapCachedCanvasLayerCanvasInstanceClass extends MapCanvasLayerCanvasInstanceClass implements MapCachedCanvasLayerCanvasInstance {
    private readonly getReferenceMargin;
    private static readonly SCALE_INVALIDATION_THRESHOLD;
    private static readonly tempVec2_1;
    private readonly _reference;
    private readonly _transform;
    private _isInvalid;
    private readonly _geoProjection;
    /**
     * Creates a new canvas instance.
     * @param canvas The canvas element.
     * @param context The canvas 2D rendering context.
     * @param isDisplayed Whether the canvas is displayed.
     * @param getReferenceMargin A function which gets this canvas instance's reference margin, in pixels. The reference
     * margin is the maximum amount of translation allowed without invalidation at a scale factor of 1.
     */
    constructor(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, isDisplayed: boolean, getReferenceMargin: () => number);
    /** @inheritdoc */
    get reference(): MapCachedCanvasLayerReference;
    /** @inheritdoc */
    get transform(): MapCachedCanvasLayerTransform;
    /** @inheritdoc */
    get isInvalid(): boolean;
    /** @inheritdoc */
    get geoProjection(): GeoProjection;
    /** @inheritdoc */
    syncWithMapProjection(mapProjection: MapProjection): void;
    /** @inheritdoc */
    syncWithCanvasInstance(other: MapCachedCanvasLayerCanvasInstance): void;
    /**
     * Updates this canvas instance's transform given the current map projection.
     * @param mapProjection The current map projection.
     */
    updateTransform(mapProjection: MapProjection): void;
    /**
     * Transforms this instance's canvas element.
     */
    protected transformCanvasElement(): void;
    /** @inheritdoc */
    invalidate(): void;
}
/**
 * A canvas map layer whose image can be cached and transformed as the map projection changes.
 */
export declare class MapCachedCanvasLayer<P extends MapCachedCanvasLayerProps<any> = MapCachedCanvasLayerProps<any>> extends MapCanvasLayer<P, MapCachedCanvasLayerCanvasInstance> {
    private size;
    private referenceMargin;
    private needUpdateTransforms;
    /** @inheritdoc */
    constructor(props: P);
    /**
     * Gets the size, in pixels, of this layer's canvas.
     * @returns the size of this layer's canvas.
     */
    getSize(): number;
    /**
     * Gets the reference translation margin, in pixels, of this layer's display canvas. This value is the maximum amount
     * the display canvas can be translated in the x or y direction at a scale factor of 1 without invalidation.
     * @returns the reference translation margin of this layer's display canvas.
     */
    getReferenceMargin(): number;
    /** @inheritdoc */
    onAttached(): void;
    /** @inheritdoc */
    protected createCanvasInstance(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, isDisplayed: boolean): MapCachedCanvasLayerCanvasInstanceClass;
    /**
     * Updates this layer according to the current size of the projected map window.
     * @param projectedSize The size of the projected map window.
     */
    protected updateFromProjectedSize(projectedSize: ReadonlyFloat64Array): void;
    /** @inheritdoc */
    onMapProjectionChanged(mapProjection: MapProjection, changeFlags: number): void;
    /** @inheritdoc */
    onUpdated(time: number, elapsed: number): void;
    /**
     * Updates this layer's canvas instances' transforms.
     */
    protected updateTransforms(): void;
}
//# sourceMappingURL=MapCachedCanvasLayer.d.ts.map