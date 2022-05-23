import { BitFlags } from '../math/BitFlags';
import { Subject } from '../sub/Subject';
import { UnitType } from '../math/NumberUnit';
import { SimVarValueType } from '../data';
import { FlightPlanSegmentType, LegDefinitionFlags } from '../flightplan';
import { AdditionalApproachType, FacilityType, FixTypeFlags, LegTurnDirection, LegType } from '../navigation';
/**
 * A class that synchronizes the local NXi state to the sim GPS system.
 */
export class GpsSynchronizer {
    /**
     * Creates an instance of GpsSynchronizer.
     * @param bus The bus to source events from.
     * @param flightPlanner An instance of the flight planner.
     * @param facLoader An instance of the facility loader.
     */
    constructor(bus, flightPlanner, facLoader) {
        this.bus = bus;
        this.flightPlanner = flightPlanner;
        this.facLoader = facLoader;
        this.magvar = 0;
        this.distanceToCurrentLeg = -1;
        this.groundSpeed = 0;
        this.trueTrack = 0;
        this.zuluTime = 0;
        this.numPlanLegs = Subject.create(0);
        this.hasReachedDestination = Subject.create(false);
        this.isDestinationLegActive = Subject.create(false);
        this.isDirectToActive = Subject.create(false);
        const lnav = bus.getSubscriber();
        lnav.on('lnavdata_dtk_mag').handle(this.onDtkChanged.bind(this));
        lnav.on('lnavdata_xtk').handle(this.onXtkChanged.bind(this));
        lnav.on('lnavdata_waypoint_distance').handle(this.onLnavDistanceChanged.bind(this));
        lnav.on('lnavdata_waypoint_bearing_mag').handle(this.onLnavBearingChanged.bind(this));
        lnav.on('lnavdata_destination_distance').handle(this.onLnavDistanceToDestinationChanged.bind(this));
        lnav.on('lnav_course_to_steer').handle(this.onLNavCourseToSteerChanged.bind(this));
        const adc = bus.getSubscriber();
        adc.on('hdg_deg_true').handle(this.onTrueHeadingChanged.bind(this));
        const vnav = bus.getSubscriber();
        vnav.on('vnav_required_vs').handle(this.requiredVsChanged.bind(this));
        const gnss = bus.getSubscriber();
        gnss.on('gps-position').handle(this.onPositionChanged.bind(this));
        gnss.on('zulu_time').handle(t => this.zuluTime = t);
        gnss.on('track_deg_true').handle(this.onTrackTrueChanged.bind(this));
        gnss.on('ground_speed').handle(this.onGroundSpeedChanged.bind(this));
        gnss.on('magvar').handle(this.onMagvarChanged.bind(this));
        const plan = bus.getSubscriber();
        plan.on('fplActiveLegChange').handle(() => {
            this.hasReachedDestination.set(false);
            if (this.flightPlanner.hasActiveFlightPlan()) {
                const activeFlightplan = this.flightPlanner.getActiveFlightPlan();
                this.checkDestinationLegActive(activeFlightplan);
                this.checkDirectToState(activeFlightplan);
                this.onIsPrevLegChanged(activeFlightplan);
                this.onWaypointIndexChanged(activeFlightplan);
            }
        });
        plan.on('fplSegmentChange').handle(this.onPlanChanged.bind(this));
        plan.on('fplIndexChanged').handle(this.onPlanChanged.bind(this));
        this.numPlanLegs.sub(this.onNumLegsChanged.bind(this));
    }
    /**
     * Updates the GpsSynchronizer.
     */
    update() {
        const isGpsOverridden = SimVar.GetSimVarValue('GPS OVERRIDDEN', SimVarValueType.Bool);
        if (!isGpsOverridden) {
            SimVar.SetSimVarValue('GPS OVERRIDDEN', SimVarValueType.Bool, true);
        }
        let numPlanLegs = 0;
        if (this.flightPlanner.hasActiveFlightPlan()) {
            const plan = this.flightPlanner.getActiveFlightPlan();
            numPlanLegs = plan.length;
        }
        this.numPlanLegs.set(numPlanLegs);
    }
    /**
     * Handles when the active plan segments are changed.
     */
    onPlanChanged() {
        const plan = this.flightPlanner.getActiveFlightPlan();
        const approachSegments = [...plan.segmentsOfType(FlightPlanSegmentType.Approach)];
        if (approachSegments && approachSegments.length > 0) {
            SimVar.SetSimVarValue('GPS IS APPROACH LOADED', SimVarValueType.Bool, true);
            //SimVar.SetSimVarValue('GPS APPROACH WP COUNT', SimVarValueType.Number, approachSegments[0].legs.length);
        }
        else {
            SimVar.SetSimVarValue('GPS IS APPROACH LOADED', SimVarValueType.Bool, false);
            //SimVar.SetSimVarValue('GPS APPROACH WP COUNT', SimVarValueType.Number, 0);
        }
        //SimVar.SetSimVarValue('GPS APPROACH APPROACH INDEX', SimVarValueType.Number, plan.procedureDetails.approachIndex);
        //SimVar.SetSimVarValue('GPS APPROACH TRANSITION INDEX', SimVarValueType.Number, plan.procedureDetails.approachTransitionIndex);
        this.checkApproachTypeAndTimezone(plan, plan.procedureDetails.approachIndex);
        this.hasReachedDestination.set(false);
        this.checkDestinationLegActive(plan);
        this.checkDirectToState(plan);
        this.onIsPrevLegChanged(plan);
        this.onWaypointIndexChanged(plan);
    }
    /**
     * Handles when the course steered by LNAV changes.
     * @param course The course steered by LNAV, in degrees true.
     */
    onLNavCourseToSteerChanged(course) {
        SimVar.SetSimVarValue('GPS COURSE TO STEER', SimVarValueType.Degree, course);
    }
    /**
     * Checks to see if we are in a direct to state.
     * @param plan The Active Flight Plan.
     */
    checkDirectToState(plan) {
        let isDirectToActive = false;
        if (plan.activeLateralLeg >= 0 && plan.activeLateralLeg < plan.length) {
            const activeLeg = plan.getLeg(plan.activeLateralLeg);
            isDirectToActive = BitFlags.isAll(activeLeg.flags, LegDefinitionFlags.DirectTo);
        }
        this.isDirectToActive.set(isDirectToActive);
    }
    /**
     * Checks to see if we have reached the plan destination.
     * @param plan The Active Flight Plan
     */
    checkDestinationLegActive(plan) {
        if (plan.length > 1) {
            const finalSegment = plan.getSegment(plan.getSegmentIndex(plan.length - 1));
            const isApproachActive = plan.activeLateralLeg >= finalSegment.offset && finalSegment.segmentType === FlightPlanSegmentType.Approach;
            SimVar.SetSimVarValue('GPS IS APPROACH ACTIVE', SimVarValueType.Bool, isApproachActive);
            let destinationLegIndex = plan.length - 1;
            let fafIndex = -1;
            if (isApproachActive) {
                for (let i = finalSegment.legs.length - 1; i >= 0; i--) {
                    const leg = finalSegment.legs[i];
                    if (!BitFlags.isAll(leg.flags, LegDefinitionFlags.MissedApproach)) {
                        destinationLegIndex = i + finalSegment.offset;
                    }
                    if (leg.leg.fixTypeFlags === FixTypeFlags.FAF) {
                        fafIndex = i + finalSegment.offset;
                        break;
                    }
                }
            }
            this.checkApproachMode(plan, isApproachActive, fafIndex);
            if (!this.hasReachedDestination.get() && destinationLegIndex === plan.activeLateralLeg) {
                this.isDestinationLegActive.set(true);
                return;
            }
        }
        else {
            this.checkApproachMode(plan, false, -1);
        }
        this.isDestinationLegActive.set(false);
    }
    /**
     * Checks the approach mode on leg change.
     * @param plan The Active Flight Plan.
     * @param isApproachActive Whether the approach is active.
     * @param fafIndex The destination leg index.
     */
    checkApproachMode(plan, isApproachActive, fafIndex) {
        let approachMode = 0;
        let currentLeg;
        if (isApproachActive && plan.activeLateralLeg >= 0 && plan.activeLateralLeg < plan.length) {
            currentLeg = plan.getLeg(plan.activeLateralLeg);
            if (BitFlags.isAll(currentLeg.flags, LegDefinitionFlags.MissedApproach)) {
                approachMode = 3;
            }
            else if (fafIndex > -1 && plan.activeLateralLeg >= fafIndex) {
                approachMode = 2;
            }
            else {
                approachMode = 1;
            }
        }
        this.checkApproachWaypointType(currentLeg);
        SimVar.SetSimVarValue('GPS APPROACH MODE', SimVarValueType.Number, approachMode);
        SimVar.SetSimVarValue('GPS APPROACH IS FINAL', SimVarValueType.Bool, approachMode === 2);
    }
    /**
     * Handles when the active leg index changes.
     * @param plan The Active Flight Plan.
     */
    onWaypointIndexChanged(plan) {
        var _a;
        if (plan.activeLateralLeg >= 0 && plan.activeLateralLeg < plan.length) {
            const leg = plan.getLeg(plan.activeLateralLeg);
            SimVar.SetSimVarValue('GPS WP NEXT ID', SimVarValueType.String, (_a = leg.name) !== null && _a !== void 0 ? _a : '');
            if (leg === null || leg === void 0 ? void 0 : leg.calculated) {
                SimVar.SetSimVarValue('GPS WP NEXT LAT', SimVarValueType.Degree, leg.calculated.endLat);
                SimVar.SetSimVarValue('GPS WP NEXT LON', SimVarValueType.Degree, leg.calculated.endLon);
            }
        }
    }
    /**
     * Handles when the number of active plan legs changes.
     * @param numLegs The number of active plan legs.
     */
    onNumLegsChanged(numLegs) {
        SimVar.SetSimVarValue('GPS IS ACTIVE FLIGHT PLAN', SimVarValueType.Bool, numLegs > 0);
        SimVar.SetSimVarValue('GPS IS ACTIVE WAY POINT', SimVarValueType.Bool, numLegs > 1);
        //SimVar.SetSimVarValue('GPS FLIGHT PLAN WP COUNT', SimVarValueType.Number, numLegs);
        if (this.flightPlanner.hasActiveFlightPlan()) {
            const plan = this.flightPlanner.getActiveFlightPlan();
            this.onIsPrevLegChanged(plan);
        }
    }
    /**
     * Handles when the previous leg changes.
     * @param plan The Active Flight Plan
     */
    onIsPrevLegChanged(plan) {
        const numLegs = this.numPlanLegs.get();
        if (numLegs > 1 && plan.activeLateralLeg > 0 && plan.activeLateralLeg < plan.length) {
            const prevLeg = plan.getLeg(plan.activeLateralLeg - 1);
            if (prevLeg.leg.type !== LegType.Discontinuity && prevLeg.leg.type !== LegType.ThruDiscontinuity) {
                SimVar.SetSimVarValue('GPS WP PREV VALID', SimVarValueType.Bool, true);
                if (prevLeg.calculated) {
                    SimVar.SetSimVarValue('GPS WP PREV LAT', SimVarValueType.Degree, prevLeg.calculated.endLat);
                    SimVar.SetSimVarValue('GPS WP PREV LON', SimVarValueType.Degree, prevLeg.calculated.endLon);
                }
            }
        }
    }
    /**
     * Handles when the LNAV Distance to Destination Changes.
     * @param dis The new distance to destination.
     */
    onLnavDistanceToDestinationChanged(dis) {
        const eteSeconds = 3600 * dis / this.groundSpeed;
        if (isNaN(eteSeconds)) {
            return;
        }
        SimVar.SetSimVarValue('GPS ETE', SimVarValueType.Seconds, eteSeconds);
        SimVar.SetSimVarValue('GPS ETA', SimVarValueType.Seconds, eteSeconds + this.zuluTime);
    }
    /**
     * Handles when the LNAV DTK changes.
     * @param dtk The new DTK.
     */
    onDtkChanged(dtk) {
        SimVar.SetSimVarValue('GPS WP DESIRED TRACK', SimVarValueType.Radians, UnitType.DEGREE.convertTo(dtk, UnitType.RADIAN));
    }
    /**
     * Handles when the LNAV XTK changes.
     * @param xtk The new XTK.
     */
    onXtkChanged(xtk) {
        SimVar.SetSimVarValue('GPS WP CROSS TRK', SimVarValueType.Meters, UnitType.NMILE.convertTo(xtk, UnitType.METER) * -1);
    }
    /**
     * Handles when the LNAV DIS to WP changes.
     * @param dis The distance.
     */
    onLnavDistanceChanged(dis) {
        if (this.isDestinationLegActive.get() && dis < 1000) {
            this.hasReachedDestination.set(true);
        }
        const distanceMeters = UnitType.NMILE.convertTo(dis, UnitType.METER);
        SimVar.SetSimVarValue('GPS WP DISTANCE', SimVarValueType.Meters, distanceMeters);
        const eteSeconds = 3600 * dis / this.groundSpeed;
        SimVar.SetSimVarValue('GPS WP ETE', SimVarValueType.Seconds, eteSeconds);
        SimVar.SetSimVarValue('GPS WP ETA', SimVarValueType.Seconds, eteSeconds + this.zuluTime);
    }
    /**
     * Handles when the LNAV Bearing to WP changes.
     * @param brg The bearing.
     */
    onLnavBearingChanged(brg) {
        SimVar.SetSimVarValue('GPS WP BEARING', SimVarValueType.Radians, UnitType.DEGREE.convertTo(brg, UnitType.RADIAN));
    }
    /**
     * Handles when the True Ground Track Changes.
     * @param trk The true track.
     */
    onTrackTrueChanged(trk) {
        SimVar.SetSimVarValue('GPS GROUND TRUE TRACK', SimVarValueType.Radians, UnitType.DEGREE.convertTo(trk, UnitType.RADIAN));
    }
    /**
     * Handles when the Ground Speed changes.
     * @param gs The current ground speed.
     */
    onGroundSpeedChanged(gs) {
        this.groundSpeed = gs;
        SimVar.SetSimVarValue('GPS GROUND SPEED', SimVarValueType.MetersPerSecond, UnitType.KNOT.convertTo(gs, UnitType.MPS));
    }
    /**
     * Handles when the true heading changes.
     * @param hdg The true heading.
     */
    onTrueHeadingChanged(hdg) {
        SimVar.SetSimVarValue('GPS GROUND TRUE HEADING', SimVarValueType.Radians, UnitType.DEGREE.convertTo(hdg, UnitType.RADIAN));
    }
    /**
     * Handles when the magvar changes.
     * @param magvar The new magvar.
     */
    onMagvarChanged(magvar) {
        this.magvar = magvar;
        SimVar.SetSimVarValue('GPS MAGVAR', SimVarValueType.Radians, UnitType.DEGREE.convertTo(magvar, UnitType.RADIAN));
    }
    /**
     * Handles when the VNAV required VS changes.
     * @param vs The required vertical speed.
     */
    requiredVsChanged(vs) {
        SimVar.SetSimVarValue('GPS WP VERTICAL SPEED', SimVarValueType.FPM, vs);
    }
    /**
     * Handles when the plane position changes.
     * @param pos The new plane position.
     */
    onPositionChanged(pos) {
        SimVar.SetSimVarValue('GPS POSITION LAT', SimVarValueType.Degree, pos.lat);
        SimVar.SetSimVarValue('GPS POSITION LON', SimVarValueType.Degree, pos.long);
        SimVar.SetSimVarValue('GPS POSITION ALT', SimVarValueType.Meters, pos.alt);
    }
    /**
     * Handles checking the approach type and timezone.
     * @param plan The active flight plan.
     * @param approachIndex The approach index in the active plan.
     */
    async checkApproachTypeAndTimezone(plan, approachIndex) {
        let approachType = 0;
        if (plan.getUserData('visual_approach') !== undefined) {
            approachType = ApproachType.APPROACH_TYPE_RNAV;
        }
        else if (approachIndex > -1 && plan.destinationAirport) {
            const facility = await this.facLoader.getFacility(FacilityType.Airport, plan.destinationAirport);
            approachType = facility.approaches[approachIndex].approachType;
            if (approachType === AdditionalApproachType.APPROACH_TYPE_VISUAL) {
                approachType = ApproachType.APPROACH_TYPE_RNAV;
            }
            // TODO: Find a way to get the timezone from the facility or by lat/lon?
        }
        SimVar.SetSimVarValue('GPS APPROACH APPROACH TYPE', SimVarValueType.Number, approachType);
    }
    /**
     * Handles checking the approach waypoint type.
     * @param leg The active lateral leg.
     */
    checkApproachWaypointType(leg) {
        let legType = 0;
        let segmentType = 0;
        if (leg) {
            switch (leg.leg.type) {
                case LegType.AF:
                    legType = leg.leg.turnDirection === LegTurnDirection.Left ? 4 : 5;
                    segmentType = leg.leg.turnDirection === LegTurnDirection.Left ? 2 : 1;
                    break;
                case LegType.RF:
                    legType = 1;
                    segmentType = leg.leg.turnDirection === LegTurnDirection.Left ? 2 : 1;
                    break;
                case LegType.CA:
                case LegType.FA:
                case LegType.VA:
                    legType = 9;
                    break;
                case LegType.FM:
                case LegType.VM:
                    legType = 10;
                    break;
                case LegType.CD:
                case LegType.FD:
                case LegType.VD:
                    legType = 8;
                    break;
                case LegType.PI:
                    legType = leg.leg.turnDirection === LegTurnDirection.Left ? 2 : 3;
                    break;
                case LegType.HA:
                case LegType.HM:
                case LegType.HF:
                    legType = leg.leg.turnDirection === LegTurnDirection.Left ? 6 : 7;
                    break;
                default:
                    legType = 1;
            }
        }
        SimVar.SetSimVarValue('GPS APPROACH WP TYPE', SimVarValueType.Number, legType);
        SimVar.SetSimVarValue('GPS APPROACH SEGMENT TYPE', SimVarValueType.Number, segmentType);
        SimVar.SetSimVarValue('GPS APPROACH IS WP RUNWAY', SimVarValueType.Bool, (leg === null || leg === void 0 ? void 0 : leg.leg.fixIcao[0]) === 'R');
    }
}
