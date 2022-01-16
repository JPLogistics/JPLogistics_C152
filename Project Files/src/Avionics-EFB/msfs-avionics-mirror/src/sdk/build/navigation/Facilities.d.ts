/// <reference types="msfstypes/js/simplane" />
/// <reference types="msfstypes/js/types" />
/**
 * The available facility frequency types.
 */
export declare enum FacilityFrequencyType {
    None = 0,
    ATIS = 1,
    Multicom = 2,
    Unicom = 3,
    CTAF = 4,
    Ground = 5,
    Tower = 6,
    Clearance = 7,
    Approach = 8,
    Departure = 9,
    Center = 10,
    FSS = 11,
    AWOS = 12,
    ASOS = 13,
    /** Clearance Pre-Taxi*/
    CPT = 14,
    /** Remote Clearance Delivery */
    GCO = 15
}
/**
 * A radio frequency on facility data.
 */
export interface FacilityFrequency {
    /** The name of the frequency. */
    readonly name: string;
    /** The frequency, in MHz. */
    readonly freqMHz: number;
    /** The frequency, in BCD16. */
    readonly freqBCD16: number;
    /** The type of the frequency. */
    readonly type: FacilityFrequencyType;
}
/**
 * A runway on airport facility data.
 */
export interface AirportRunway {
    /** The latitude of the runway center. */
    readonly latitude: number;
    /** The longitude of the runway center. */
    readonly longitude: number;
    /** The runway elevation. */
    readonly elevation: number;
    /** The heading of the runway. */
    readonly direction: number;
    /** The runway designation. */
    readonly designation: string;
    /** The length of the runway. */
    readonly length: number;
    /** The width of the runwa. */
    readonly width: number;
    /** The runway surface type. */
    readonly surface: RunwaySurfaceType;
    /** The runway lighting type. */
    readonly lighting: RunwayLightingType;
    /** The primary runway designator character. */
    readonly designatorCharPrimary: RunwayDesignator;
    /** The secondary runway designator character. */
    readonly designatorCharSecondary: RunwayDesignator;
    /** The primary ILS frequency for the runway. */
    readonly primaryILSFrequency: FacilityFrequency;
    /** The secondary ILS frequency for the runway. */
    readonly secondaryILSFrequency: FacilityFrequency;
    /** The primary elevation for the runway in meters. */
    readonly primaryElevation: number;
    /** The primary displaced threshold distance from the start of the runway in meters. */
    readonly primaryThresholdLength: number;
    /** The primary elevation for the runway in meters. */
    readonly secondaryElevation: number;
    /** The primary displaced threshold distance from the start of the runway in meters. */
    readonly secondaryThresholdLength: number;
}
/**
 * A segment of an airway.
 */
export interface AirwaySegment {
    /** The name of the airway */
    readonly name: string;
    /** The type of the airway. */
    readonly type: number;
    /** The previous FS ICAO on the airway. */
    readonly prevIcao: string;
    /** The next FS ICAO on the airway. */
    readonly nextIcao: string;
}
/**
 * A navdata airway.
 */
export interface Airway {
    /** The name of the airway.*/
    readonly name: string;
    /** The type of the airway. */
    readonly type: number;
    /** The FS ICAOs that make up the airway. */
    readonly icaos: readonly string[];
}
/**
 * A leg in a flight plan or procedure.
 */
export interface FlightPlanLeg {
    /** The ARINC-424 leg type. */
    type: LegType;
    /** The ICAO of the fix, if specified. */
    fixIcao: string;
    /** Whether or not the fix is a flyover fix. */
    flyOver: boolean;
    /** Whether or not the distance is minutes of time. */
    distanceMinutes: boolean;
    /** Whether or not the course is true or magnetic. */
    trueDegrees: boolean;
    /** The direction of the turn for the leg, if any. */
    turnDirection: LegTurnDirection;
    /** A reference ICAO for legs that have relative information. */
    originIcao: string;
    /** A center fix ICAO for legs that require it. */
    arcCenterFixIcao: string;
    /** The theta of the leg. */
    theta: number;
    /** The rho of the leg. */
    rho: number;
    /** The course of the leg. */
    course: number;
    /** The distance for the leg, in meters. */
    distance: number;
    /** Any speed restriction for the leg, in knots IAS. */
    speedRestriction: number;
    /** The type of altitude restriction for the leg. */
    altDesc: AltitudeRestrictionType;
    /** The first altitude field for restrictions. */
    altitude1: number;
    /** The second altitude field for restrictions. */
    altitude2: number;
    /** An exact latitude for this leg termination. */
    lat?: number;
    /** An exact longitude for this leg termination. */
    lon?: number;
    /** Flags indicating the approach fix type. */
    fixTypeFlags: number;
}
/** Additional Approach Types (additive to those defined in simplane). */
export declare enum AdditionalApproachType {
    APPROACH_TYPE_VISUAL = 99
}
/** Approach Types inclusive of default ApproachType and AdditionalApproachType. */
export declare type ExtendedApproachType = ApproachType | AdditionalApproachType;
/**
 * Flags indicating the approach fix type.
 */
