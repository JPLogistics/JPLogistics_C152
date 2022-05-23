import { EventBus } from '../data';
import { FlightPlanner } from '../flightplan';
import { FacilityLoader } from '../navigation';
/**
 * A class that synchronizes the local NXi state to the sim GPS system.
 */
export declare class GpsSynchronizer {
    private bus;
    private flightPlanner;
    private readonly facLoader;
    private magvar;
    private distanceToCurrentLeg;
    private groundSpeed;
    private trueTrack;
    private zuluTime;
    private numPlanLegs;
    private hasReachedDestination;
    private isDestinationLegActive;
    private isDirectToActive;
    /**
     * Creates an instance of GpsSynchronizer.
     * @param bus The bus to source events from.
     * @param flightPlanner An instance of the flight planner.
     * @param facLoader An instance of the facility loader.
     */
    constructor(bus: EventBus, flightPlanner: FlightPlanner, facLoader: FacilityLoader);
    /**
     * Updates the GpsSynchronizer.
     */
    update(): void;
    /**
     * Handles when the active plan segments are changed.
     */
    private onPlanChanged;
    /**
     * Handles when the course steered by LNAV changes.
     * @param course The course steered by LNAV, in degrees true.
     */
    private onLNavCourseToSteerChanged;
    /**
     * Checks to see if we are in a direct to state.
     * @param plan The Active Flight Plan.
     */
    private checkDirectToState;
    /**
     * Checks to see if we have reached the plan destination.
     * @param plan The Active Flight Plan
     */
    private checkDestinationLegActive;
    /**
     * Checks the approach mode on leg change.
     * @param plan The Active Flight Plan.
     * @param isApproachActive Whether the approach is active.
     * @param fafIndex The destination leg index.
     */
    private checkApproachMode;
    /**
     * Handles when the active leg index changes.
     * @param plan The Active Flight Plan.
     */
    private onWaypointIndexChanged;
    /**
     * Handles when the number of active plan legs changes.
     * @param numLegs The number of active plan legs.
     */
    private onNumLegsChanged;
    /**
     * Handles when the previous leg changes.
     * @param plan The Active Flight Plan
     */
    private onIsPrevLegChanged;
    /**
     * Handles when the LNAV Distance to Destination Changes.
     * @param dis The new distance to destination.
     */
    private onLnavDistanceToDestinationChanged;
    /**
     * Handles when the LNAV DTK changes.
     * @param dtk The new DTK.
     */
    private onDtkChanged;
    /**
     * Handles when the LNAV XTK changes.
     * @param xtk The new XTK.
     */
    private onXtkChanged;
    /**
     * Handles when the LNAV DIS to WP changes.
     * @param dis The distance.
     */
    private onLnavDistanceChanged;
    /**
     * Handles when the LNAV Bearing to WP changes.
     * @param brg The bearing.
     */
    private onLnavBearingChanged;
    /**
     * Handles when the True Ground Track Changes.
     * @param trk The true track.
     */
    private onTrackTrueChanged;
    /**
     * Handles when the Ground Speed changes.
     * @param gs The current ground speed.
     */
    private onGroundSpeedChanged;
    /**
     * Handles when the true heading changes.
     * @param hdg The true heading.
     */
    private onTrueHeadingChanged;
    /**
     * Handles when the magvar changes.
     * @param magvar The new magvar.
     */
    private onMagvarChanged;
    /**
     * Handles when the VNAV required VS changes.
     * @param vs The required vertical speed.
     */
    private requiredVsChanged;
    /**
     * Handles when the plane position changes.
     * @param pos The new plane position.
     */
    private onPositionChanged;
    /**
     * Handles checking the approach type and timezone.
     * @param plan The active flight plan.
     * @param approachIndex The approach index in the active plan.
     */
    private checkApproachTypeAndTimezone;
    /**
     * Handles checking the approach waypoint type.
     * @param leg The active lateral leg.
     */
    private checkApproachWaypointType;
}
//# sourceMappingURL=GpsSynchronizer.d.ts.map