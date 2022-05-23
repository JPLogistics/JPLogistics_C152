import { Subscribable } from '../..';
import { MapModel } from './MapModel';
import { MapProjection } from './MapProjection';
import { ComponentProps, DisplayComponent } from '../FSComponent';
/**
 * An interface for basic map layer properties.
 */
export interface MapLayerProps<M> extends ComponentProps {
    /** A map model. */
    model: MapModel<M>;
    /** A map projection model. */
    mapProjection: MapProjection;
    /**
     * A subscribable which provides the maximum update frequency of the layer, in hertz. Note that the actual update
     * frequency will not exceed the update frequency of the layer's parent map. If not defined, the frequency will
     * default to that of the layer's parent map.
     */
    updateFreq?: Subscribable<number>;
    /** The CSS class(es) to apply to the root of this layer. */
    class?: string;
}
/**
 * A base component for map layers.
 */
export declare abstract class MapLayer<P extends MapLayerProps<any> = MapLayerProps<any>> extends DisplayComponent<P> {
    private _isVisible;
    /**
     * Checks whether this layer is visible.
     * @returns whether this layer is visible.
     */
    isVisible(): boolean;
    /**
     * Sets this layer's visibility.
     * @param val Whether this layer should be visible.
     */
    setVisible(val: boolean): void;
    /**
     * This method is called when this layer's visibility changes.
     * @param isVisible Whether the layer is now visible.
     */
    onVisibilityChanged(isVisible: boolean): void;
    /**
     * This method is called when this layer is attached to its parent map component.
     */
    onAttached(): void;
    /**
     * This method is called when this layer's parent map is woken.
     */
    onWake(): void;
    /**
     * This method is called when this layer's parent map is put to sleep.
     */
    onSleep(): void;
    /**
     * This method is called when the map projection changes.
     * @param mapProjection - this layer's map projection.
     * @param changeFlags The types of changes made to the projection.
     */
    onMapProjectionChanged(mapProjection: MapProjection, changeFlags: number): void;
    /**
     * This method is called once every map update cycle.
     * @param time The current time as a UNIX timestamp.
     * @param elapsed The elapsed time, in milliseconds, since the last update.
     */
    onUpdated(time: number, elapsed: number): void;
    /**
     * This method is called when this layer is detached from its parent map component.
     */
    onDetached(): void;
}
//# sourceMappingURL=MapLayer.d.ts.map