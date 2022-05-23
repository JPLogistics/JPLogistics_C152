import { NumberUnitSubject, UnitType } from '../../../math';
import { Subject } from '../../../sub/Subject';
import { AbstractMapModule } from './AbstractMapModule';
/**
 * A map data module that controls waypoint display options.
 */
export class MapWaypointDisplayModule extends AbstractMapModule {
    constructor() {
        super(...arguments);
        /** A handler that dictates airport waypoint visibility. */
        this.showAirports = Subject.create(() => true);
        /** A handler that dictates intersection waypoint visibility. */
        this.showIntersections = Subject.create(() => false);
        /** A handler that dictates NDB waypoint visibility. */
        this.showNdbs = Subject.create(() => true);
        /** A handler that dictates VOR waypoint visibility. */
        this.showVors = Subject.create(() => true);
        /** The maximum range at which airport waypoints should be searched for. */
        this.airportsRange = NumberUnitSubject.createFromNumberUnit(UnitType.NMILE.createNumber(50));
        /** The maximum range at which intersection waypoints should be searched for. */
        this.intersectionsRange = NumberUnitSubject.createFromNumberUnit(UnitType.NMILE.createNumber(50));
        /** The maximum range at which NDB waypoints should be searched for. */
        this.ndbsRange = NumberUnitSubject.createFromNumberUnit(UnitType.NMILE.createNumber(500));
        /** The maximum range at which VOR waypoints should be searched for. */
        this.vorsRange = NumberUnitSubject.createFromNumberUnit(UnitType.NMILE.createNumber(500));
        /** The maximum number of airports that should be displayed. */
        this.numAirports = Subject.create(40);
        /** The maximum number of intersections that should be displayed. */
        this.numIntersections = Subject.create(40);
        /** The maximum number of NDBs that should be displayed. */
        this.numNdbs = Subject.create(40);
        /** The maximum number of VORs that should be displayed. */
        this.numVors = Subject.create(40);
    }
}
