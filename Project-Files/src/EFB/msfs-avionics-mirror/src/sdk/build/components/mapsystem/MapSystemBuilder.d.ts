import { Subscribable } from '../..';
import { EventBus } from '../../data';
import { FlightPlanner } from '../../flightplan';
import { Waypoint } from '../../navigation';
import { TCAS } from '../../traffic';
import { ComponentProps, NodeReference, VNode } from '../FSComponent';
import { MapComponent, MapComponentProps, MapCullableLocationTextLabel, MapProjection, MapWaypointIcon } from '../map';
import { MapSystemContext, ReadOnlyMapSystemContext } from './MapSystemContext';
import { LegStyleHandler, LegWaypointHandler, MapSystemPlanRenderer } from './MapSystemPlanRenderer';
import { MapSystemIconFactory, MapSystemLabelFactory, MapSystemWaypointsRenderer } from './MapSystemWaypointsRenderer';
import { MapModule } from './modules/MapModule';
import { MapTrafficIntruderIconFactory } from './layers/MapSystemTrafficLayer';
/**
 * Props on the MapSystem component.
 */
export interface MapSystemProps extends ComponentProps {
    /** The unique BingMap ID to assign to this map system. */
    bingId: string;
    /** The CSS class to apply to the map system container. */
    class?: string;
    /** A callback fired when the map system's projected size changes. */
    onProjectedSizeChanged?: (component: MapSystemComponent) => void;
}
/**
 * Props on the internal MapSystemComponent component.
 */
interface MapSystemComponentProps extends MapComponentProps<any> {
    /** The CSS class to apply to the map system container. */
    class?: string;
    /** A callback fired when the map system's projected size changes. */
    onProjectedSizeChanged?: (component: MapSystemComponent) => void;
    /** The map system context to use with this map system. */
    context: MapSystemContext;
}
/**
 * A compiled map system available after build.
 */
export interface CompiledMapSystem {
    /** The map system context. */
    context: ReadOnlyMapSystemContext;
    /** The reference to the map system component, available after rendering. */
    ref: NodeReference<MapComponent>;
    /** The compiled JSX map system component. */
    Map: (props: MapSystemProps) => MapComponent;
}
/**
 * A type that describes parameters to controller constructors.
 */
declare type ControllerParams<T extends new (...args: [ReadOnlyMapSystemContext, ...any | never]) => any> = T extends new (...args: [ReadOnlyMapSystemContext, ...infer P]) => any ? P : never;
/**
 * A class that builds dynamic components for complex map systems.
 */