export declare enum FixTypeFlags {
    None = 0,
    IAF = 1,
    IF = 2,
    MAP = 4,
    FAF = 8,
    MAHP = 16
}
/**
 * Flags indicating the rnav approach type.
 */
export declare enum RnavTypeFlags {
    None = 0,
    LNAV = 1,
    LNAVVNAV = 2,
    LP = 4,
    LPV = 8
}
/**
 * An arrival transition for a particular selected runway.
 */
export interface RunwayTransition {
    /** The number of the runway. */
    readonly runwayNumber: number;
    /** The letter designation for the runway, if any (L, C, R) */
    readonly runwayDesignation: number;
    /** The legs that make up this procedure. */
    readonly legs: readonly Readonly<FlightPlanLeg>[];
}
/**
 * An enroute transition for an arrival.
 */
export interface EnrouteTransition {
    /** The name for this transition. */
    readonly name: string;
    /** The legs that make up this procedure. */
    readonly legs: readonly Readonly<FlightPlanLeg>[];
}
/**
 * An arrival-to-approach transition.
 */
export interface ApproachTransition {
    /** The name for this transition. */
    readonly name: string;
    /** The legs that make up this procedure. */
    readonly legs: readonly Readonly<FlightPlanLeg>[];
}
/**
 * An approach procedure.
 */
export interface ApproachProcedure {
    /** The name of the approach procedure. */
    readonly name: string;
    /** The approach runway designation. */
    readonly runway: string;
    /** The ICAOs associated with this procedure. */
    readonly icaos: readonly string[];
    /** Transitions from the arrival that are available on this procedure. */
    readonly transitions: readonly ApproachTransition[];
    /** The common legs of the procedure for all transitions. */
    readonly finalLegs: readonly Readonly<FlightPlanLeg>[];
    /** The legs of the procedure for the missed approach segment. */
    readonly missedLegs: readonly Readonly<FlightPlanLeg>[];
    /** The approach type. */
    readonly approachType: ExtendedApproachType;
    /** The approach name suffix. */
    readonly approachSuffix: string;
    /** The approach runway designator. */
    readonly runwayDesignator: RunwayDesignator;
    /** The approach runway number. */
    readonly runwayNumber: number;
    /** The approach RNAV Type Flag. */
    readonly rnavTypeFlags: RnavTypeFlags;
}
/** Common interface for procedures. */
export interface Procedure {
    /** The name of the departure. */
    readonly name: string;
    /** The legs of the procedure that are common to all selected transitions and runways. */
    readonly commonLegs: readonly Readonly<FlightPlanLeg>[];
    /** The transition from the departure to the enroute segment. */
    readonly enRouteTransitions: readonly EnrouteTransition[];
    /** The transition from the selected runway to the common procedure legs. */
    readonly runwayTransitions: readonly RunwayTransition[];
}
/**
 * A departure procedure (SID).
 */
export declare type DepartureProcedure = Procedure;
/**
 * An arrival procedure (STAR).
 */
export declare type ArrivalProcedure = Procedure;
/**
 * A navdata facility from the simulator.
 */
export interface Facility {
    /** The FS ICAO for this facility. */
    readonly icao: string;
    /** The name of the facility. */
    readonly name: string;
    /** The latitude of the facility. */
    readonly lat: number;
    /** The longitude of the facility. */
    readonly lon: number;
    /** The region code in which this facility appears. */
    readonly region: string;
    /** The city region boundary within which this facility appears.*/
    readonly city: string;
    /** The magnetic variation at a given facilty location. */
    readonly magvar: number;
}
/**
 * An airport facility from the simulator.
 */
