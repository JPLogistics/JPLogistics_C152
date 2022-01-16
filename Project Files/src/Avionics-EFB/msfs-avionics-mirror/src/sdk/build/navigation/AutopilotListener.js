/**
 * A viewlistener that gets autopilot mode information.
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export var APController;
(function (APController) {
})(APController || (APController = {}));
export var MSFSAPStates;
(function (MSFSAPStates) {
    MSFSAPStates[MSFSAPStates["LogicOn"] = 1] = "LogicOn";
    MSFSAPStates[MSFSAPStates["APOn"] = 2] = "APOn";
    MSFSAPStates[MSFSAPStates["FDOn"] = 4] = "FDOn";
    MSFSAPStates[MSFSAPStates["FLC"] = 8] = "FLC";
    MSFSAPStates[MSFSAPStates["Alt"] = 16] = "Alt";
    MSFSAPStates[MSFSAPStates["AltArm"] = 32] = "AltArm";
    MSFSAPStates[MSFSAPStates["GS"] = 64] = "GS";
    MSFSAPStates[MSFSAPStates["GSArm"] = 128] = "GSArm";
    MSFSAPStates[MSFSAPStates["Pitch"] = 256] = "Pitch";
    MSFSAPStates[MSFSAPStates["VS"] = 512] = "VS";
    MSFSAPStates[MSFSAPStates["Heading"] = 1024] = "Heading";
    MSFSAPStates[MSFSAPStates["Nav"] = 2048] = "Nav";
    MSFSAPStates[MSFSAPStates["NavArm"] = 4096] = "NavArm";
    MSFSAPStates[MSFSAPStates["WingLevel"] = 8192] = "WingLevel";
    MSFSAPStates[MSFSAPStates["Attitude"] = 16384] = "Attitude";
    MSFSAPStates[MSFSAPStates["ThrottleSpd"] = 32768] = "ThrottleSpd";
    MSFSAPStates[MSFSAPStates["ThrottleMach"] = 65536] = "ThrottleMach";
    MSFSAPStates[MSFSAPStates["ATArm"] = 131072] = "ATArm";
    MSFSAPStates[MSFSAPStates["YD"] = 262144] = "YD";
    MSFSAPStates[MSFSAPStates["EngineRPM"] = 524288] = "EngineRPM";
    MSFSAPStates[MSFSAPStates["TOGAPower"] = 1048576] = "TOGAPower";
    MSFSAPStates[MSFSAPStates["Autoland"] = 2097152] = "Autoland";
    MSFSAPStates[MSFSAPStates["TOGAPitch"] = 4194304] = "TOGAPitch";
    MSFSAPStates[MSFSAPStates["Bank"] = 8388608] = "Bank";
    MSFSAPStates[MSFSAPStates["FBW"] = 16777216] = "FBW";
    MSFSAPStates[MSFSAPStates["AvionicsManaged"] = 33554432] = "AvionicsManaged";
    MSFSAPStates[MSFSAPStates["None"] = -2147483648] = "None";
})(MSFSAPStates || (MSFSAPStates = {}));
