/// <reference types="msfstypes/JS/common" />
/// <reference types="msfstypes/JS/Types" />
/// <reference types="msfstypes/JS/NetBingMap" />
import { FSComponent, BitFlags, UnitType, Vec2Math, Vec2Subject } from '../../../.';
import { BingComponent } from '../../bing';
import { MapProjectionChangeType } from '../MapProjection';
import { MapLayer } from '../MapLayer';
/**
 * A FSComponent that display the MSFS Bing Map, weather radar, and 3D terrain.
 */
export class MapBingLayer extends MapLayer {
    constructor() {
        super(...arguments);
        this.wrapperRef = FSComponent.createRef();
        this.bingRef = FSComponent.createRef();
        this.resolutionSub = Vec2Subject.createFromVector(new Float64Array([1024, 1024]));
        this.size = 0;
        this.needUpdate = false;
    }
    /** @inheritdoc */
    onAfterRender() {
        this.updateFromProjectedSize(this.props.mapProjection.getProjectedSize());
        if (this.props.wxrMode !== undefined) {
            this.props.wxrMode.sub(() => {
                this.updateFromProjectedSize(this.props.mapProjection.getProjectedSize());
                this.needUpdate = true;
            });
        }
    }
    /** @inheritdoc */
    onWake() {
        this.bingRef.instance.wake();
    }
    /** @inheritdoc */
    onSleep() {
        this.bingRef.instance.sleep();
    }
    /**
     * Updates this layer according to the current size of the projected map window.
     * @param projectedSize The size of the projected map window.
     */
    updateFromProjectedSize(projectedSize) {
        if (this.props.wxrMode && this.props.wxrMode.get().mode === EWeatherRadar.HORIZONTAL) {
            const offsetSize = new Float64Array([projectedSize[0], projectedSize[1]]);
            const offset = this.props.mapProjection.getTargetProjectedOffset();
            offsetSize[0] += offset[0];
            offsetSize[1] += offset[1];
            this.size = this.getSize(offsetSize);
            const offsetX = ((projectedSize[0] - this.size) / 2) + offset[0];
            const offsetY = ((projectedSize[1] - this.size) / 2) + offset[1];
            this.wrapperRef.instance.style.left = `${offsetX}px`;
            this.wrapperRef.instance.style.top = `${offsetY}px`;
            this.wrapperRef.instance.style.width = `${this.size}px`;
            this.wrapperRef.instance.style.height = `${this.size}px`;
        }
        else {
            this.size = this.getSize(projectedSize);
            const offsetX = (projectedSize[0] - this.size) / 2;
            const offsetY = (projectedSize[1] - this.size) / 2;
            this.wrapperRef.instance.style.left = `${offsetX}px`;
            this.wrapperRef.instance.style.top = `${offsetY}px`;
            this.wrapperRef.instance.style.width = `${this.size}px`;
            this.wrapperRef.instance.style.height = `${this.size}px`;
        }
        this.resolutionSub.set(this.size, this.size);
    }
    /**
     * Gets an appropriate size, in pixels, for this Bing layer given specific map projection window dimensions.
     * @param projectedSize - the size of the projected map window.
     * @returns an appropriate size for this Bing layer.
     */
    getSize(projectedSize) {
        return Vec2Math.abs(projectedSize);
    }
    /** @inheritdoc */
    onMapProjectionChanged(mapProjection, changeFlags) {
        if (BitFlags.isAll(changeFlags, MapProjectionChangeType.ProjectedSize)) {
            this.updateFromProjectedSize(mapProjection.getProjectedSize());
        }
        if (this.bingRef.instance.isBound()) {
            this.needUpdate = true;
        }
    }
    /**
     * A callback which is called when the Bing component is bound.
     */
    onBingBound() {
        this.needUpdate = true;
    }
    /** @inheritdoc */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onUpdated(time, elapsed) {
        if (!this.needUpdate) {
            return;
        }
        this.updatePositionRadius();
        this.needUpdate = false;
    }
    /** @inheritdoc */
    setVisible(val) {
        this.wrapperRef.instance.style.display = val ? '' : 'none';
    }
    /**
     * Updates the Bing map center position and radius.
     */
    updatePositionRadius() {
        const center = this.props.mapProjection.getCenter();
        const radius = this.calculateDesiredRadius(this.props.mapProjection);
        this.bingRef.instance.setPositionRadius(new LatLong(center.lat, center.lon), radius);
        if (!this.props.wxrMode || (this.props.wxrMode && this.props.wxrMode.get().mode !== EWeatherRadar.HORIZONTAL)) {
            this.wrapperRef.instance.style.transform = `rotate(${this.props.mapProjection.getRotation() * Avionics.Utils.RAD2DEG}deg)`;
        }
        else {
            this.wrapperRef.instance.style.transform = '';
        }
    }
    /**
     * Gets the desired Bing map radius in meters given a map projection model.
     * @param mapProjection - a map projection model.
     * @returns the desired Bing map radius.
     */
    calculateDesiredRadius(mapProjection) {
        const scaleFactor = mapProjection.getScaleFactor();
        const pointScaleFactor = 1 / Math.cos(mapProjection.getCenter().lat * Avionics.Utils.DEG2RAD);
        const radiusGARad = this.size / (2 * scaleFactor * pointScaleFactor);
        return UnitType.GA_RADIAN.convertTo(radiusGARad, UnitType.METER);
    }
    /** @inheritdoc */
    render() {
        var _a;
        return (FSComponent.buildComponent("div", { ref: this.wrapperRef, style: 'position: absolute;', class: (_a = this.props.class) !== null && _a !== void 0 ? _a : '' },
            FSComponent.buildComponent(BingComponent, { ref: this.bingRef, id: this.props.bingId, onBoundCallback: this.onBingBound.bind(this), resolution: this.resolutionSub, mode: EBingMode.PLANE, earthColors: this.props.earthColors, reference: this.props.reference, wxrMode: this.props.wxrMode, delay: this.props.delay })));
    }
}
MapBingLayer.OVERDRAW_FACTOR = Math.SQRT2;