export interface AirportFacility extends Facility {
    /** The privacy type of this airport. */
    readonly airportPrivateType: AirportPrivateType;
    /** The primary fuel available at this airport. */
    readonly fuel1: string;
    /** The secondary fuel available at this airport. */
    readonly fuel2: string;
    /** The name of the preferred airport approach. */
    readonly bestApproach: string;
    /** Whether or not the airport has radar coverage. */
    readonly radarCoverage: GpsBoolean;
    /** The type of airspace for the airport. */
    readonly airspaceType: number;
    /** The class of the airport. */
    readonly airportClass: number;
    /** Whether or not the airport is towered. */
    readonly towered: boolean;
    /** The frequencies available on the airport. */
    readonly frequencies: readonly FacilityFrequency[];
    /** The runways available on the airport. */
    readonly runways: AirportRunway[];
    /** The departure procedures on the airport. */
    readonly departures: readonly DepartureProcedure[];
    /** The approach procedures on the airport. */
    readonly approaches: readonly ApproachProcedure[];
    /** The arrival procedures on the airport. */
    readonly arrivals: readonly ArrivalProcedure[];
}
/**
 * The class of airport facility.
 */
export declare enum AirportClass {
    /** No other airport class could be identified. */
    None = 0,
    /** The airport has at least one hard surface runway. */
    HardSurface = 1,
    /** The airport has no hard surface runways. */
    SoftSurface = 2,
    /** The airport has only water surface runways. */
    AllWater = 3,
    /** The airport has no runways, but does contain helipads. */
    HeliportOnly = 4,
    /** The airport is a non-public use airport. */
    Private = 5
}
/**
 * The class of an airport facility, expressed as a mask for nearest airport search session filtering.
 */
export declare enum AirportClassMask {
    /** No other airport class could be identified. */
    None = 0,
    /** The airport has at least one hard surface runway. */
    HardSurface = 2,
    /** The airport has no hard surface runways. */
    SoftSurface = 4,
    /** The airport has only water surface runways. */
    AllWater = 8,
    /** The airport has no runways, but does contain helipads. */
    HeliportOnly = 16,
    /** The airport is a non-public use airport. */
    Private = 32
}
/**
 * An intersection facility.
 */
export interface IntersectionFacility extends Facility {
    /** The airway segments that are adjacent to this */
    readonly routes: readonly AirwaySegment[];
    /** The FS ICAO of the nearest VOR to this intersection. */
    readonly nearestVorICAO: string;
    /** The type of the nearest VOR. */
    readonly nearestVorType: VorType;
    /** The frequency of the nearest VOR, in BCD16. */
    readonly nearestVorFrequencyBCD16: number;
    /** The frequency of the nearest VOR, in MHz. */
    readonly nearestVorFrequencyMHz: number;
    /** The radial in degrees true from the nearest VOR that the intersection lies on. */
    readonly nearestVorTrueRadial: number;
    /** The radial in degrees magnetic from the nearest VOR that the intersection lies on. */
    readonly nearestVorMagneticRadial: number;
    /** This distance to the nearest VOR. */
    readonly nearestVorDistance: number;
}
/**
 * A VOR facility.
 */
export interface VorFacility extends Facility {
    /** The frequency of the VOR, in MHz. */
    readonly freqMHz: number;
    /** The frequency of the VOR, in BCD16. */
    readonly freqBCD16: number;
    /** The magnetic variation of the specific VOR. */
    readonly magneticVariation: number;
    /** The type of the VOR. */
    readonly type: VorType;
    /** The class of the VOR. */
    readonly vorClass: VorClass;
}
/**
 * A NDB facility.
 */
export interface NdbFacility extends Facility {
    /** The frequency of the facility, in MHz. */
    readonly freqMHz: number;
    /** The type of NDB. */
    readonly type: NdbType;
}
/**
 * A User Waypoint facility.
 */
