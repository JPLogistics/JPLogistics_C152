import { MapProjectionChangeType } from '../MapProjection';
import { GeoPoint } from '../../../geo/GeoPoint';
import { MercatorProjection } from '../../../geo/GeoProjection';
import { Vec2Math } from '../../../math/VecMath';
import { MapCanvasLayer, MapCanvasLayerCanvasInstanceClass } from './MapCanvasLayer';
import { BitFlags } from '../../../math/BitFlags';
/**
 * Implementation of MapCachedCanvasLayerReference.
 */
class MapCachedCanvasLayerReferenceClass {
    constructor() {
        this._center = new GeoPoint(0, 0);
        this._scaleFactor = 1;
        this._rotation = 0;
    }
    /** @inheritdoc */
    get center() {
        return this._center.readonly;
    }
    /** @inheritdoc */
    get scaleFactor() {
        return this._scaleFactor;
    }
    /** @inheritdoc */
    get rotation() {
        return this._rotation;
    }
    /**
     * Syncs this reference with the current state of a map projection.
     * @param mapProjection The map projection with which to sync.
     */
    syncWithMapProjection(mapProjection) {
        this._center.set(mapProjection.getCenter());
        this._scaleFactor = mapProjection.getScaleFactor();
        this._rotation = mapProjection.getRotation();
    }
    /**
     * Syncs this reference with another reference.
     * @param reference - the reference with which to sync.
     */
    syncWithReference(reference) {
        this._center.set(reference.center);
        this._scaleFactor = reference.scaleFactor;
        this._rotation = reference.rotation;
    }
}
/**
 * Implementation of MapCachedCanvasLayerTransform.
 */
class MapCachedCanvasLayerTransformClass {
    constructor() {
        this._scale = 0;
        this._rotation = 0;
        this._translation = new Float64Array(2);
        this._margin = 0;
        this._marginRemaining = 0;
    }
    /** @inheritdoc */
    get scale() {
        return this._scale;
    }
    /** @inheritdoc */
    get rotation() {
        return this._rotation;
    }
    /** @inheritdoc */
    get translation() {
        return this._translation;
    }
    /** @inheritdoc */
    get margin() {
        return this._margin;
    }
    /** @inheritdoc */
    get marginRemaining() {
        return this._marginRemaining;
    }
    /**
     * Updates this transform given the current map projection and a reference.
     * @param mapProjection The current map projection.
     * @param reference The reference to use.
     * @param referenceMargin The reference margin, in pixels.
     */
    update(mapProjection, reference, referenceMargin) {
        this._scale = mapProjection.getScaleFactor() / reference.scaleFactor;
        this._rotation = mapProjection.getRotation() - reference.rotation;
        mapProjection.project(reference.center, this._translation);
        Vec2Math.sub(this._translation, mapProjection.getCenterProjected(), this._translation);
        this._margin = referenceMargin * this._scale;
        this._marginRemaining = this._margin - Math.max(Math.abs(this._translation[0]), Math.abs(this._translation[1]));
    }
    /**
     * Copies another transform's parameters to this one.
     * @param other The other transform.
     */
    copyFrom(other) {
        this._scale = other.scale;
        this._rotation = other.rotation;
        this._translation.set(other.translation);
        this._margin = other.margin;
    }
}
/**
 * An implementation of MapCachedCanvasLayerCanvasInstance.
 */
