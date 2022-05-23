import { Vec2Math } from '../../../math/VecMath';
import { FSComponent } from '../../FSComponent';
import { MapLayer } from '../MapLayer';
import { BitFlags } from '../../../math/BitFlags';
/**
 * A layer which draws an own airplane icon.
 */
export class MapOwnAirplaneLayer extends MapLayer {
    constructor() {
        super(...arguments);
        this.iconImgRef = FSComponent.createRef();
        this.iconOffset = new Float64Array(2);
        this.updateFlags = 0;
    }
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/no-unused-vars
    onVisibilityChanged(isVisible) {
        this.scheduleUpdate(MapOwnAirplaneLayer.UPDATE_VISIBILITY);
    }
    /** @inheritdoc */
    onAttached() {
        const ownAirplaneIconModule = this.props.model.getModule('ownAirplaneIcon');
        ownAirplaneIconModule.show.sub(this.onIconShowChanged.bind(this));
        const ownAirplanePropsModule = this.props.model.getModule('ownAirplaneProps');
        ownAirplanePropsModule.position.sub(this.onAirplanePositionChanged.bind(this));
        ownAirplanePropsModule.hdgTrue.sub(this.onAirplaneHeadingChanged.bind(this));
        this.props.iconAnchor.sub(anchor => {
            this.iconOffset.set(anchor);
            Vec2Math.multScalar(this.iconOffset, -this.props.iconSize, this.iconOffset);
            const img = this.iconImgRef.instance;
            img.style.left = `${this.iconOffset[0]}px`;
            img.style.top = `${this.iconOffset[1]}px`;
            img.style.transformOrigin = `${anchor[0] * 100}% ${anchor[1] * 100}%`;
            this.scheduleUpdate(MapOwnAirplaneLayer.UPDATE_VISIBILITY | MapOwnAirplaneLayer.UPDATE_TRANSFORM);
        }, true);
        this.props.imageFilePath.sub(path => {
            this.iconImgRef.instance.src = path;
            this.scheduleUpdate(MapOwnAirplaneLayer.UPDATE_VISIBILITY | MapOwnAirplaneLayer.UPDATE_TRANSFORM);
        }, true);
        this.scheduleUpdate(MapOwnAirplaneLayer.UPDATE_VISIBILITY | MapOwnAirplaneLayer.UPDATE_TRANSFORM);
    }
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/no-unused-vars
    onMapProjectionChanged(mapProjection, changeFlags) {
        this.scheduleUpdate(MapOwnAirplaneLayer.UPDATE_TRANSFORM);
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
        if (BitFlags.isAll(this.updateFlags, MapOwnAirplaneLayer.UPDATE_VISIBILITY)) {
            this.updateIconVisibility();
        }
        if (BitFlags.isAll(this.updateFlags, MapOwnAirplaneLayer.UPDATE_TRANSFORM)) {
            this.updateIconTransform();
        }
        this.updateFlags = BitFlags.not(this.updateFlags, MapOwnAirplaneLayer.UPDATE_VISIBILITY | MapOwnAirplaneLayer.UPDATE_TRANSFORM);
    }
    /**
     * Updates the airplane icon's visibility.
     */
    updateIconVisibility() {
        const show = this.isVisible() && this.props.model.getModule('ownAirplaneIcon').show.get();
        this.iconImgRef.instance.style.display = show ? 'block' : 'none';
    }
    /**
     * Updates the airplane icon's display transformation.
     */
    updateIconTransform() {
        const ownAirplanePropsModule = this.props.model.getModule('ownAirplaneProps');
        const projected = this.props.mapProjection.project(ownAirplanePropsModule.position.get(), MapOwnAirplaneLayer.tempVec2_1);
        const rotation = ownAirplanePropsModule.hdgTrue.get() + this.props.mapProjection.getRotation() * Avionics.Utils.RAD2DEG;
        this.iconImgRef.instance.style.transform = `translate(${projected[0].toFixed(1)}px, ${projected[1].toFixed(1)}px) rotate(${rotation.toFixed(1)}deg) rotateX(0deg)`;
    }
    /**
     * A callback which is called when the show airplane icon property changes.
     * @param show The new value of the show airplane icon property.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onIconShowChanged(show) {
        this.scheduleUpdate(MapOwnAirplaneLayer.UPDATE_VISIBILITY);
    }
    /**
     * A callback which is called when the airplane's position changes.
     * @param pos The new position of the airplane.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onAirplanePositionChanged(pos) {
        this.scheduleUpdate(MapOwnAirplaneLayer.UPDATE_TRANSFORM);
    }
    /**
     * A callback which is called when the airplane's true heading changes.
     * @param hdgTrue - the new true heading of the airplane.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onAirplaneHeadingChanged(hdgTrue) {
        this.scheduleUpdate(MapOwnAirplaneLayer.UPDATE_TRANSFORM);
    }
    /** @inheritdoc */
    render() {
        var _a;
        return (FSComponent.buildComponent("img", { ref: this.iconImgRef, class: (_a = this.props.class) !== null && _a !== void 0 ? _a : '', src: this.props.imageFilePath, style: `position: absolute; width: ${this.props.iconSize}px; height: ${this.props.iconSize}px; transform: rotateX(0deg);` }));
    }
}
MapOwnAirplaneLayer.UPDATE_VISIBILITY = 1;
MapOwnAirplaneLayer.UPDATE_TRANSFORM = 1 << 1;
MapOwnAirplaneLayer.tempVec2_1 = new Float64Array(2);