export interface UserFacility extends Facility {
    /** If the user waypoint is temporary. */
    isTemporary: boolean;
    /** The type of user facility this is. */
    userFacilityType: UserFacilityType;
    /** The First Reference Facility. */
    referenceFacility1?: Facility;
    /** The First Reference Facility distance. */
    facility1Distance?: number;
    /** The First Reference Facility radial. */
    facility1Radial?: number;
    /** The Second Reference Facility. */
    referenceFacility2?: Facility;
    /** The Second Reference Facility radial. */
    facility2Radial?: number;
}
export declare enum UserFacilityType {
    RADIAL_RADIAL = 0,
    RADIAL_DISTANCE = 1,
    LAT_LONG = 2
}
/**
 * A runway waypoint facility.
 */
export interface RunwayFacility extends Facility {
    /** The runway associated with this facility. */
    readonly runway: OneWayRunway;
}
/**
 * A visual approach waypoint facility.
 */
export interface VisualFacility extends Facility {
    /** The name of the approach to which this facility belongs. */
    readonly approach: string;
}
/**
 * ARINC 424 Leg Types
 */
export declare enum LegType {
    /** An unknown leg type. */
    Unknown = 0,
    /** An arc-to-fix leg. This indicates a DME arc leg to a specified fix.*/
    AF = 1,
    /** A course-to-altitude leg. */
    CA = 2,
    /**
     * A course-to-DME-distance leg. This leg is flown on a wind corrected course
     * to a specific DME distance from another fix.
     */
    CD = 3,
    /** A course-to-fix leg.*/
    CF = 4,
    /** A course-to-intercept leg. */
    CI = 5,
    /** A course-to-radial intercept leg. */
    CR = 6,
    /** A direct-to-fix leg, from an unspecified starting position. */
    DF = 7,
    /**
     * A fix-to-altitude leg. A FA leg is flown on a track from a fix to a
     * specified altitude.
     */
    FA = 8,
    /**
     * A fix-to-distance leg. This leg is flown on a track from a fix to a
     * specific distance from the fix.
     */
    FC = 9,
    /**
     * A fix to DME distance leg. This leg is flown on a track from a fix to
     * a specific DME distance from another fix.
     */
    FD = 10,
    /** A course-to-manual-termination leg. */
    FM = 11,
    /** A hold-to-altitude leg. The hold is flown until a specified altitude is reached. */
    HA = 12,
    /**
     * A hold-to-fix leg. This indicates one time around the hold circuit and
     * then an exit.
     */
    HF = 13,
    /** A hold-to-manual-termination leg. */
    HM = 14,
    /** Initial procedure fix. */
    IF = 15,
    /** A procedure turn leg. */
    PI = 16,
    /** A radius-to-fix leg, with endpoint fixes, a center fix, and a radius. */
    RF = 17,
    /** A track-to-fix leg, from the previous fix to the terminator. */
    TF = 18,
    /** A heading-to-altitude leg. */
    VA = 19,
    /** A heading-to-DME-distance leg. */
    VD = 20,
    /** A heading-to-intercept leg. */
    VI = 21,
    /** A heading-to-manual-termination leg. */
    VM = 22,
    /** A heading-to-radial intercept leg. */
    VR = 23,
    /** A leg representing a discontinuity in the flight plan. */
    Discontinuity = 99
}
/**
 * Types of altitude restrictions on procedure legs.
 */
export declare enum AltitudeRestrictionType {
    Unused = 0,
    At = 1,
    AtOrAbove = 2,
    AtOrBelow = 3,
    Between = 4
}
export declare enum LegTurnDirection {
    None = 0,
    Left = 1,
    Right = 2,
    Either = 3
}
export declare enum AirwayType {
    None = 0,
    Victor = 1,
    Jet = 2,
    Both = 3
}
export declare enum NdbType {
    CompassPoint = 0,
    MH = 1,
    H = 2,
    HH = 3
}
export declare enum VorType {
    Unknown = 0,
    VOR = 1,
    VORDME = 2,
    DME = 3,
    TACAN = 4,
    VORTAC = 5,
    ILS = 6,
    VOT = 7
}
export declare enum RunwaySurfaceType {
    Concrete = 0,
    Grass = 1,
    WaterFSX = 2,
    GrassBumpy = 3,
    Asphalt = 4,
    ShortGrass = 5,
    LongGrass = 6,
    HardTurf = 7,
    Snow = 8,
    Ice = 9,
    Urban = 10,
    Forest = 11,
    Dirt = 12,
    Coral = 13,
    Gravel = 14,
    OilTreated = 15,
    SteelMats = 16,
    Bituminous = 17,
    Brick = 18,
    Macadam = 19,
    Planks = 20,
    Sand = 21,
    Shale = 22,
    Tarmac = 23,
    WrightFlyerTrack = 24,
    Ocean = 26,
    Water = 27,
    Pond = 28,
    Lake = 29,
    River = 30,
    WasteWater = 31,
    Paint = 32
}
export declare enum RunwayLightingType {
    Unknown = 0,
    None = 1,
    PartTime = 2,
    FullTime = 3,
    Frequency = 4
}
/**
 * Describes a selected one way runway.
 */
