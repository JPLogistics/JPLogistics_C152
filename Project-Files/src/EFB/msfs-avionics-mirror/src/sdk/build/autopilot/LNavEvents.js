import { SimVarPublisher } from '../instruments';
import { SimVarValueType } from '../data';
/**
 * LNAV transition modes.
 */
export var LNavTransitionMode;
(function (LNavTransitionMode) {
    /** LNAV is attempting to track a non-transition vector. */
    LNavTransitionMode[LNavTransitionMode["None"] = 0] = "None";
    /** LNAV is attempting to track an ingress vector. */
    LNavTransitionMode[LNavTransitionMode["Ingress"] = 1] = "Ingress";
    /** LNAV is attempting to track an egress vector. */
    LNavTransitionMode[LNavTransitionMode["Egress"] = 2] = "Egress";
})(LNavTransitionMode || (LNavTransitionMode = {}));
/**
 * Sim var names for LNAV data.
 */
export var LNavVars;
(function (LNavVars) {
    /** The current desired track, in degrees true. */
    LNavVars["DTK"] = "L:WTAP_LNav_DTK";
    /**
     * The current crosstrack error. Negative values indicate deviation to the left, as viewed when facing in the
     * direction of the track. Positive values indicate deviation to the right.
     */
    LNavVars["XTK"] = "L:WTAP_LNav_XTK";
    /** Whether LNAV is tracking a path. */
    LNavVars["IsTracking"] = "L:WTAP_LNav_Is_Tracking";
    /** The global leg index of the flight plan leg LNAV is currently tracking. */
    LNavVars["TrackedLegIndex"] = "L:WTAP_LNav_Tracked_Leg_Index";
    /** The currently active LNAV transition mode. */
    // eslint-disable-next-line @typescript-eslint/no-shadow
    LNavVars["TransitionMode"] = "L:WTAP_LNav_Transition_Mode";
    /** The index of the vector LNAV is currently tracking. */
    LNavVars["TrackedVectorIndex"] = "L:WTAP_LNav_Tracked_Vector_Index";
    /** The current course LNAV is attempting to steer, in degrees true. */
    LNavVars["CourseToSteer"] = "L:WTAP_LNav_Course_To_Steer";
    /** Whether LNAV sequencing is suspended. */
    LNavVars["IsSuspended"] = "L:WTAP_LNav_Is_Suspended";
    /**
     * The along-track distance from the start of the currently tracked leg to the plane's present position. A negative
     * distance indicates the plane is before the start of the leg.
     */
    LNavVars["LegDistanceAlong"] = "L:WTAP_LNav_Leg_Distance_Along";
    /**
     * The along-track distance remaining in the currently tracked leg. A negative distance indicates the plane is past
     * the end of the leg.
     */
    LNavVars["LegDistanceRemaining"] = "L:WTAP_LNav_Leg_Distance_Remaining";
    /**
     * The along-track distance from the start of the currently tracked vector to the plane's present position. A
     * negative distance indicates the plane is before the start of the vector.
     */
    LNavVars["VectorDistanceAlong"] = "L:WTAP_LNav_Vector_Distance_Along";
    /**
     * The along-track distance remaining in the currently tracked vector. A negative distance indicates the plane is
     * past the end of the vector.
     */
    LNavVars["VectorDistanceRemaining"] = "L:WTAP_LNav_Vector_Distance_Remaining";
})(LNavVars || (LNavVars = {}));
/**
 * A publisher for LNAV sim var events.
 */
export class LNavSimVarPublisher extends SimVarPublisher {
    /**
     * Constructor.
     * @param bus The event bus to which to publish.
     */
    constructor(bus) {
        super(LNavSimVarPublisher.simvars, bus);
    }
}
LNavSimVarPublisher.simvars = new Map([
    ['lnav_dtk', { name: LNavVars.DTK, type: SimVarValueType.Degree }],
    ['lnav_xtk', { name: LNavVars.XTK, type: SimVarValueType.NM }],
    ['lnav_is_tracking', { name: LNavVars.IsTracking, type: SimVarValueType.Bool }],
    ['lnav_tracked_leg_index', { name: LNavVars.TrackedLegIndex, type: SimVarValueType.Number }],
    ['lnav_transition_mode', { name: LNavVars.TransitionMode, type: SimVarValueType.Number }],
    ['lnav_tracked_vector_index', { name: LNavVars.TrackedVectorIndex, type: SimVarValueType.Number }],
    ['lnav_course_to_steer', { name: LNavVars.CourseToSteer, type: SimVarValueType.Degree }],
    ['lnav_is_suspended', { name: LNavVars.IsSuspended, type: SimVarValueType.Bool }],
    ['lnav_leg_distance_along', { name: LNavVars.LegDistanceAlong, type: SimVarValueType.NM }],
    ['lnav_leg_distance_remaining', { name: LNavVars.LegDistanceRemaining, type: SimVarValueType.NM }],
    ['lnav_vector_distance_along', { name: LNavVars.VectorDistanceAlong, type: SimVarValueType.NM }],
    ['lnav_vector_distance_remaining', { name: LNavVars.VectorDistanceRemaining, type: SimVarValueType.NM }]
]);
