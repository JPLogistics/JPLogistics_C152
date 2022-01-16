import { MapOwnAirplaneIconModule } from '../modules/MapOwnAirplaneIconModule';
import { MapOwnAirplanePropsModule } from '../modules/MapOwnAirplanePropsModule';
import { MapProjection } from '../MapProjection';
import { VNode } from '../../FSComponent';
import { MapLayer, MapLayerProps } from '../MapLayer';
import { Subscribable } from '../../../utils/Subscribable';
/**
 * Modules required by MapOwnAirplaneLayer.
 */
export interface MapOwnAirplaneLayerModules {
    /** Own airplane properties module. */
    ownAirplaneProps: MapOwnAirplanePropsModule;
    /** Own airplane icon module. */
    ownAirplaneIcon: MapOwnAirplaneIconModule;
}
/**
 * Component props for MapOwnAirplaneLayer.
 */
export interface MapOwnAirplaneLayerProps<M extends MapOwnAirplaneLayerModules> extends MapLayerProps<M> {
    /** The path to the icon's image file. */
    imageFilePath: Subscribable<string>;
    /** The size of the airplane icon, in pixels. */
    iconSize: number;
    /**
     * The point on the icon which is anchored to the airplane's position, expressed relative to the icon's width and
     * height, with [0, 0] at the top left and [1, 1] at the bottom right.
     */
    iconAnchor: Subscribable<Float64Array>;
}
/**
 * A layer which draws an own airplane icon.
 */
export declare class MapOwnAirplaneLayer<M extends MapOwnAirplaneLayerModules> extends MapLayer<MapOwnAirplaneLayerProps<M>> {
    protected static readonly UPDATE_VISIBILITY = 1;
    protected static readonly UPDATE_TRANSFORM: number;
    private static readonly tempVec2_1;
    protected readonly iconImgRef: import("../../FSComponent").NodeReference<HTMLImageElement>;
    protected readonly iconOffset: Float64Array;
    protected updateFlags: number;
    onVisibilityChanged(isVisible: boolean): void;
    /** @inheritdoc */
    onAttached(): void;
    onMapProjectionChanged(mapProjection: MapProjection, changeFlags: number): void;
    /**
     * Schedules an update.
     * @param updateFlags The types of updates to schedule.
     */
    protected scheduleUpdate(updateFlags: number): void;
    onUpdated(time: number, elapsed: number): void;
    /**
     * Updates the airplane icon's visibility.
     */
    protected updateIconVisibility(): void;
    /**
     * Updates the airplane icon's display transformation.
     */
    protected updateIconTransform(): void;
    /**
     * A callback which is called when the show airplane icon property changes.
     * @param show The new value of the show airplane icon property.
     */
    private onIconShowChanged;
    /**
     * A callback which is called when the airplane's position changes.
     * @param pos The new position of the airplane.
     */
    private onAirplanePositionChanged;
    /**
     * A callback which is called when the airplane's true heading changes.
     * @param hdgTrue - the new true heading of the airplane.
     */
    private onAirplaneHeadingChanged;
    /** @inheritdoc */
    render(): VNode;
}
//# sourceMappingURL=MapOwnAirplaneLayer.d.ts.map