export interface OneWayRunway {
    /** The index of the parent runway in the airport facility */
    readonly parentRunwayIndex: number;
    /** The runway number of the selected runway (as the numerical value of the one way designation) */
    readonly direction: number;
    /** The runwayDesignator of the runway */
    readonly runwayDesignator: RunwayDesignator;
    /** The Designaton of the runway */
    readonly designation: string;
    /** Latitude of the Runway Selected */
    readonly latitude: number;
    /** Longitude of the Runway Selected */
    readonly longitude: number;
    /** Elevation of the Runway Selected in feet */
    readonly elevation: number;
    /** Course of the Runway Selected in degrees */
    readonly course: number;
    /** The ILS frequency for this runway. */
    readonly ilsFrequency?: FacilityFrequency;
}
export declare enum AirportPrivateType {
    Uknown = 0,
    Public = 1,
    Military = 2,
    Private = 3
}
export declare enum GpsBoolean {
    Unknown = 0,
    No = 1,
    Yes = 2
}
export declare enum VorClass {
    Unknown = 0,
    Terminal = 1,
    LowAlt = 2,
    HighAlt = 3,
    ILS = 4,
    VOT = 5
}
export declare enum FacilityType {
    Airport = "LOAD_AIRPORT",
    Intersection = "LOAD_INTERSECTION",
    VOR = "LOAD_VOR",
    NDB = "LOAD_NDB",
    USR = "USR",
    RWY = "RWY",
    VIS = "VIS"
}
/**
 * A type map of FacilityType enum to facility type.
 */
export declare type FacilityTypeMap = {
    /** Airport facility. */
    [FacilityType.Airport]: AirportFacility;
    /** VOR facility. */
    [FacilityType.VOR]: VorFacility;
    /** NDB facility. */
    [FacilityType.NDB]: NdbFacility;
    /** Intersection facility. */
    [FacilityType.Intersection]: IntersectionFacility;
    /** User waypoint facility. */
    [FacilityType.USR]: UserFacility;
    /** Runway waypoint facility. */
    [FacilityType.RWY]: RunwayFacility;
    /** Visual approach waypoint facility. */
    [FacilityType.VIS]: VisualFacility;
};
export declare enum FacilitySearchType {
    None = 0,
    Airport = 1,
    Intersection = 2,
    Vor = 3,
    Ndb = 4,
    Boundary = 5,
    User = 6
}
/**
 * Results from the completion of a nearest facilities search.
 */
export interface NearestSearchResults<TAdded, TRemoved> {
    /** The ID of the search session these results belong to. */
    readonly sessionId: number;
    /** The ID of the search that was performed. */
    readonly searchId: number;
    /** The list of items added since the previous search. */
    readonly added: readonly TAdded[];
    /** The list of items removed since the previous search. */
    readonly removed: readonly TRemoved[];
}
/**
 * A facility that describes an airspace boundary.
 */
export interface BoundaryFacility {
    /** The unique ID of the boundary. */
    readonly id: number;
    /** The name of the boundary. */
    readonly name: string;
    /** The airspace type of the boundary. */
    readonly type: BoundaryType;
    /** The minimum altitude for the boundary. */
    readonly minAlt: number;
    /** The maximum altitude for the boundary. */
    readonly maxAlt: number;
    /** The minimum altitude type. */
    readonly minAltType: BoundaryAltitudeType;
    /** The maximum altitude type. */
    readonly maxAltType: BoundaryAltitudeType;
    /** The top left corner of the bounding box for the boundary. */
    readonly topLeft: LatLong;
    /** The bottom right corner of the bounding box for the boundary. */
    readonly bottomRight: LatLong;
    /** The vectors that describe the boundary borders. */
    readonly vectors: BoundaryVector[];
}
/**
 * A type of airspace boundary.
 */
