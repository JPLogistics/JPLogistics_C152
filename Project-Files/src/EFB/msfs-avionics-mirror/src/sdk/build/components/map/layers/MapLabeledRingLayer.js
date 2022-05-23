import { BitFlags } from '../../../math/BitFlags';
import { Vec2Math } from '../../../math/VecMath';
import { FSComponent } from '../../FSComponent';
import { MapLayer } from '../MapLayer';
import { MapProjectionChangeType } from '../MapProjection';
import { MapSyncedCanvasLayer } from './MapSyncedCanvasLayer';
/**
 * A map layer which displays a ring (circle) with one or more labels.
 */
export class MapLabeledRingLayer extends MapLayer {
    constructor() {
        super(...arguments);
        this.labelContainerRef = FSComponent.createRef();
        this.canvasLayerRef = FSComponent.createRef();
        this.center = new Float64Array(2);
        this.radius = 0;
        this.strokeWidth = 0;
        this.strokeStyle = '';
        this.strokeDash = [];
        this.outlineWidth = 0;
        this.outlineStyle = '';
        this.outlineDash = [];
        this.needUpdateRingPosition = false;
        this.isInit = false;
        this.labels = [];
    }
    /**
     * Gets the center position of this layer's ring, in pixels.
     * @returns the center position of this layer's ring.
     */
    getRingCenter() {
        return this.center;
    }
    /**
     * Gets the radius of this layer's ring, in pixels.
     * @returns the radius of this layer's ring.
     */
    getRingRadius() {
        return this.radius;
    }
    /**
     * Sets the center and radius of this layer's ring.
     * @param center The new center, in pixels.
     * @param radius The new radius, in pixels.
     */
    setRingPosition(center, radius) {
        if (Vec2Math.equals(this.center, center) && radius === this.radius) {
            return;
        }
        this.center.set(center);
        this.radius = radius;
        this.needUpdateRingPosition = true;
    }
    /**
     * Sets the styling for this layer's ring stroke. Any style that is not explicitly defined will be left unchanged.
     * @param width The new stroke width.
     * @param style The new stroke style.
     * @param dash The new stroke dash.
     */
    setRingStrokeStyles(width, style, dash) {
        this.strokeWidth = width !== null && width !== void 0 ? width : this.strokeWidth;
        this.strokeStyle = style !== null && style !== void 0 ? style : this.strokeStyle;
        this.strokeDash = dash !== null && dash !== void 0 ? dash : this.strokeDash;
        this.needUpdateRingPosition = true;
    }
    /**
     * Sets the styling for this layer's ring outline. Any style that is not explicitly defined will be left unchanged.
     * @param width The new outline width.
     * @param style The new outline style.
     * @param dash The new outline dash.
     */
    setRingOutlineStyles(width, style, dash) {
        this.outlineWidth = width !== null && width !== void 0 ? width : this.outlineWidth;
        this.outlineStyle = style !== null && style !== void 0 ? style : this.outlineStyle;
        this.outlineDash = dash !== null && dash !== void 0 ? dash : this.outlineDash;
        this.needUpdateRingPosition = true;
    }
    /**
     * Creates a ring label. Labels can only be created after this layer has been rendered.
     * @param content The content of the new label.
     * @returns the newly created ring label, or null if a label could not be created.
     */
    createLabel(content) {
        if (!this.labelContainerRef.instance) {
            return null;
        }
        const wrapperRef = FSComponent.createRef();
        FSComponent.render(FSComponent.buildComponent("div", { ref: wrapperRef, style: 'position: absolute;' }, content), this.labelContainerRef.instance);
        const label = new MapLabeledRingLabelClass(content.instance, wrapperRef.instance);
        label.setRingPosition(this.center, this.radius);
        this.labels.push(label);
        return label;
    }
    /** @inheritdoc */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onVisibilityChanged(isVisible) {
        if (this.isInit) {
            this.updateFromVisibility();
        }
    }
    /** @inheritdoc */
    onAttached() {
        this.canvasLayerRef.instance.onAttached();
        this.isInit = true;
        this.updateFromVisibility();
        this.needUpdateRingPosition = true;
    }
    /** @inheritdoc */
    onMapProjectionChanged(mapProjection, changeFlags) {
        this.canvasLayerRef.instance.onMapProjectionChanged(mapProjection, changeFlags);
        if (BitFlags.isAll(changeFlags, MapProjectionChangeType.ProjectedSize)) {
            // resizing the map will cause the canvas layer to clear itself, so we need to force a redraw.
            this.needUpdateRingPosition = true;
        }
    }
    /** @inheritdoc */
    onUpdated(time, elapsed) {
        if (!this.isVisible()) {
            return;
        }
        if (this.needUpdateRingPosition) {
            this.updateRingPosition();
            this.needUpdateRingPosition = false;
        }
        this.canvasLayerRef.instance.onUpdated(time, elapsed);
    }
    /**
     * Updates this layer according to its current visibility.
     */
    updateFromVisibility() {
        const isVisible = this.isVisible();
        this.canvasLayerRef.instance.setVisible(isVisible);
        this.labelContainerRef.instance.style.display = isVisible ? 'block' : 'none';
    }
    /**
     * Updates the position of this layer's ring.
     */
    updateRingPosition() {
        this.drawRing();
        this.updateLabelPositions();
    }
    /**
     * Draws this layer's ring to canvas.
     */
    drawRing() {
        const canvasDisplay = this.canvasLayerRef.instance.display;
        canvasDisplay.clear();
        if (!this.isRingInView()) {
            return;
        }
        canvasDisplay.context.beginPath();
        canvasDisplay.context.arc(this.center[0], this.center[1], this.radius, 0, Math.PI * 2);
        if (this.outlineWidth > 0) {
            this.applyStrokeToContext(canvasDisplay.context, this.strokeWidth + this.outlineWidth * 2, this.outlineStyle, this.outlineDash);
        }
        this.applyStrokeToContext(canvasDisplay.context, this.strokeWidth, this.strokeStyle, this.strokeDash);
    }
    /**
     * Checks whether this layer's ring is in view.
     * @returns whether this layer's ring is in view.
     */
    isRingInView() {
        const centerX = this.center[0];
        const centerY = this.center[1];
        const innerHalfLength = this.radius / Math.SQRT2;
        const innerLeft = centerX - innerHalfLength;
        const innerRight = centerX + innerHalfLength;
        const innerTop = centerY - innerHalfLength;
        const innerBottom = centerY + innerHalfLength;
        const outerLeft = centerX - this.radius;
        const outerRight = centerX + this.radius;
        const outerTop = centerY - this.radius;
        const outerBottom = centerY + this.radius;
        const width = this.props.mapProjection.getProjectedSize()[0];
        const height = this.props.mapProjection.getProjectedSize()[1];
        if (innerLeft < 0 && innerRight > width && innerTop < 0 && innerBottom > height) {
            return false;
        }
        if (outerLeft > width || outerRight < 0 || outerTop > height || outerBottom < 0) {
            return false;
        }
        return true;
    }
    /**
     * Applies a stroke to a canvas rendering context.
     * @param context The canvas to which to apply a stroke.
     * @param lineWidth The stroke width.
     * @param strokeStyle The stroke style.
     * @param dash The stroke dash.
     */
    applyStrokeToContext(context, lineWidth, strokeStyle, dash) {
        context.lineWidth = lineWidth;
        context.strokeStyle = strokeStyle;
        context.setLineDash(dash);
        context.stroke();
    }
    /**
     * Updates the position of this layer's labels based on the position of the ring.
     */
    updateLabelPositions() {
        const len = this.labels.length;
        for (let i = 0; i < len; i++) {
            this.labels[i].setRingPosition(this.center, this.radius);
        }
    }
    /** @inheritdoc */
    render() {
        return (FSComponent.buildComponent(FSComponent.Fragment, null,
            FSComponent.buildComponent(MapSyncedCanvasLayer, { ref: this.canvasLayerRef, model: this.props.model, mapProjection: this.props.mapProjection }),
            FSComponent.buildComponent("div", { ref: this.labelContainerRef, style: 'position: absolute; left: 0; top: 0; width: 100%; height: 100%;' })));
    }
}
/**
 * An implementation of {@link MapLabeledRingLabel}.
 */
