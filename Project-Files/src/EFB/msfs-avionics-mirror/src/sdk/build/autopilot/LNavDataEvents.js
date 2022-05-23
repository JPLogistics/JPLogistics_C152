import { SimVarValueType } from '../data/SimVars';
import { SimVarPublisher } from '../instruments/BasePublishers';
/**
 * Sim var names for LNAV-related data.
 */
export var LNavDataVars;
(function (LNavDataVars) {
    /** The current nominal desired track, in degrees true. */
    LNavDataVars["DTKTrue"] = "L:WT_LNavData_DTK_True";
    /** The current nominal desired track, in degrees magnetic. */
    LNavDataVars["DTKMagnetic"] = "L:WT_LNavData_DTK_Mag";
    /**
     * The current nominal crosstrack error. Negative values indicate deviation to the left, as viewed when facing in the
     * direction of the track. Positive values indicate deviation to the right.
     */
    LNavDataVars["XTK"] = "L:WT_LNavData_XTK";
    /** The current CDI scale. */
    LNavDataVars["CDIScale"] = "L:WT_LNavData_CDI_Scale";
    /** The nominal bearing to the next waypoint currently tracked by LNAV, in degrees true. */
    LNavDataVars["WaypointBearingTrue"] = "L:WT_LNavData_Waypoint_Bearing_True";
    /** The nominal bearing to the next waypoint currently tracked by LNAV, in degrees magnetic. */
    LNavDataVars["WaypointBearingMagnetic"] = "L:WT_LNavData_Waypoint_Bearing_Mag";
    /** The nominal distance remaining to the next waypoint currently tracked by LNAV. */
    LNavDataVars["WaypointDistance"] = "L:WT_LNavData_Waypoint_Distance";
    /** The nominal distance remaining to the destination. */
    LNavDataVars["DestinationDistance"] = "L:WT_LNavData_Destination_Distance";
})(LNavDataVars || (LNavDataVars = {}));
/**
 * A publisher for LNAV-related data sim var events.
 */
export class LNavDataSimVarPublisher extends SimVarPublisher {
    /**
     * Constructor.
     * @param bus The event bus to which to publish.
     */
    constructor(bus) {
        super(LNavDataSimVarPublisher.simvars, bus);
    }
}
LNavDataSimVarPublisher.simvars = new Map([
    ['lnavdata_dtk_true', { name: LNavDataVars.DTKTrue, type: SimVarValueType.Degree }],
    ['lnavdata_dtk_mag', { name: LNavDataVars.DTKMagnetic, type: SimVarValueType.Degree }],
    ['lnavdata_xtk', { name: LNavDataVars.XTK, type: SimVarValueType.NM }],
    ['lnavdata_cdi_scale', { name: LNavDataVars.CDIScale, type: SimVarValueType.NM }],
    ['lnavdata_waypoint_bearing_true', { name: LNavDataVars.WaypointBearingTrue, type: SimVarValueType.Degree }],
    ['lnavdata_waypoint_bearing_mag', { name: LNavDataVars.WaypointBearingMagnetic, type: SimVarValueType.Degree }],
    ['lnavdata_waypoint_distance', { name: LNavDataVars.WaypointDistance, type: SimVarValueType.NM }],
    ['lnavdata_destination_distance', { name: LNavDataVars.DestinationDistance, type: SimVarValueType.NM }]
]);