export declare enum BoundaryType {
    None = 0,
    Center = 1,
    ClassA = 2,
    ClassB = 3,
    ClassC = 4,
    ClassD = 5,
    ClassE = 6,
    ClassF = 7,
    ClassG = 8,
    Tower = 9,
    Clearance = 10,
    Ground = 11,
    Departure = 12,
    Approach = 13,
    MOA = 14,
    Restricted = 15,
    Prohibited = 16,
    Warning = 17,
    Alert = 18,
    Danger = 19,
    NationalPark = 20,
    ModeC = 21,
    Radar = 22,
    Training = 23
}
/**
 * A type of airspace boundary altitude maxima.
 */
export declare enum BoundaryAltitudeType {
    Unknown = 0,
    MSL = 1,
    AGL = 2,
    Unlimited = 3
}
/**
 * A vector in a boundary border geometry.
 */
export interface BoundaryVector {
    /** The type of the vector. */
    readonly type: BoundaryVectorType;
    /**
     * The origin ID of the vector. If the type is Origin, then this is the ID of the
     * vector. If the type is not Origin, then this is the ID of the origin vector
     * that relates to the current vector.
     */
    readonly originId: number;
    /** The latitude of the vector. */
    readonly lat: number;
    /** The longitude of the vector. */
    readonly lon: number;
    /** The radius of the vector, if any. */
    readonly radius: number;
}
/**
 * A type of boundary geometry vector.
 */
export declare enum BoundaryVectorType {
    None = 0,
    Start = 1,
    Line = 2,
    Origin = 3,
    ArcCW = 4,
    ArcCCW = 5,
    Circle = 6
}
/**
 * A METAR.
 */
export interface Metar {
    /** The ident of this METAR's airport. */
    readonly icao: string;
    /** The day of observation, in UTC time. */
    readonly day: number;
    /** The hour of observation, in UTC time. */
    readonly hour: number;
    /** The minute of observation, in UTC time. */
    readonly min: number;
    /** The wind direction, in degrees relative to true north. */
    readonly windDir: number;
    /** The wind speed, expressed in units defined by `windSpeedUnits`. */
    readonly windSpeed: number;
    /** The wind gust, expressed in units defined by `windSpeedUnits`. */
    readonly gust?: number;
    /** The units in which this METAR's wind speeds are reported. */
    readonly windSpeedUnits: MetarWindSpeedUnits;
    /** Whether winds are variable. */
    readonly vrb: boolean;
    /** Whether ceiling and visibility are OK. */
    readonly cavok: boolean;
    /** The visibility, expressed in units defined by `visUnits`. */
    readonly vis: number;
    /** The units in which this METAR's visibility is reported. */
    readonly visUnits: MetarVisibilityUnits;
    /** Whether the observed visibility is less than the reported visibility. */
    readonly visLt: boolean;
    /** Cloud layers. */
    readonly layers: readonly MetarCloudLayer[];
    /** The vertical visibility, in hundreds of feet. */
    readonly vertVis?: number;
    /** The temperature, in degrees Celsius. */
    readonly temp: number;
    /** The dew point, in degrees Celsius. */
    readonly dew: number;
    /** The altimeter setting, in inHg. */
    readonly altimeterA?: number;
    /** The altimeter setting, in hPa. */
    readonly altimeterQ?: number;
    /** The estimated sea-level pressure, in hPa. */
    readonly slp?: number;
    /** Significant weather phenomena. */
    readonly phenomena: readonly MetarPhenomenon[];
    /** Whether this METAR contains remarks. */
    readonly rmk: boolean;
    /** A formatted string representation of this METAR. */
    readonly metarString: string;
}
/**
 * Wind speed units used by METAR.
 */
export declare enum MetarWindSpeedUnits {
    Knot = 0,
    MeterPerSecond = 1,
    KilometerPerHour = 2
}
/** Visibility distance units used by METAR. */
export declare enum MetarVisibilityUnits {
    Meter = 0,
    StatuteMile = 1
}
/**
 * A METAR cloud layer description.
 */
