/// <reference types="msfstypes/js/netbingmap" />
import { VNode, Subscribable, SubscribableArray } from '../../../.';
import { WxrMode } from '../../bing';
import { MapProjection } from '../MapProjection';
import { MapLayer, MapLayerProps } from '../MapLayer';
/**
 * Component props for the MapComponent.
 */
export interface MapBingLayerProps<M> extends MapLayerProps<M> {
    /** The unique ID to assign to this Bing map. */
    bingId: string;
    /**
     * A subscribable array which provides the earth colors for the layer's Bing component. The array should have a
     * length of exactly 61, with index 0 defining the water color and indexes 1 through 60 defining terrain colors from
     * 0 to 60000 feet.
     */
    earthColors: SubscribableArray<number>;
    /**
     * A subscribable which provides the reference mode for the layer's Bing component.
     */
    reference: Subscribable<EBingReference>;
    /**
     * A subscribable which provides the weather radar mode for the layer's Bing component.
     */
    wxrMode?: Subscribable<WxrMode>;
    /**
     * How long to delay binding the map in ms.
     */
    delay?: number;
}
/**
 * A FSComponent that display the MSFS Bing Map, weather radar, and 3D terrain.
 */
export declare class MapBingLayer<M> extends MapLayer<MapBingLayerProps<M>> {
    static readonly OVERDRAW_FACTOR: number;
    private readonly wrapperRef;
    private readonly bingRef;
    private readonly resolutionSub;
    private size;
    private needUpdate;
    /** @inheritdoc */
    onAfterRender(): void;
    /** @inheritdoc */
    onWake(): void;
    /** @inheritdoc */
    onSleep(): void;
    /**
     * Updates this layer according to the current size of the projected map window.
     * @param projectedSize The size of the projected map window.
     */
    private updateFromProjectedSize;
    /**
     * Gets an appropriate size, in pixels, for this Bing layer given specific map projection window dimensions.
     * @param projectedSize - the size of the projected map window.
     * @returns an appropriate size for this Bing layer.
     */
    private getSize;
    /** @inheritdoc */
    onMapProjectionChanged(mapProjection: MapProjection, changeFlags: number): void;
    /**
     * A callback which is called when the Bing component is bound.
     */
    private onBingBound;
    /** @inheritdoc */
    onUpdated(time: number, elapsed: number): void;
    /** @inheritdoc */
    setVisible(val: boolean): void;
    /**
     * Updates the Bing map center position and radius.
     */
    protected updatePositionRadius(): void;
    /**
     * Gets the desired Bing map radius in meters given a map projection model.
     * @param mapProjection - a map projection model.
     * @returns the desired Bing map radius.
     */
    private calculateDesiredRadius;
    /** @inheritdoc */
    render(): VNode;
}
//# sourceMappingURL=MapBingLayer.d.ts.map