export declare class MapSystemBuilder {
    /**
     * Creates an instance of a map system builder.
     * @param bus The event bus to use with this instance.
     * @param projection The optional external map projection to use with this instance.
     * @returns A new MapSystemBuilder.
     */
    static create(bus: EventBus, projection?: MapProjection): MapSystemBuilder;
    protected readonly context: MapSystemContext;
    /**
     * Creates an instance of a map system builder.
     * @param bus The event bus to use with this instance.
     * @param projection The map projection to use with this instance.
     */
    protected constructor(bus: EventBus, projection: MapProjection);
    /**
     * Sets up a default map system, with a single BingMap terrain layer, default black ground with blue water terrain colors,
     * absolute terrain, and pre-wired to aircraft position and rotation.
     * @returns The modified MapSystemBuilder.
     */
    withTerrainMap(): this;
    /**
     * Sets up a layer containing the aircraft ownship icon.
     * @param imageFilePath A subscribable to the path containing the ownship icon file.
     * @param size The size of the icon square, in pixels.
     * @param anchor The point on the icon which is anchored to the airplane's position, expressed relative to the icon's width and
     * height, with [0, 0] at the top left and [1, 1] at the bottom right.
     * @param className The name of the CSS class to apply to this layer container.
     * @returns The modified MapSystemBuilder.
     */
    withOwnshipIcon(imageFilePath: Subscribable<string>, size: number, anchor?: Subscribable<Float64Array>, className?: string): this;
    /**
     * Adds a waypoint display system to the map system.
     * @param builder An optional configuration builder that will configure the waypoint display.
     * @returns The modified MapSystemBuilder.
     */
    withWaypointDisplay(builder?: (context: MapSystemContext, builder: WaypointDisplayBuilder) => void): this;
    /**
     * Adds a flight plan display to the map system.
     * @param flightPlanner The flight planner to use with this layer. If more than one flight play display
     * layer is added, subsequent layers will use the same flight planner.
     * @param planIndex The index of the flight plan to display.
     * @param builder An optional configuration builder that will configure the flight plan display.
     * @returns The modified MapSystemBuilder.
     */
    withFlightPlanDisplay(flightPlanner: FlightPlanner, planIndex: number, builder?: (context: MapSystemContext, builder: FlightPlanDisplayBuilder) => void): this;
    /**
     * Adds a traffic display to the map system.
     * @param tcas The TCAS used by the traffic display.
     * @param iconFactory A function which creates intruder icons for the traffic display.
     * @param initCanvasStyles A function which initializes global canvas styles for the traffic display.
     * @returns The modified MapSystemBuilder.
     */
    withTrafficDisplay(tcas: TCAS, iconFactory: MapTrafficIntruderIconFactory, initCanvasStyles?: (context: CanvasRenderingContext2D) => void): this;
    /**
     * Adds the text label layer to the map system. If the text label layer was already added, then it will
     * be moved to the top of the layer stack.
     * @param cullingEnabled True if text label collision culling should be enabled, false otherwise.
     * @returns The modified MapSystemBuilder.
     */
    withTextLabels(cullingEnabled?: boolean): this;
    /**
     * Configures the map system such that the map position center is offset by the specified [x, y]
     * number of pixels.
     * @param offset The offset in pixels, in [x, y] format.
     * @returns The modified MapSystemBuilder.
     */
    withCenterOffset(offset: Float64Array): this;
    /**
     * Configures the map system to the specified projected size. The map projection will automatically
     * add sufficient boundary outsize of this projected size to account for map corners during map rotations.
     * @param size The projected size of the map in pixels, in [width, height] format.
     * @returns The modified MapSystemBuilder.
     */
    withSize(size: Float64Array): this;
    /**
     * Configures the map system to wait a certain amount of time before binding the map.
     * This is mainly used as a workaround for a native bug in the weather renderer
     * to make some instruments bind the map beofre others.
     * If you don't know if you have the issue, then you don't have to use this setting.
     * @param delay How long to delay in ms before binding the map.
     * @returns The modified MapSystemBuilder.
     */
    withDelay(delay: number): this;
    /**
     * Configures the map system to add a layer to the map. Layers are rendered in the order
     * that they are added to the system.
     * @param key The string key of the layer.
     * @param factory The factory that constructs the layer.
     * @returns The modified MapSystemBuilder.
     */
    withLayer(key: string, factory: (context: MapSystemContext) => VNode): this;
    /**
     * Configures the map system to add a map data module to the map. Modules may request that other
     * modules be present when the map system is built; if these modules are not added then the map
     * system may fail to build.
     * @param key The string key of the map data module, which may be used by other modules to check for
     * module dependencies.
     * @param factory The factory that constructs the module.
     * @returns The modified MapSystemBuilder.
     */
    withModule(key: string, factory: (context: MapSystemContext) => MapModule): this;
    /**
     * Configures the map system to use a controller, which is constructed after the map system has rendered.
     * @param controller The controller to use.
     * @param args The arguments to pass to the controller's constructor.
     * @returns The modified map builder.
     */
    withController<T extends new (...args: [ReadOnlyMapSystemContext, ...any | never]) => any>(controller: T, ...args: ControllerParams<T>): this;
    /**
     * A generalized builder function that supplies the current map system context.
     * @param builder The builder to use to configure the map system.
     * @returns The modified MapSystemBuilder.
     */
    with(builder: (context: MapSystemContext) => void): this;
    /**
     * Configures the map to synchronize at a specified refresh rate.
     * @param refreshRate The refresh rate to update at, in Hz.
     * @returns The modified MapSystemBuilder.
     */
    withRefreshRate(refreshRate: number): this;
    /**
     * Builds the map system and returns a dynamic component that can be used to render
     * the built map system.
     * @returns The compiled map system.
     */
    build(): CompiledMapSystem;
    /**
     * Builds the default map system BingMap layer.
     * @param context The map system context.
     * @returns The built default BingMap layer.
     */
    protected buildDefaultBingLayer(context: MapSystemContext): VNode;
    /**
     * Builds the default waypoint display layers.
     * @param useTargetAsSearchCenter Whether or not to use the map target as the waypoint search center instead
     * of the map center.
     * @returns The built default waypoint display layers.
     */
    protected buildDefaultWaypointLayer(useTargetAsSearchCenter: boolean): any;
}
/**
 * A component that encompasses the compiled map system.
 */
export declare class MapSystemComponent extends MapComponent<MapSystemComponentProps> {
    private readonly controllers;
    /** @inheritdoc */
    onAfterRender(thisNode: VNode): void;
    /** @inheritdoc */
    protected onProjectedSizeChanged(): void;
    /** @inheritdoc */
    render(): VNode;
}
/**
 * A class that builds a configuration for the waypoint display.
 */