export interface MetarCloudLayer {
    /** The altitude of this layer, in hundreds of feet. */
    readonly alt: number;
    /** The coverage of this layer. */
    readonly cover: MetarCloudLayerCoverage;
    /** The significant cloud type found in this layer. */
    readonly type: MetarCloudLayerType;
}
/**
 * METAR cloud layer coverage/sky condition.
 */
export declare enum MetarCloudLayerCoverage {
    SkyClear = 0,
    Clear = 1,
    NoSignificant = 2,
    Few = 3,
    Scattered = 4,
    Broken = 5,
    Overcast = 6
}
/**
 * METAR significant cloud types.
 */
export declare enum MetarCloudLayerType {
    Unspecified = -1,
    ToweringCumulus = 0,
    Cumulonimbus = 1,
    AltocumulusCastellanus = 2
}
/**
 * A METAR weather phenomenon.
 */
export interface MetarPhenomenon {
    /** The type of this phenomenon. */
    readonly phenom: MetarPhenomenonType;
    /**
     * The intensity of this phenomenon.
     */
    readonly intensity: MetarPhenomenonIntensity;
    /** Whether this phenomenon has the blowing modifier. */
    readonly blowing: boolean;
    /** Whether this phenomenon has the freezing modifier. */
    readonly freezing: boolean;
    /** Whether this phenomenon has the drifting modifier. */
    readonly drifting: boolean;
    /** Whether this phenomenon has the vicinity modifier. */
    readonly vicinity: boolean;
    /** Whether this phenomenon has the partial modifier. */
    readonly partial: boolean;
    /** Whether this phenomenon has the shallow modifier. */
    readonly shallow: boolean;
    /** Whether this phenomenon has the patches modifier. */
    readonly patches: boolean;
    /** Whether this phenomenon has the temporary modifier. */
    readonly tempo: boolean;
}
/** METAR phenomenon types. */
export declare enum MetarPhenomenonType {
    None = 0,
    Mist = 1,
    Duststorm = 2,
    Dust = 3,
    Drizzle = 4,
    FunnelCloud = 5,
    Fog = 6,
    Smoke = 7,
    Hail = 8,
    SmallHail = 9,
    Haze = 10,
    IceCrystals = 11,
    IcePellets = 12,
    DustSandWhorls = 13,
    Spray = 14,
    Rain = 15,
    Sand = 16,
    SnowGrains = 17,
    Shower = 18,
    Snow = 19,
    Squalls = 20,
    Sandstorm = 21,
    UnknownPrecip = 22,
    VolcanicAsh = 23
}
/** METAR phenomenon intensities. */
export declare enum MetarPhenomenonIntensity {
    Light = -1,
    Normal = 0,
    Heavy = 1
}
/**
 * Methods for working with FS ICAO strings.
 */
export declare class ICAO {
    /**
     * An empty ICAO.
     */
    static readonly emptyIcao = "            ";
    /**
     * Gets the facility type from an ICAO.
     * @param icao The icao to get the facility type for.
     * @returns The ICAO facility type.
     * @throws An error if the facility type cannot be determined.
     */
    static getFacilityType(icao: string): FacilityType;
    /**
     * Gets whether an icao is a facility type.
     * @param icao The icao to get the facility type for.
     * @returns a bool whether or not this icao is a facility type.
     */
    static isFacility(icao: string): boolean;
    /**
     * Gets the ident for a given ICAO string.
     * @param icao The FS ICAO to get the ident for.
     * @returns The ICAO ident.
     */
    static getIdent(icao: string): string;
}
/**
 * Utility functions for working with user facilities.
 */
export declare class UserFacilityUtils {
    /**
     * Creates a user facility from latitude/longitude coordinates.
     * @param icao The ICAO string of the new facility.
     * @param lat The latitude of the new facility.
     * @param lon The longitude of the new facility.
     * @param isTemporary Whether the new facility is temporary.
     * @param name The name of the new facility.
     * @returns A new user facility.
     */
    static createFromLatLon(icao: string, lat: number, lon: number, isTemporary?: boolean, name?: string): UserFacility;
}
//# sourceMappingURL=Facilities.d.ts.map