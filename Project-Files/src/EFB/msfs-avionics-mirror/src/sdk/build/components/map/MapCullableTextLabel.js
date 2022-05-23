import { MapLocationTextLabel } from './MapTextLabel';
/**
 * A cullable text label associated with a specific geographic location.
 */
export class MapCullableLocationTextLabel extends MapLocationTextLabel {
    /**
     * Constructor.
     * @param text The text of this label.
     * @param priority The priority of this label.
     * @param location The geographic location of this label.
     * @param alwaysShow Whether this label is immune to culling.
     * @param options Options with which to initialize this label.
     */
    constructor(text, priority, location, alwaysShow, options) {
        super(text, priority, location, options);
        this.alwaysShow = alwaysShow;
        this.bounds = new Float64Array(4);
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    updateBounds(mapProjection) {
        const width = 0.6 * this.fontSize * this.text.length;
        const height = this.fontSize;
        const pos = this.getPosition(mapProjection, MapCullableLocationTextLabel.tempVec2);
        let left = pos[0] - this.anchor[0] * width;
        let right = left + width;
        let top = pos[1] - this.anchor[1] * height;
        let bottom = top + height;
        if (this.showBg) {
            left -= (this.bgPadding[3] + this.bgOutlineWidth);
            right += (this.bgPadding[1] + this.bgOutlineWidth);
            top -= (this.bgPadding[0] + this.bgOutlineWidth);
            bottom += (this.bgPadding[2] + this.bgOutlineWidth);
        }
        this.bounds[0] = left;
        this.bounds[1] = top;
        this.bounds[2] = right;
        this.bounds[3] = bottom;
    }
}
/**
 * Manages a set of MapCullableTextLabels. Colliding labels will be culled based on their render priority. Labels with
 * lower priorities will be culled before labels with higher priorities.
 */
export class MapCullableTextLabelManager {
    /**
     * Creates an instance of the MapCullableTextLabelManager.
     * @param cullingEnabled Whether or not culling of labels is enabled.
     */
    constructor(cullingEnabled = true) {
        this.cullingEnabled = cullingEnabled;
        this.registered = new Set();
        this._visibleLabels = [];
        this.needUpdate = false;
        this.lastScaleFactor = 1;
        this.lastRotation = 0;
    }
    // eslint-disable-next-line jsdoc/require-returns
    /** An array of labels registered with this manager that are visible. */
    get visibleLabels() {
        return this._visibleLabels;
    }
    /**
     * Registers a label with this manager. Newly registered labels will be processed with the next manager update.
     * @param label The label to register.
     */
    register(label) {
        if (this.registered.has(label)) {
            return;
        }
        this.registered.add(label);
        this.needUpdate = true;
    }
    /**
     * Deregisters a label with this manager. Newly deregistered labels will be processed with the next manager update.
     * @param label The label to deregister.
     */
    deregister(label) {
        this.needUpdate = this.registered.delete(label) || this.needUpdate;
    }
    /**
     * Sets whether or not text label culling is enabled.
     * @param enabled Whether or not culling is enabled.
     */
    setCullingEnabled(enabled) {
        this.cullingEnabled = enabled;
        this.needUpdate = true;
    }
    /**
     * Updates this manager.
     * @param mapProjection The projection of the map to which this manager's labels are to be drawn.
     */
    update(mapProjection) {
        if (!this.needUpdate) {
            const scaleFactorRatio = mapProjection.getScaleFactor() / this.lastScaleFactor;
            if (scaleFactorRatio < MapCullableTextLabelManager.SCALE_UPDATE_THRESHOLD && scaleFactorRatio > 1 / MapCullableTextLabelManager.SCALE_UPDATE_THRESHOLD) {
                const rotationDelta = Math.abs(mapProjection.getRotation() - this.lastRotation);
                if (Math.min(rotationDelta, 2 * Math.PI - rotationDelta) < MapCullableTextLabelManager.ROTATION_UPDATE_THRESHOLD) {
                    return;
                }
            }
        }
        this._visibleLabels = [];
        if (this.cullingEnabled) {
            const labelArray = Array.from(this.registered.values());
            const len = labelArray.length;
            for (let i = 0; i < len; i++) {
                labelArray[i].updateBounds(mapProjection);
            }
            labelArray.sort((a, b) => {
                if (a.alwaysShow && !b.alwaysShow) {
                    return -1;
                }
                else if (b.alwaysShow && !a.alwaysShow) {
                    return 1;
                }
                else {
                    return b.priority - a.priority;
                }
            });
            const collisionArray = [];
            for (let i = 0; i < len; i++) {
                const label = labelArray[i];
                let show = true;
                if (!label.alwaysShow) {
                    const len2 = collisionArray.length;
                    for (let j = 0; j < len2; j++) {
                        const other = collisionArray[j];
                        if (MapCullableTextLabelManager.doesCollide(label.bounds, other)) {
                            show = false;
                            break;
                        }
                    }
                }
                if (show) {
                    collisionArray.push(label.bounds);
                    this._visibleLabels.push(label);
                }
            }
        }
        else {
            this._visibleLabels.push(...this.registered.values());
        }
        this.lastScaleFactor = mapProjection.getScaleFactor();
        this.lastRotation = mapProjection.getRotation();
        this.needUpdate = false;
    }
    /**
     * Checks if two bounding boxes collide.
     * @param a The first bounding box, as a 4-tuple [left, top, right, bottom].
     * @param b The second bounding box, as a 4-tuple [left, top, right, bottom].
     * @returns whether the bounding boxes collide.
     */
    static doesCollide(a, b) {
        return a[0] < b[2]
            && a[2] > b[0]
            && a[1] < b[3]
            && a[3] > b[1];
    }
}
MapCullableTextLabelManager.SCALE_UPDATE_THRESHOLD = 1.2;
MapCullableTextLabelManager.ROTATION_UPDATE_THRESHOLD = Math.PI / 6;