export class MapCachedCanvasLayerCanvasInstanceClass extends MapCanvasLayerCanvasInstanceClass {
    /**
     * Creates a new canvas instance.
     * @param canvas The canvas element.
     * @param context The canvas 2D rendering context.
     * @param isDisplayed Whether the canvas is displayed.
     * @param getReferenceMargin A function which gets this canvas instance's reference margin, in pixels. The reference
     * margin is the maximum amount of translation allowed without invalidation at a scale factor of 1.
     */
    constructor(canvas, context, isDisplayed, getReferenceMargin) {
        super(canvas, context, isDisplayed);
        this.getReferenceMargin = getReferenceMargin;
        this._reference = new MapCachedCanvasLayerReferenceClass();
        this._transform = new MapCachedCanvasLayerTransformClass();
        this._isInvalid = false;
        this._geoProjection = new MercatorProjection();
    }
    /** @inheritdoc */
    get reference() {
        return this._reference;
    }
    /** @inheritdoc */
    get transform() {
        return this._transform;
    }
    /** @inheritdoc */
    get isInvalid() {
        return this._isInvalid;
    }
    /** @inheritdoc */
    get geoProjection() {
        return this._geoProjection;
    }
    /** @inheritdoc */
    syncWithMapProjection(mapProjection) {
        const projectedCenter = Vec2Math.set(this.canvas.width / 2, this.canvas.height / 2, MapCachedCanvasLayerCanvasInstanceClass.tempVec2_1);
        this._reference.syncWithMapProjection(mapProjection);
        this._geoProjection.copyParametersFrom(mapProjection.getGeoProjection()).setTranslation(projectedCenter);
        this._transform.update(mapProjection, this.reference, this.getReferenceMargin());
        this._isInvalid = false;
        if (this.isDisplayed) {
            this.transformCanvasElement();
        }
    }
    /** @inheritdoc */
    syncWithCanvasInstance(other) {
        this._reference.syncWithReference(other.reference);
        this._geoProjection.copyParametersFrom(other.geoProjection);
        this._transform.copyFrom(other.transform);
        this._isInvalid = other.isInvalid;
        if (this.isDisplayed && !this._isInvalid) {
            this.transformCanvasElement();
        }
    }
    /**
     * Updates this canvas instance's transform given the current map projection.
     * @param mapProjection The current map projection.
     */
    updateTransform(mapProjection) {
        this._transform.update(mapProjection, this.reference, this.getReferenceMargin());
        if (!this._isInvalid) {
            const scaleFactorRatio = mapProjection.getScaleFactor() / this._reference.scaleFactor;
            this._isInvalid = scaleFactorRatio >= MapCachedCanvasLayerCanvasInstanceClass.SCALE_INVALIDATION_THRESHOLD
                || scaleFactorRatio <= 1 / MapCachedCanvasLayerCanvasInstanceClass.SCALE_INVALIDATION_THRESHOLD
                || this._transform.marginRemaining < 0;
        }
        if (this.isDisplayed && !this._isInvalid) {
            this.transformCanvasElement();
        }
    }
    /**
     * Transforms this instance's canvas element.
     */
    transformCanvasElement() {
        const transform = this.transform;
        const offsetX = transform.translation[0] / transform.scale;
        const offsetY = transform.translation[1] / transform.scale;
        this.canvas.style.transform = `scale(${transform.scale.toFixed(3)}) translate(${offsetX.toFixed(1)}px, ${offsetY.toFixed(1)}px) rotate(${(transform.rotation * Avionics.Utils.RAD2DEG).toFixed(2)}deg)`;
    }
    /** @inheritdoc */
    invalidate() {
        this._isInvalid = true;
        this.clear();
    }
}
MapCachedCanvasLayerCanvasInstanceClass.SCALE_INVALIDATION_THRESHOLD = 1.2;
MapCachedCanvasLayerCanvasInstanceClass.tempVec2_1 = new Float64Array(2);
/**
 * A canvas map layer whose image can be cached and transformed as the map projection changes.
 */
export class MapCachedCanvasLayer extends MapCanvasLayer {
    /** @inheritdoc */
    constructor(props) {
        super(props);
        this.size = 0;
        this.referenceMargin = 0;
        this.needUpdateTransforms = false;
        this.props.overdrawFactor = Math.max(1, this.props.overdrawFactor);
    }
    /**
     * Gets the size, in pixels, of this layer's canvas.
     * @returns the size of this layer's canvas.
     */
    getSize() {
        return this.size;
    }
    /**
     * Gets the reference translation margin, in pixels, of this layer's display canvas. This value is the maximum amount
     * the display canvas can be translated in the x or y direction at a scale factor of 1 without invalidation.
     * @returns the reference translation margin of this layer's display canvas.
     */
    getReferenceMargin() {
        return this.referenceMargin;
    }
    /** @inheritdoc */
    onAttached() {
        super.onAttached();
        this.updateFromProjectedSize(this.props.mapProjection.getProjectedSize());
        this.needUpdateTransforms = true;
    }
    /** @inheritdoc */
    createCanvasInstance(canvas, context, isDisplayed) {
        return new MapCachedCanvasLayerCanvasInstanceClass(canvas, context, isDisplayed, this.getReferenceMargin.bind(this));
    }
    /**
     * Updates this layer according to the current size of the projected map window.
     * @param projectedSize The size of the projected map window.
     */
    updateFromProjectedSize(projectedSize) {
        const projectedWidth = projectedSize[0];
        const projectedHeight = projectedSize[1];
        const diag = Math.hypot(projectedWidth, projectedHeight);
        this.size = diag * this.props.overdrawFactor;
        this.referenceMargin = (this.size - diag) / 2;
        this.setWidth(this.size);
        this.setHeight(this.size);
        const posX = (projectedWidth - this.size) / 2;
        const posY = (projectedHeight - this.size) / 2;
        const displayCanvas = this.display.canvas;
        displayCanvas.style.left = `${posX}px`;
        displayCanvas.style.top = `${posY}px`;
    }
    /** @inheritdoc */
    onMapProjectionChanged(mapProjection, changeFlags) {
        if (BitFlags.isAll(changeFlags, MapProjectionChangeType.ProjectedSize)) {
            this.updateFromProjectedSize(mapProjection.getProjectedSize());
            this.display.invalidate();
            this.buffer.invalidate();
        }
        this.needUpdateTransforms = true;
    }
    /** @inheritdoc */
    onUpdated(time, elapsed) {
        super.onUpdated(time, elapsed);
        if (!this.needUpdateTransforms) {
            return;
        }
        this.updateTransforms();
    }
    /**
     * Updates this layer's canvas instances' transforms.
     */
    updateTransforms() {
        const mapProjection = this.props.mapProjection;
        const display = this.display;
        const buffer = this.buffer;
        display.updateTransform(mapProjection);
        buffer.updateTransform(mapProjection);
        this.needUpdateTransforms = false;
    }
}