class MapLabeledRingLabelClass {
    /**
     * Constructor.
     * @param content The content of this label.
     * @param wrapper The wrapper for this label.
     */
    constructor(content, wrapper) {
        this.content = content;
        this.wrapper = wrapper;
        this.center = new Float64Array(2);
        this.radius = 0;
        this.anchor = new Float64Array(2);
        this.radialAngle = 0;
        this.radialOffset = 0;
    }
    /** @inheritdoc */
    getAnchor() {
        return this.anchor;
    }
    /** @inheritdoc */
    getRadialAngle() {
        return this.radialAngle;
    }
    /** @inheritdoc */
    getRadialOffset() {
        return this.radialOffset;
    }
    /** @inheritdoc */
    setAnchor(anchor) {
        this.anchor.set(anchor);
        this.wrapper.style.transform = `translate(${-anchor[0] * 100}%, ${-anchor[1] * 100}%)`;
    }
    /** @inheritdoc */
    setRadialAngle(angle) {
        if (this.radialAngle === angle) {
            return;
        }
        this.radialAngle = angle;
        this.updatePosition();
    }
    /** @inheritdoc */
    setRadialOffset(offset) {
        if (this.radialOffset === offset) {
            return;
        }
        this.radialOffset = offset;
        this.updatePosition();
    }
    /**
     * Updates this label with the center and radius of its parent ring.
     * @param center The center of the ring, in pixels.
     * @param radius The radius of the ring, in pixels.
     */
    setRingPosition(center, radius) {
        if (Vec2Math.equals(this.center, center) && radius === this.radius) {
            return;
        }
        this.center.set(center);
        this.radius = radius;
        this.updatePosition();
    }
    /**
     * Updates this label's position.
     */
    updatePosition() {
        const pos = MapLabeledRingLabelClass.tempVec2_1;
        Vec2Math.setFromPolar(this.radius + this.radialOffset, this.radialAngle, pos);
        Vec2Math.add(this.center, pos, pos);
        this.wrapper.style.left = `${pos[0]}px`;
        this.wrapper.style.top = `${pos[1]}px`;
    }
}
MapLabeledRingLabelClass.tempVec2_1 = new Float64Array(2);
