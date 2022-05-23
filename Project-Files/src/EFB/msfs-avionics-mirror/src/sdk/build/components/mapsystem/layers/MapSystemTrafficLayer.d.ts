import { EventBus } from '../../../data';
import { GeoPointInterface } from '../../../geo';
import { NumberUnitInterface, ReadonlyFloat64Array, UnitFamily } from '../../../math';
import { TCASIntruder } from '../../../traffic';
import { VNode } from '../../FSComponent';
import { MapLayer, MapLayerProps, MapProjection } from '../../map';
import { MapOwnshipModule } from '../modules/MapOwnshipModule';
import { MapTrafficModule } from '../modules/MapTrafficModule';
/**
 * A map icon for a TCAS intruder.
 */
export interface MapTrafficIntruderIcon {
    /** This icon's associated intruder. */
    readonly intruder: TCASIntruder;
    /**
     * Draws this icon.
     * @param projection The map projection.
     * @param context The canvas rendering context to which to draw.
     * @param offScaleRange The distance from the own airplane to this icon's intruder beyond which the intruder is
     * considered off-scale. If the value is `NaN`, the intruder is never considered off-scale.
     */
    draw(projection: MapProjection, context: CanvasRenderingContext2D, offScaleRange: NumberUnitInterface<UnitFamily.Distance>): void;
}
/**
 * A function which creates map icons for TCAS intruders.
 * @param intruder The intruder for which to create an icon.
 * @param trafficModule The traffic module of the new icon's parent map.
 * @param ownshipModule The ownship module of the new icon's parent map.
 */
export declare type MapTrafficIntruderIconFactory = (intruder: TCASIntruder, trafficModule: MapTrafficModule, ownshipModule: MapOwnshipModule) => MapTrafficIntruderIcon;
/**
 * Component props for MapTrafficIntruderLayer.
 */
export interface MapTrafficIntruderLayerProps extends MapLayerProps<any> {
    /** The event bus. */
    bus: EventBus;
    /** A function which creates icons for intruders. */
    iconFactory: MapTrafficIntruderIconFactory;
    /**
     * A function which initializes global canvas styles for the layer.
     * @param context The canvas rendering context for which to initialize styles.
     */
    initCanvasStyles?: (context: CanvasRenderingContext2D) => void;
}
/**
 * A map layer which displays traffic intruders.
 */
export declare class MapSystemTrafficLayer extends MapLayer<MapTrafficIntruderLayerProps> {
    private readonly iconLayerRef;
    private readonly trafficModule;
    private readonly ownshipModule;
    private readonly intruderViews;
    private isInit;
    /** @inheritdoc */
    onVisibilityChanged(isVisible: boolean): void;
    /** @inheritdoc */
    onAttached(): void;
    /**
     * Initializes canvas styles.
     */
    private initCanvasStyles;
    /**
     * Initializes all currently existing TCAS intruders.
     */
    private initIntruders;
    /**
     * Initializes handlers to respond to TCAS events.
     */
    private initTCASHandlers;
    /** @inheritdoc */
    onMapProjectionChanged(mapProjection: MapProjection, changeFlags: number): void;
    /** @inheritdoc */
    onUpdated(time: number, elapsed: number): void;
    /**
     * Redraws all tracked intruders.
     */
    private redrawIntruders;
    /**
     * Updates this layer's visibility.
     */
    private updateVisibility;
    /**
     * A callback which is called when a TCAS intruder is added.
     * @param intruder The new intruder.
     */
    private onIntruderAdded;
    /**
     * A callback which is called when a TCAS intruder is removed.
     * @param intruder The removed intruder.
     */
    private onIntruderRemoved;
    /**
     * A callback which is called when the alert level of a TCAS intruder is changed.
     * @param intruder The intruder.
     */
    private onIntruderAlertLevelChanged;
    /** @inheritdoc */
    render(): VNode;
}
/**
 *
 */
export declare abstract class AbstractMapTrafficIntruderIcon implements MapTrafficIntruderIcon {
    readonly intruder: TCASIntruder;
    protected readonly trafficModule: MapTrafficModule;
    protected readonly ownshipModule: MapOwnshipModule;
    private static readonly geoPointCache;
    private readonly projectedPos;
    private isOffScale;
    /**
     * Constructor.
     * @param intruder This icon's associated intruder.
     * @param trafficModule The traffic module for this icon's parent map.
     * @param ownshipModule The ownship module for this icon's parent map.
     */
    constructor(intruder: TCASIntruder, trafficModule: MapTrafficModule, ownshipModule: MapOwnshipModule);
    /**
     * Draws this icon.
     * @param projection The map projection.
     * @param context The canvas rendering context to which to draw this icon.
     * @param offScaleRange The distance from the own airplane to this icon's intruder beyond which the intruder is
     * considered off-scale. If the value is `NaN`, the intruder is never considered off-scale.
     */
    draw(projection: MapProjection, context: CanvasRenderingContext2D, offScaleRange: NumberUnitInterface<UnitFamily.Distance>): void;
    /**
     * Updates this icon's intruder's projected position and off-scale status.
     * @param projection The map projection.
     * @param offScaleRange The distance from the own airplane to this icon's intruder beyond which the intruder is
     * considered off-scale. If the value is `NaN`, the intruder is never considered off-scale.
     */
    protected updatePosition(projection: MapProjection, offScaleRange: NumberUnitInterface<UnitFamily.Distance>): void;
    /**
     * Updates this icon's intruder's projected position and off-scale status using a specific range from the own
     * airplane to define off-scale.
     * @param projection The map projection.
     * @param ownAirplanePos The position of the own airplane.
     * @param offScaleRange The distance from the own airplane to this icon's intruder beyond which the intruder is
     * considered off-scale.
     */
    protected handleOffScaleRange(projection: MapProjection, ownAirplanePos: GeoPointInterface, offScaleRange: NumberUnitInterface<UnitFamily.Distance>): void;
    /**
     * Draws this icon.
     * @param projection The map projection.
     * @param context The canvas rendering context to which to draw this icon.
     * @param projectedPos The projected position of this icon's intruder.
     * @param isOffScale Whether this icon's intruder is off-scale.
     */
    protected abstract drawIcon(projection: MapProjection, context: CanvasRenderingContext2D, projectedPos: ReadonlyFloat64Array, isOffScale: boolean): void;
}
//# sourceMappingURL=MapSystemTrafficLayer.d.ts.map