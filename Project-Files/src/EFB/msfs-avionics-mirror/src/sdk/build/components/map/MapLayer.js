import { DisplayComponent } from '../FSComponent';
/**
 * A base component for map layers.
 */
export class MapLayer extends DisplayComponent {
    constructor() {
        super(...arguments);
        this._isVisible = true;
    }
    /**
     * Checks whether this layer is visible.
     * @returns whether this layer is visible.
     */
    isVisible() {
        return this._isVisible;
    }
    /**
     * Sets this layer's visibility.
     * @param val Whether this layer should be visible.
     */
    setVisible(val) {
        if (this._isVisible === val) {
            return;
        }
        this._isVisible = val;
        this.onVisibilityChanged(val);
    }
    /**
     * This method is called when this layer's visibility changes.
     * @param isVisible Whether the layer is now visible.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onVisibilityChanged(isVisible) {
        // noop
    }
    /**
     * This method is called when this layer is attached to its parent map component.
     */
    onAttached() {
        // noop
    }
    /**
     * This method is called when this layer's parent map is woken.
     */
    onWake() {
        // noop
    }
    /**
     * This method is called when this layer's parent map is put to sleep.
     */
    onSleep() {
        // noop
    }
    /**
     * This method is called when the map projection changes.
     * @param mapProjection - this layer's map projection.
     * @param changeFlags The types of changes made to the projection.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onMapProjectionChanged(mapProjection, changeFlags) {
        // noop
    }
    /**
     * This method is called once every map update cycle.
     * @param time The current time as a UNIX timestamp.
     * @param elapsed The elapsed time, in milliseconds, since the last update.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onUpdated(time, elapsed) {
        // noop
    }
    /**
     * This method is called when this layer is detached from its parent map component.
     */
    onDetached() {
        // noop
    }
}
