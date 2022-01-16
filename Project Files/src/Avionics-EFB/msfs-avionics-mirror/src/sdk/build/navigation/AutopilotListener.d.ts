/**
 * A viewlistener that gets autopilot mode information.
 */
export declare namespace APController {
    /**
     * Gets whether or not a given AP mode is active.
     * @param apMode The MSFS AP mode to check.
     * @returns 1 if the mode is active, 0 otherwise.
     */
    function apGetAutopilotModeActive(apMode: MSFSAPStates): number;
}
export declare enum MSFSAPStates {
    LogicOn = 1,
    APOn = 2,
    FDOn = 4,
    FLC = 8,
    Alt = 16,
    AltArm = 32,
    GS = 64,
    GSArm = 128,
    Pitch = 256,
    VS = 512,
    Heading = 1024,
    Nav = 2048,
    NavArm = 4096,
    WingLevel = 8192,
    Attitude = 16384,
    ThrottleSpd = 32768,
    ThrottleMach = 65536,
    ATArm = 131072,
    YD = 262144,
    EngineRPM = 524288,
    TOGAPower = 1048576,
    Autoland = 2097152,
    TOGAPitch = 4194304,
    Bank = 8388608,
    FBW = 16777216,
    AvionicsManaged = 33554432,
    None = -2147483648
}
//# sourceMappingURL=AutopilotListener.d.ts.map