export declare class WaypointDisplayBuilder {
    protected readonly iconFactory: MapSystemIconFactory;
    protected readonly labelFactory: MapSystemLabelFactory;
    protected readonly waypointRenderer: MapSystemWaypointsRenderer;
    protected roleGroup: string;
    protected isCenterTarget: boolean;
    protected labelCullingEnabled: boolean;
    /**
     * Creates an instance of the WaypointDisplayBuilder.
     * @param iconFactory The icon factory to use with this builder.
     * @param labelFactory The label factory to use with this builder.
     * @param waypointRenderer The waypoint renderer to use with this builder.
     */
    constructor(iconFactory: MapSystemIconFactory, labelFactory: MapSystemLabelFactory, waypointRenderer: MapSystemWaypointsRenderer);
    /**
     * Adds a icon configuration to the waypoint display system.
     * @param role The role to add this waypoint display config for.
     * @param type The type of waypoint to add an icon for.
     * @param config The waypoint icon factory to add as a configuration.
     * @returns The modified builder.
     */
    addIcon<T extends Waypoint>(role: number | string, type: string, config: (waypoint: T) => MapWaypointIcon<T>): this;
    /**
     * Adds a default icon configuration to the waypoint display system, if no other configuration is found.
     * @param role The role to add this waypoint display config for.
     * @param config The waypoint icon factory to add as a configuration.
     * @returns The modified builder.
     */
    addDefaultIcon<T extends Waypoint>(role: number | string, config: (waypoint: T) => MapWaypointIcon<T>): this;
    /**
     * Adds a label configuration to the waypoint display system.
     * @param role The role to add this waypoint display config for.
     * @param type The type of waypoint to add an label for.
     * @param config The waypoint label factory to add as a configuration.
     * @returns The modified builder.
     */
    addLabel<T extends Waypoint>(role: number | string, type: string, config: (waypoint: T) => MapCullableLocationTextLabel): this;
    /**
     * Adds a label configuration to the waypoint display system.
     * @param role The role to add this waypoint display config for.
     * @param config The waypoint label factory to add as a configuration.
     * @returns The modified builder.
     */
    addDefaultLabel<T extends Waypoint>(role: number | string, config: (waypoint: T) => MapCullableLocationTextLabel): this;
    /**
     * Determines the role ID given either a numeric or string based role.
     * @param role The role to determine.
     * @returns The numeric role ID.
     */
    private determineRoleId;
    /**
     * Registers a waypoint display role for use with the flight plan rendering
     * system.
     * @param name The name of the role to register.
     * @returns The modified builder.
     */
    registerRole(name: string): this;
    /**
     * Gets the ID of a role in the waypoint display system.
     * @param role The name of the role to get the ID for.
     * @returns The ID of the role.
     * @throws An error if an invalid role name is supplied.
     */
    getRoleId(role: string): number;
    /**
     * Configures the center for waypoint searches for this display.
     * @param center If center, then waypoint searches will use the map center. If target,
     * waypoint searches will use the map target with offset.
     * @returns The modified builder.
     */
    withSearchCenter(center: 'center' | 'target'): this;
    /**
     * Configures whether or not collision culling of the map's labels is enabled.
     * @param enabled Will cull if true, will not cull if false.
     * @returns The modified builder.
     */
    withLabelCulling(enabled: true): this;
    /**
     * Gets if the waypoint search is using the map target with offset as the search center.
     * @returns True if the search center is the map target, false if it is the map center.
     */
    getIsCenterTarget(): boolean;
    /**
     * Gets whether or not collision culling of the map's labels is enabled.
     * @returns True if culling enabled, false otherwise.
     */
    getCullingEnabled(): boolean;
}
/**
 * A class that builds the configuration for the flight plan display.
 */
export declare class FlightPlanDisplayBuilder extends WaypointDisplayBuilder {
    private readonly flightPlanRenderer;
    private readonly planIndex;
    protected roleGroup: string;
    /**
     * Creates an instance of the WaypointDisplayBuilder.
     * @param iconFactory The icon factory to use with this builder.
     * @param labelFactory The label factory to use with this builder.
     * @param waypointRenderer The waypoint renderer to use with this builder.
     * @param flightPlanRenderer The flight plan renderer to use with this builder.
     * @param planIndex The flight plan index to be displayed by this system.
     */
    constructor(iconFactory: MapSystemIconFactory, labelFactory: MapSystemLabelFactory, waypointRenderer: MapSystemWaypointsRenderer, flightPlanRenderer: MapSystemPlanRenderer, planIndex: number);
    /**
     * Registers a waypoint display role for use with the flight plan rendering
     * system.
     * @param name The name of the role to register.
     * @returns The modified builder.
     */
    registerRole(name: string): this;
    /**
     * Configures the flight path display to use styles returned by the provided function.
     * @param handler The handler to use to return the required path rendering styles.
     * @returns The modified builder.
     */
    withLegPathStyles(handler: LegStyleHandler): this;
    /**
     * Configures the flight plan waypoint display to use the roles returned by the
     * provided function.
     * @param handler The handler to use to return the required waypoint display roles.
     * @returns The modified builder.
     */
    withLegWaypointRoles(handler: LegWaypointHandler): this;
}
export {};
//# sourceMappingURL=MapSystemBuilder.d.ts.map