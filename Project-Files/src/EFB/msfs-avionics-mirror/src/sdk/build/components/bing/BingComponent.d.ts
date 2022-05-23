/// <reference types="msfstypes/js/netbingmap" />
/// <reference types="msfstypes/js/types" />
import { ReadonlyFloat64Array } from '../../math/VecMath';
import { Subscribable } from '../../sub/Subscribable';
import { SubscribableArray } from '../../sub/SubscribableArray';
import { ComponentProps, DisplayComponent, VNode } from '../FSComponent';
/**
 * Weather radar mode data for the BingComponent.
 */
export interface WxrMode {
    /** The weather mode. */
    mode: EWeatherRadar;
    /** The size of the weather radar arc in front of the plane, in radians. */
    arcRadians: number;
}
/**
 * Component props for the MapComponent.
 */
export interface BingComponentProps extends ComponentProps {
    /** The unique ID to assign to this Bing component. */
    id: string;
    /** The mode of the Bing component. */
    mode: EBingMode;
    /** A callback to call when the Bing component is bound. */
    onBoundCallback: (component: BingComponent) => void;
    /**
     * A subscribable which provides the internal resolution for the Bing component. If not defined, the resolution
     * defaults to 1024x1024 pixels.
     */
    resolution?: Subscribable<ReadonlyFloat64Array>;
    /**
     * A subscribable array which provides the earth colors for the Bing component. The array should have a length of
     * exactly 61, with index 0 defining the water color and indexes 1 through 60 defining terrain colors from 0 to
     * 60000 feet. If not defined, the earth colors default to black.
     */
    earthColors?: SubscribableArray<number>;
    /**
     * A subscribable which provides the sky color for the Bing component. The sky color is only visible in synthetic
     * vision (`EBingMode.HORIZON`) mode. If not defined, the sky color defaults to black.
     */
    skyColor?: Subscribable<number>;
    /** CSS class(es) to add to the Bing component's image. */
    class?: string;
    /**
     * A subscribable which provides the reference mode for the Bing component. If not defined, the reference mode
     * defaults to `EBingReference.SEA`.
     */
    reference?: Subscribable<EBingReference>;
    /**
     * A subscribable which provides the weather radar mode for the Bing component. If not defined, the weather radar
     * mode defaults to `EWeatherRadar.NONE`.
     */
    wxrMode?: Subscribable<WxrMode>;
    /**
     * How long to delay binding the map in ms. Defaults to 3000.
     */
    delay?: number;
}
/**
 * A FSComponent that displays the MSFS Bing Map, weather radar, and 3D terrain.
 */
export declare class BingComponent extends DisplayComponent<BingComponentProps> {
    static readonly DEFAULT_RESOLUTION = 1024;
    private readonly modeFlags;
    private mapListener;
    private isListenerRegistered;
    private readonly imgRef;
    private binder?;
    private uid;
    private _isBound;
    private _isAwake;
    private isDestroyed;
    private pos;
    private radius;
    private readonly resolution;
    private readonly earthColors;
    private readonly skyColor;
    private readonly reference;
    private readonly wxrMode;
    private gameStateSub?;
    private resolutionPropSub?;
    private earthColorsPropSub?;
    private skyColorPropSub?;
    private referencePropSub?;
    private wxrModePropSub?;
    private resolutionSub?;
    private earthColorsSub?;
    private skyColorSub?;
    private referenceSub?;
    private wxrModeSub?;
    private readonly resolutionPropHandler;
    private readonly earthColorsPropHandler;
    private readonly skyColorPropHandler;
    private readonly referencePropHandler;
    private readonly wxrModePropHandler;
    private readonly resolutionHandler;
    private readonly earthColorsHandler;
    private readonly skyColorHandler;
    private readonly referenceHandler;
    private readonly wxrModeHandler;
    /**
     * Checks whether this Bing component has been bound.
     * @returns whether this Bing component has been bound.
     */
    isBound(): boolean;
    /**
     * Checks whether this Bing component is awake.
     * @returns whether this Bing component is awake.
     */
    isAwake(): boolean;
    /** @inheritdoc */
    onAfterRender(): void;
    /**
     * Registers this component's Bing map listener.
     */
    private registerListener;
    /**
     * A callback called when this component's Bing map listener is registered.
     */
    private onListenerRegistered;
    /**
     * A callback called when the listener is fully bound.
     * @param binder The binder from the listener.
     * @param uid The unique ID of the bound map.
     */
    private onListenerBound;
    /**
     * A callback called when the map image is updated.
     * @param uid The unique ID of the bound map.
     * @param imgSrc The img tag src attribute to assign to the bing map image.
     */
    private onMapUpdate;
    /**
     * Wakes this Bing component. Upon awakening, this component will synchronize its state from when it was put to sleep
     * to the Bing instance to which it is bound.
     */
    wake(): void;
    /**
     * Puts this Bing component to sleep. While asleep, this component cannot make changes to the Bing instance to which
     * it is bound.
     */
    sleep(): void;
    /**
     * Sets the center position and radius.
     * @param pos The center position.
     * @param radius The radius, in meters.
     */
    setPositionRadius(pos: LatLong, radius: number): void;
    /** @inheritdoc */
    render(): VNode;
    /** @inheritdoc */
    destroy(): void;
    /**
     * Converts an HTML hex color string to a numerical map RGB value.
     * @param hexColor The hex color string to convert.
     * @returns A numerical map RGB value.
     */
    static hexaToRGBColor(hexColor: string): number;
    /**
     * Converts RGB color components to a numerical map RGB value.
     * @param r The red component, from 0 to 255.
     * @param g The green component, from 0 to 255.
     * @param b The blue component, from 0 to 255.
     * @returns A numerical map RGB value.
     */
    static rgbColor(r: number, g: number, b: number): number;
    /**
     * Creates a full Bing component earth colors array. The earth colors array will contain the specified water color
     * and terrain colors (including interpolated values between the explicitly defined ones, as necessary).
     * @param waterColor The desired water color, as a hex string with the format `#hhhhhh`.
     * @param terrainColors An array of desired terrain colors at specific elevations. Elevations should be specified in
     * feet and colors as hex strings with the format `#hhhhhh`.
     * @returns a full Bing component earth colors array.
     */
    static createEarthColorsArray(waterColor: string, terrainColors: {
        elev: number;
        color: string;
    }[]): number[];
}
//# sourceMappingURL=BingComponent.d.ts.map