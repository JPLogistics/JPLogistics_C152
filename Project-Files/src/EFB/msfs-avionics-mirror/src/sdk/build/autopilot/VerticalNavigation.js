/**
 * The current vertical navigation state.
 */
export var VNavState;
(function (VNavState) {
    /** VNAV Disabled. */
    VNavState[VNavState["Disabled"] = 0] = "Disabled";
    /** VNAV Enabled and Inactive. */
    VNavState[VNavState["Enabled_Inactive"] = 1] = "Enabled_Inactive";
    /** VNAV Enabled and Active. */
    VNavState[VNavState["Enabled_Active"] = 2] = "Enabled_Active";
})(VNavState || (VNavState = {}));
/**
 * The current VNAV path mode.
 */
export var VNavPathMode;
(function (VNavPathMode) {
    /** VNAV path is not active. */
    VNavPathMode[VNavPathMode["None"] = 0] = "None";
    /** VNAV path is armed for capture. */
    VNavPathMode[VNavPathMode["PathArmed"] = 1] = "PathArmed";
    /** VNAV path is actively navigating. */
    VNavPathMode[VNavPathMode["PathActive"] = 2] = "PathActive";
    /** The current VNAV path is not valid. */
    VNavPathMode[VNavPathMode["PathInvalid"] = 3] = "PathInvalid";
})(VNavPathMode || (VNavPathMode = {}));
/**
 * The current Approach Guidance Mode.
 */
export var ApproachGuidanceMode;
(function (ApproachGuidanceMode) {
    /** VNAV is not currently following approach guidance. */
    ApproachGuidanceMode[ApproachGuidanceMode["None"] = 0] = "None";
    /** VNAV has armed ILS glideslope guidance for capture. */
    ApproachGuidanceMode[ApproachGuidanceMode["GSArmed"] = 1] = "GSArmed";
    /** VNAV is actively following ILS glideslope guidance. */
    ApproachGuidanceMode[ApproachGuidanceMode["GSActive"] = 2] = "GSActive";
    /** VNAV RNAV glidepath guidance is armed for capture. */
    ApproachGuidanceMode[ApproachGuidanceMode["GPArmed"] = 3] = "GPArmed";
    /** VNAV is actively follow RNAV glidepath guidance. */
    ApproachGuidanceMode[ApproachGuidanceMode["GPActive"] = 4] = "GPActive";
})(ApproachGuidanceMode || (ApproachGuidanceMode = {}));
/**
 * The current VNAV altitude capture type.
 */
export var VNavAltCaptureType;
(function (VNavAltCaptureType) {
    /** Altitude capture is not armed. */
    VNavAltCaptureType[VNavAltCaptureType["None"] = 0] = "None";
    /** Altitude will capture the selected altitude. */
    VNavAltCaptureType[VNavAltCaptureType["Selected"] = 1] = "Selected";
    /** Altitude will capture the VANV target altitude. */
    VNavAltCaptureType[VNavAltCaptureType["VNAV"] = 2] = "VNAV";
})(VNavAltCaptureType || (VNavAltCaptureType = {}));
/**
 * The current Vertical Flight Phase.
 */
export var VerticalFlightPhase;
(function (VerticalFlightPhase) {
    /** The current vertical phase is Climb. */
    VerticalFlightPhase[VerticalFlightPhase["Climb"] = 0] = "Climb";
    /** The current vertical phase is Descent. */
    VerticalFlightPhase[VerticalFlightPhase["Descent"] = 1] = "Descent";
})(VerticalFlightPhase || (VerticalFlightPhase = {}));
/**
 * The current state of VNAV availability from the director.
 */
export var VNavAvailability;
(function (VNavAvailability) {
    VNavAvailability["Available"] = "Available";
    VNavAvailability["InvalidLegs"] = "InvalidLegs";
})(VNavAvailability || (VNavAvailability = {}));
