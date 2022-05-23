import { SimVarValueType } from '../data';
import { SimVarPublisher } from '../instruments';
/**
 * Sim var names for VNAV data.
 */
export var VNavVars;
(function (VNavVars) {
    /** The vertical deviation. */
    VNavVars["VerticalDeviation"] = "L:WTAP_VNav_Vertical_Deviation";
    /** The VNAV target altitude. */
    VNavVars["TargetAltitude"] = "L:WTAP_VNav_Target_Altitude";
    /** The VNAV path mode. */
    VNavVars["PathMode"] = "L:WTAP_VNav_Path_Mode";
    /** The VNAV State. */
    VNavVars["VNAVState"] = "L:WTAP_VNav_State";
    /** Whether a VNAV Path Exists for the current leg. */
    VNavVars["PathAvailable"] = "L:WTAP_VNav_Path_Available";
    /** The VNAV current altitude capture type. */
    VNavVars["CaptureType"] = "L:WTAP_VNav_Alt_Capture_Type";
    /** The distance to the next TOD, or -1 if one does not exist. */
    VNavVars["TODDistance"] = "L:WTAP_VNav_Distance_To_TOD";
    /** The index of the leg for the next TOD. */
    VNavVars["TODLegIndex"] = "L:WTAP_VNav_TOD_Leg_Index";
    /** The distance from the end of the TOD leg that the TOD is. */
    VNavVars["TODDistanceInLeg"] = "L:WTAP_VNav_TOD_Distance_In_Leg";
    /** The index of the leg for the next BOD. */
    VNavVars["BODLegIndex"] = "L:WTAP_VNav_BOD_Leg_Index";
    /** The index of the leg for the next constraint. */
    VNavVars["CurrentConstraintLegIndex"] = "L:WTAP_VNav_Constraint_Leg_Index";
    /** The current constraint altitude. */
    VNavVars["CurrentConstraintAltitude"] = "L:WTAP_VNav_Constraint_Altitude";
    /** The next constraint altitude. */
    VNavVars["NextConstraintAltitude"] = "L:WTAP_VNav_Next_Constraint_Altitude";
    /** The distance to the next BOD, or -1 if one does not exist. */
    VNavVars["BODDistance"] = "L:WTAP_VNav_Distance_To_BOD";
    /** The current required flight path angle. */
    VNavVars["FPA"] = "L:WTAP_VNav_FPA";
    /** The required VS to the current constraint. */
    VNavVars["RequiredVS"] = "L:WTAP_VNAV_Required_VS";
    /** The VNAV approach guidance mode. */
    VNavVars["GPApproachMode"] = "L:WTAP_GP_Approach_Mode";
    /** The current LPV vertical deviation. */
    VNavVars["GPVerticalDeviation"] = "L:WTAP_GP_Vertical_Deviation";
    /** The current remaining LPV distance. */
    VNavVars["GPDistance"] = "L:WTAP_GP_Distance";
    /** The current LPV FPA. */
    VNavVars["GPFpa"] = "L:WTAP_GP_FPA";
    /** The required VS to the current constraint. */
    VNavVars["GPRequiredVS"] = "L:WTAP_GP_Required_VS";
})(VNavVars || (VNavVars = {}));
/** A publisher for VNAV sim var events. */
export class VNavSimVarPublisher extends SimVarPublisher {
    /**
     * Create a VNavSimVarPublisher
     * @param bus The EventBus to publish to
     */
    constructor(bus) {
        super(VNavSimVarPublisher.simvars, bus);
    }
    /**
     * Publish a control event.
     * @param event The event from ControlEvents.
     * @param value The value of the event.
     */
    publishEvent(event, value) {
        this.publish(event, value, true);
    }
}
VNavSimVarPublisher.simvars = new Map([
    ['vnav_vertical_deviation', { name: VNavVars.VerticalDeviation, type: SimVarValueType.Feet }],
    ['vnav_target_altitude', { name: VNavVars.TargetAltitude, type: SimVarValueType.Feet }],
    ['vnav_path_mode', { name: VNavVars.PathMode, type: SimVarValueType.Number }],
    ['vnav_path_available', { name: VNavVars.PathAvailable, type: SimVarValueType.Bool }],
    ['vnav_state', { name: VNavVars.VNAVState, type: SimVarValueType.Number }],
    ['vnav_altitude_capture_type', { name: VNavVars.CaptureType, type: SimVarValueType.Number }],
    ['vnav_tod_distance', { name: VNavVars.TODDistance, type: SimVarValueType.Meters }],
    ['vnav_tod_leg_distance', { name: VNavVars.TODDistanceInLeg, type: SimVarValueType.Meters }],
    ['vnav_bod_distance', { name: VNavVars.BODDistance, type: SimVarValueType.Meters }],
    ['vnav_tod_global_leg_index', { name: VNavVars.TODLegIndex, type: SimVarValueType.Number }],
    ['vnav_bod_global_leg_index', { name: VNavVars.BODLegIndex, type: SimVarValueType.Number }],
    ['vnav_constraint_global_leg_index', { name: VNavVars.CurrentConstraintLegIndex, type: SimVarValueType.Number }],
    ['vnav_constraint_altitude', { name: VNavVars.CurrentConstraintAltitude, type: SimVarValueType.Feet }],
    ['vnav_next_constraint_altitude', { name: VNavVars.NextConstraintAltitude, type: SimVarValueType.Feet }],
    ['vnav_fpa', { name: VNavVars.FPA, type: SimVarValueType.Degree }],
    ['vnav_required_vs', { name: VNavVars.RequiredVS, type: SimVarValueType.FPM }],
    ['gp_approach_mode', { name: VNavVars.GPApproachMode, type: SimVarValueType.Number }],
    ['gp_vertical_deviation', { name: VNavVars.GPVerticalDeviation, type: SimVarValueType.Feet }],
    ['gp_distance', { name: VNavVars.GPDistance, type: SimVarValueType.Meters }],
    ['gp_fpa', { name: VNavVars.GPFpa, type: SimVarValueType.Degree }],
    ['gp_required_vs', { name: VNavVars.GPRequiredVS, type: SimVarValueType.FPM }]
]);
