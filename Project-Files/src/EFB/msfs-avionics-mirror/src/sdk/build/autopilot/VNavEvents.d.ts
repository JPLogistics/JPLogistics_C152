import { ApproachGuidanceMode, VNavAltCaptureType, VNavAvailability, VNavPathMode, VNavState } from './VerticalNavigation';
import { EventBus } from '../data';
import { SimVarPublisher } from '../instruments';
/**
 * Sim var names for VNAV data.
 */
export declare enum VNavVars {
    /** The vertical deviation. */
    VerticalDeviation = "L:WTAP_VNav_Vertical_Deviation",
    /** The VNAV target altitude. */
    TargetAltitude = "L:WTAP_VNav_Target_Altitude",
    /** The VNAV path mode. */
    PathMode = "L:WTAP_VNav_Path_Mode",
    /** The VNAV State. */
    VNAVState = "L:WTAP_VNav_State",
    /** Whether a VNAV Path Exists for the current leg. */
    PathAvailable = "L:WTAP_VNav_Path_Available",
    /** The VNAV current altitude capture type. */
    CaptureType = "L:WTAP_VNav_Alt_Capture_Type",
    /** The distance to the next TOD, or -1 if one does not exist. */
    TODDistance = "L:WTAP_VNav_Distance_To_TOD",
    /** The index of the leg for the next TOD. */
    TODLegIndex = "L:WTAP_VNav_TOD_Leg_Index",
    /** The distance from the end of the TOD leg that the TOD is. */
    TODDistanceInLeg = "L:WTAP_VNav_TOD_Distance_In_Leg",
    /** The index of the leg for the next BOD. */
    BODLegIndex = "L:WTAP_VNav_BOD_Leg_Index",
    /** The index of the leg for the next constraint. */
    CurrentConstraintLegIndex = "L:WTAP_VNav_Constraint_Leg_Index",
    /** The current constraint altitude. */
    CurrentConstraintAltitude = "L:WTAP_VNav_Constraint_Altitude",
    /** The next constraint altitude. */
    NextConstraintAltitude = "L:WTAP_VNav_Next_Constraint_Altitude",
    /** The distance to the next BOD, or -1 if one does not exist. */
    BODDistance = "L:WTAP_VNav_Distance_To_BOD",
    /** The current required flight path angle. */
    FPA = "L:WTAP_VNav_FPA",
    /** The required VS to the current constraint. */
    RequiredVS = "L:WTAP_VNAV_Required_VS",
    /** The VNAV approach guidance mode. */
    GPApproachMode = "L:WTAP_GP_Approach_Mode",
    /** The current LPV vertical deviation. */
    GPVerticalDeviation = "L:WTAP_GP_Vertical_Deviation",
    /** The current remaining LPV distance. */
    GPDistance = "L:WTAP_GP_Distance",
    /** The current LPV FPA. */
    GPFpa = "L:WTAP_GP_FPA",
    /** The required VS to the current constraint. */
    GPRequiredVS = "L:WTAP_GP_Required_VS"
}
/**
 * Events derived from VNAV sim vars.
 */
interface VNavSimVarEvents {
    /** The vertical deviation, in feet, of the airplane from the calculated VNAV path. */
    vnav_vertical_deviation: number;
    /** The target altitude, in feet, of the currently active VNAV constraint. */
    vnav_target_altitude: number;
    /** The VNAV path mode. */
    vnav_path_mode: VNavPathMode;
    /** Whether a VNAV Path Exists for the current leg. */
    vnav_path_available: boolean;
    /** The VNAV state. */
    vnav_state: VNavState;
    /** The VNAV current alt capture type. */
    vnav_altitude_capture_type: VNavAltCaptureType;
    /** The distance along the flight path from the airplane's present position to the current VNAV TOD, in meters. */
    vnav_tod_distance: number;
    /** The distance from the current VNAV TOD to the end of its containing leg, in meters. */
    vnav_tod_leg_distance: number;
    /** The distance along the flight path from the airplane's present position to the next VNAV BOD, in meters. */
    vnav_bod_distance: number;
    /**
     * The global index of the flight plan leg that contains the TOD associated with the next VNAV BOD, or -1 if there is
     * no such TOD. The TOD is defined as the point along the flight path at which the aircraft will intercept the VNAV
     * profile continuing to the next BOD if it continues to fly level at its current altitude.
     */
    vnav_tod_global_leg_index: number;
    /**
     * The global index of the flight plan leg that contains the next VNAV BOD, or -1 if there is no BOD. The next BOD
     * is defined as the next point in the flight path including or after the active leg where the VNAV profile
     * transitions from a descent to a level-off, discontinuity, or the end of the flight path.
     */
    vnav_bod_global_leg_index: number;
    /** The global index of the leg that contains the current VNAV constraint. */
    vnav_constraint_global_leg_index: number;
    /** The VNAV current constraint altitude in feet. */
    vnav_constraint_altitude: number;
    /** The VNAV next constraint altitude in feet. */
    vnav_next_constraint_altitude: number;
    /**
     * The flight path angle, in degrees, for the currently active VNAV path segment. Positive angles represent
     * descending paths.
     */
    vnav_fpa: number;
    /**
     * The vertical speed, in feet per minute, required for the airplane to meet the next VNAV altitude constraint if it
     * starts climbing/descending from its current altitude immediately.
     */
    vnav_required_vs: number;
    /** The VNAV approach guidance mode. */
    gp_approach_mode: ApproachGuidanceMode;
    /** The current glidepath vertical deviation. */
    gp_vertical_deviation: number;
    /** The current distance to the glidepath endpoint. */
    gp_distance: number;
    /** The current glidepath FPA. */
    gp_fpa: number;
    /** The vertical speed, in feet per minute, required for the airplane to reach the glidepath target. */
    gp_required_vs: number;
}
/**
 * Events published by VNAV.
 */
export interface VNavEvents extends VNavSimVarEvents {
    /** VNAV path calculations were updated for the specified vertical flight plan. */
    vnav_path_calculated: number;
    /** The current availability of VNAV from the director. */
    vnav_availability: VNavAvailability;
}
/** A publisher for VNAV sim var events. */
export declare class VNavSimVarPublisher extends SimVarPublisher<VNavEvents> {
    private static simvars;
    /**
     * Create a VNavSimVarPublisher
     * @param bus The EventBus to publish to
     */
    constructor(bus: EventBus);
    /**
     * Publish a control event.
     * @param event The event from ControlEvents.
     * @param value The value of the event.
     */
    publishEvent<K extends keyof VNavEvents>(event: K, value: VNavEvents[K]): void;
}
export {};
//# sourceMappingURL=VNavEvents.d.ts.map