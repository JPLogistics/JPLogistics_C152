import { EventBus } from '../../data';
import { VNode } from '../FSComponent';
import { MapCullableTextLabelManager, MapLayer, MapModel, MapProjection } from '../map';
import { MapSystemPlanRenderer } from './MapSystemPlanRenderer';
import { MapSystemIconFactory, MapSystemLabelFactory, MapSystemWaypointsRenderer } from './MapSystemWaypointsRenderer';
import { MapModule } from './modules/MapModule';
/**
 * A function that creates a map data module.
 */
export declare type MapModuleConstructor = (mapSystemContext: MapSystemContext) => MapModule;
/**
 * A function that creates a map layer.
 */
export declare type MapLayerConstructor = (mapSystemContext: MapSystemContext) => VNode;
/**
 * An entry in the map context layer factories collection.
 */
interface MapLayerConstructorEntry {
    /** The string key of the layer. */
    key: string;
    /** The factory that constructs the layer. */
    factory: MapLayerConstructor;
}
/**
 * An entry in the map context that defines a controller to construct.
 */
interface MapSystemControllerEntry {
    /** The factory that constructs the controller. */
    factory: new (...args: any) => any;
    /** */
    args: any[];
}
/**
 * A data context for building map systems.
 */
export declare class MapSystemContext {
    readonly bus: EventBus;
    refreshRate: number;
    /** The map system data modules currently installed in this context. */
    readonly moduleFactories: Map<string, MapModuleConstructor>;
    /** The map layers currently added to this map system. */
    readonly layerFactories: MapLayerConstructorEntry[];
    /** The built model containing all map data modules after construction. */
    readonly model: MapModel<any>;
    /** The built set of registered layers. */
    readonly layers: Map<string, MapLayer<any>>;
    /** The controllers to construct after the map has rendered. */
    readonly controllers: MapSystemControllerEntry[];
    /** The unique BingMap ID to tie this map to. */
    bingId: string;
    /** The size, in pixels, of this map. */
    size: Float64Array;
    /** How long to delay binding the map in ms. Default to 3000. */
    delay: number;
    /** The projection to use with this map system. */
    readonly projection: MapProjection;
    /** The text manager to use for waypoint label layers. */
    readonly textManager: MapCullableTextLabelManager;
    /** The waypoint renderer to use to render to waypoint label layers. */
    readonly waypointRenderer: MapSystemWaypointsRenderer;
    /** The waypoint icon factory to use to render to waypoint icon layers. */
    readonly iconFactory: MapSystemIconFactory;
    /** The waypoint label factory to use to render to waypoint label layers. */
    readonly labelFactory: MapSystemLabelFactory;
    /** The flight plan renderer to use to render the flight plan. */
    readonly planRenderer: MapSystemPlanRenderer;
    /**
     * Creates an instance of a MapSystemContext.
     * @param bus The event bus to use with this instance.
     * @param projection The map projection to use with this instance.
     * @param refreshRate The refresh rate, in Hz, for the map system.
     */
    constructor(bus?: EventBus, projection?: MapProjection, refreshRate?: number);
    /**
     * Builds a map data module model.
     * @throws An error if all required modules were not registered.
     */
    buildModel(): void;
    /**
     * An empty map system context.
     */
    static Empty: MapSystemContext;
}
/**
 * A read-only interface into MapSystemContext.
 */
export interface ReadOnlyMapSystemContext {
    /** The built model containing all map data modules after construction. */
    readonly model: MapModel<any>;
    /** The built set of registered layers. */
    readonly layers: Map<string, MapLayer<any>>;
    /** The unique BingMap ID to tie this map to. */
    readonly bingId: string;
    /** The projection to use with this map system. */
    readonly projection: MapProjection;
    /** The text manager to use for waypoint label layers. */
    readonly textManager: MapCullableTextLabelManager;
    /** The waypoint renderer to use to render to waypoint label layers. */
    readonly waypointRenderer: MapSystemWaypointsRenderer;
    /** The waypoint icon factory to use to render to waypoint icon layers. */
    readonly iconFactory: MapSystemIconFactory;
    /** The waypoint label factory to use to render to waypoint label layers. */
    readonly labelFactory: MapSystemLabelFactory;
    /** The flight plan renderer to use to render the flight plan. */
    readonly planRenderer: MapSystemPlanRenderer;
    /** The event bus that is connected to the map systems. */
    readonly bus: EventBus;
}
export {};
//# sourceMappingURL=MapSystemContext.d.ts.map