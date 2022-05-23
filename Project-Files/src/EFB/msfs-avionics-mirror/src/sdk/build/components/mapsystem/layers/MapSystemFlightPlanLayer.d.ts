import { EventBus } from '../../../data';
import { LegDefinition } from '../../../flightplan';
import { FacilityLoader, FacilityWaypointCache, Waypoint } from '../../../navigation';
import { VNode } from '../../FSComponent';
import { MapCachedCanvasLayer } from '../../map/layers/MapCachedCanvasLayer';
import { MapSyncedCanvasLayer } from '../../map/layers/MapSyncedCanvasLayer';
import { MapLayer, MapLayerProps } from '../../map/MapLayer';
import { MapProjection } from '../../map/MapProjection';
import { GeoProjectionPathStreamStack } from '../../map/GeoProjectionPathStreamStack';
import { MapSystemPlanRenderer } from '../MapSystemPlanRenderer';
import { MapSystemIconFactory, MapSystemLabelFactory, MapSystemWaypointsRenderer } from '../MapSystemWaypointsRenderer';
import { MapFlightPlanModule } from '../modules/MapFlightPlanModule';
/** Props on the MapSystemFlightPlanLayer component. */
interface MapSystemFlightPlanLayerProps extends MapLayerProps<any> {
    /** An instance of the event bus. */
    bus: EventBus;
    /** The waypoint renderer to use with this instance. */
    waypointRenderer: MapSystemWaypointsRenderer;
    /** The icon factory to use with this instance. */
    iconFactory: MapSystemIconFactory;
    /** The label factory to use with this instance. */
    labelFactory: MapSystemLabelFactory;
    /** The flight plan renderer to use with this instance. */
    flightPathRenderer: MapSystemPlanRenderer;
    /** The flight plan index to display. */
    planIndex: number;
}
/**
 * A map system layer that draws the flight plan.
 */
export declare class MapSystemFlightPlanLayer extends MapLayer<MapSystemFlightPlanLayerProps> {
    protected readonly flightPathLayerRef: import("../../FSComponent").NodeReference<MapCachedCanvasLayer<import("../../map/layers/MapCachedCanvasLayer").MapCachedCanvasLayerProps<any>>>;
    protected readonly waypointLayerRef: import("../../FSComponent").NodeReference<MapSyncedCanvasLayer<import("../../map").MapCanvasLayerProps<any>>>;
    protected readonly defaultRoleId: number;
    protected readonly planModule: MapFlightPlanModule;
    protected readonly legWaypoints: Map<LegDefinition, [Waypoint, number]>;
    protected waypointsUpdating: boolean;
    protected readonly facLoader: FacilityLoader;
    protected readonly facWaypointCache: FacilityWaypointCache;
    protected readonly pathStreamStack: GeoProjectionPathStreamStack;
    protected updateScheduled: boolean;
    /** @inheritdoc */
    onAttached(): void;
    /**
     * Initializes the waypoint renderer for this layer.
     */
    protected initWaypointRenderer(): void;
    /** @inheritdoc */
    onUpdated(time: number, elapsed: number): void;
    /** @inheritdoc */
    onMapProjectionChanged(mapProjection: MapProjection, changeFlags: number): void;
    /** @inheritdoc */
    setVisible(val: boolean): void;
    /**
     * Updates waypoints for the flight plan.
     * @throws An error if the waypoints are already updating.
     */
    protected updateWaypoints(): Promise<void>;
    /**
     * Builds or refreshes a flight plan waypoint.
     * @param leg The leg to build the waypoint for.
     * @param roleId The role ID to assign to the waypoint.
     */
    protected buildPlanWaypoint(leg: LegDefinition, roleId: number): Promise<void>;
    /**
     * Builds a flight path terminator based waypoint.
     * @param leg The leg to build the waypoint for.
     * @param roleId The role ID to assign to the waypoint.
     */
    protected buildTerminatorWaypoint(leg: LegDefinition, roleId: number): Promise<void>;
    /**
     * Builds a standard facility fix waypoint for flight plan waypoint display.
     * @param leg The leg to build the waypoint for.
     * @param roleId The role ID to assign to the waypoint.
     */
    protected buildFixWaypoint(leg: LegDefinition, roleId: number): Promise<void>;
    /** @inheritdoc */
    render(): VNode;
}
export {};
//# sourceMappingURL=MapSystemFlightPlanLayer.d.ts.map