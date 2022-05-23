import { Vec2Math } from '../../../math/VecMath';
import { FSComponent } from '../../FSComponent';
import { BitFlags } from '../../../math/BitFlags';
import { MapLayer } from '../../map';
import { MapOwnshipModule } from '../modules/MapOwnshipModule';
/**
 * A layer which draws an own airplane icon.
 */
export class MapSystemOwnshipLayer extends MapLayer {
    constructor() {
        super(...arguments);
        this.iconImgRef = FSComponent.createRef();
        this.iconOffset = new Float64Array(2);
        this.updateFlags = 0;
    }
    /** @inheritdoc */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onVisibilityChanged(isVisible) {
        this.scheduleUpdate(MapSystemOwnshipLayer.UPDATE_VISIBILITY);
    }
    /** @inheritdoc */
    onAttached() {
        const ownAirplaneIconModule = this.props.model.getModule(MapOwnshipModule);
        ownAirplaneIconModule.isVisible.sub(this.onIconShowChanged.bind(this));
        ownAirplaneIconModule.position.sub(this.onAirplanePositionChanged.bind(this));
        ownAirplaneIconModule.hdgTrue.sub(this.onAirplaneHeadingChanged.bind(this));
        this.props.iconAnchor.sub(anchor => {
            this.iconOffset.set(anchor);
            Vec2Math.multScalar(this.iconOffset, -this.props.iconSize, this.iconOffset);
            const img = this.iconImgRef.instance;
            img.style.left = `${this.iconOffset[0]}px`;
            img.style.top = `${this.iconOffset[1]}px`;
            img.style.transformOrigin = `${anchor[0] * 100}% ${anchor[1] * 100}%`;
            this.scheduleUpdate(MapSystemOwnshipLayer.UPDATE_VISIBILITY | MapSystemOwnshipLayer.UPDATE_TRANSFORM);
        }, true);
        this.props.imageFilePath.sub(path => {
            this.iconImgRef.instance.src = path;
            this.scheduleUpdate(MapSystemOwnshipLayer.UPDATE_VISIBILITY | MapSystemOwnshipLayer.UPDATE_TRANSFORM);
        }, true);
        this.scheduleUpdate(MapSystemOwnshipLayer.UPDATE_VISIBILITY | MapSystemOwnshipLayer.UPDATE_TRANSFORM);
    }
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/no-unused-vars
    onMapProjectionChanged(mapProjection, changeFlags) {
        this.scheduleUpdate(MapSystemOwnshipLayer.UPDATE_TRANSFORM);
    }
    /**
     * Schedules an update.
     * @param updateFlags The types of updates to schedule.
     */
    scheduleUpdate(updateFlags) {
        this.updateFlags = BitFlags.union(this.updateFlags, updateFlags);
    }
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/no-unused-vars
    onUpdated(time, elapsed) {
        if (this.updateFlags === 0) {
            return;
        }
        if (BitFlags.isAll(this.updateFlags, MapSystemOwnshipLayer.UPDATE_VISIBILITY)) {
            this.updateIconVisibility();
        }
        if (BitFlags.isAll(this.updateFlags, MapSystemOwnshipLayer.UPDATE_TRANSFORM)) {
            this.updateIconTransform();
        }
        this.updateFlags = BitFlags.not(this.updateFlags, MapSystemOwnshipLayer.UPDATE_VISIBILITY | MapSystemOwnshipLayer.UPDATE_TRANSFORM);
    }
    /**
     * Updates the airplane icon's visibility.
     */
    updateIconVisibility() {
        const show = this.isVisible() && this.props.model.getModule(MapOwnshipModule).isVisible.get();
        this.iconImgRef.instance.style.display = show ? 'block' : 'none';
    }
    /**
     * Updates the airplane icon's display transformation.
     */
    updateIconTransform() {
        const ownshipModule = this.props.model.getModule(MapOwnshipModule);
        const projected = this.props.mapProjection.project(ownshipModule.position.get(), MapSystemOwnshipLayer.tempVec2_1);
        const rotation = ownshipModule.hdgTrue.get() + this.props.mapProjection.getRotation() * Avionics.Utils.RAD2DEG;
        this.iconImgRef.instance.style.transform = `translate(${projected[0].toFixed(1)}px, ${projected[1].toFixed(1)}px) rotate(${rotation.toFixed(1)}deg) rotateX(0deg)`;
    }
    /**
     * A callback which is called when the show airplane icon property changes.
     * @param show The new value of the show airplane icon property.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onIconShowChanged(show) {
        this.scheduleUpdate(MapSystemOwnshipLayer.UPDATE_VISIBILITY);
    }
    /**
     * A callback which is called when the airplane's position changes.
     * @param pos The new position of the airplane.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onAirplanePositionChanged(pos) {
        this.scheduleUpdate(MapSystemOwnshipLayer.UPDATE_TRANSFORM);
    }
    /**
     * A callback which is called when the airplane's true heading changes.
     * @param hdgTrue - the new true heading of the airplane.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onAirplaneHeadingChanged(hdgTrue) {
        this.scheduleUpdate(MapSystemOwnshipLayer.UPDATE_TRANSFORM);
    }
    /** @inheritdoc */
    render() {
        var _a;
        return (FSComponent.buildComponent("img", { ref: this.iconImgRef, class: (_a = this.props.class) !== null && _a !== void 0 ? _a : '', src: this.props.imageFilePath, style: `position: absolute; width: ${this.props.iconSize}px; height: ${this.props.iconSize}px; transform: rotateX(0deg);` }));
    }
}
MapSystemOwnshipLayer.UPDATE_VISIBILITY = 1;
MapSystemOwnshipLayer.UPDATE_TRANSFORM = 1 << 1;
MapSystemOwnshipLayer.tempVec2_1 = new Float64Array(2);
