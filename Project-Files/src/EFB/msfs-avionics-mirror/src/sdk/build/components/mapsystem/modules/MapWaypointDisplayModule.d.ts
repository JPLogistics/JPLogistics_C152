import { AirportFacility, Facility, FacilityWaypoint, IntersectionFacility, NdbFacility, VorFacility } from '../../../navigation';
import { NumberUnitSubject } from '../../../math';
import { Subject } from '../../../sub/Subject';
import { AbstractMapModule } from './AbstractMapModule';
/**
 * A handler to determine waypoint visibility.
 */
declare type WaypointVisibilityHandler<T extends Facility> = (w: FacilityWaypoint<T>) => boolean;
/**
 * A map data module that controls waypoint display options.
 */
export declare class MapWaypointDisplayModule extends AbstractMapModule {
    /** A handler that dictates airport waypoint visibility. */
    showAirports: Subject<WaypointVisibilityHandler<AirportFacility>>;
    /** A handler that dictates intersection waypoint visibility. */
    showIntersections: Subject<WaypointVisibilityHandler<IntersectionFacility>>;
    /** A handler that dictates NDB waypoint visibility. */
    showNdbs: Subject<WaypointVisibilityHandler<NdbFacility>>;
    /** A handler that dictates VOR waypoint visibility. */
    showVors: Subject<WaypointVisibilityHandler<VorFacility>>;
    /** The maximum range at which airport waypoints should be searched for. */
    airportsRange: NumberUnitSubject<import("../../../math").UnitFamily.Distance, import("../../../math").SimpleUnit<import("../../../math").UnitFamily.Distance>>;
    /** The maximum range at which intersection waypoints should be searched for. */
    intersectionsRange: NumberUnitSubject<import("../../../math").UnitFamily.Distance, import("../../../math").SimpleUnit<import("../../../math").UnitFamily.Distance>>;
    /** The maximum range at which NDB waypoints should be searched for. */
    ndbsRange: NumberUnitSubject<import("../../../math").UnitFamily.Distance, import("../../../math").SimpleUnit<import("../../../math").UnitFamily.Distance>>;
    /** The maximum range at which VOR waypoints should be searched for. */
    vorsRange: NumberUnitSubject<import("../../../math").UnitFamily.Distance, import("../../../math").SimpleUnit<import("../../../math").UnitFamily.Distance>>;
    /** The maximum number of airports that should be displayed. */
    numAirports: Subject<number>;
    /** The maximum number of intersections that should be displayed. */
    numIntersections: Subject<number>;
    /** The maximum number of NDBs that should be displayed. */
    numNdbs: Subject<number>;
    /** The maximum number of VORs that should be displayed. */
    numVors: Subject<number>;
}
export {};
//# sourceMappingURL=MapWaypointDisplayModule.d.ts.map