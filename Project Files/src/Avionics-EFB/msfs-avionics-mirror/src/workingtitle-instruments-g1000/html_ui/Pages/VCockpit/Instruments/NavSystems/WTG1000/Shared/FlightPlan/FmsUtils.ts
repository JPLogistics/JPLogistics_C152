
import { BitFlags, GeoCircle, GeoPoint, MagVar, UnitType } from 'msfssdk';
import { AdditionalApproachType, AirportFacility, AltitudeRestrictionType, ApproachProcedure, ArrivalProcedure, DepartureProcedure, FacilityFrequency, FixTypeFlags, FlightPlanLeg, ICAO, LegType, OneWayRunway, RnavTypeFlags, RunwayUtils } from 'msfssdk/navigation';
import { FlightPlan, FlightPlanSegmentType, LegDefinition, LegDefinitionFlags } from 'msfssdk/flightplan';


/**
 * Utility Methods for the FMS.
 */
export class FmsUtils {
  private static readonly vec3Cache = [new Float64Array(3)];
  private static readonly geoPointCache = [new GeoPoint(0, 0)];
  private static readonly geoCircleCache = [new GeoCircle(new Float64Array(3), 0)];
  public static readonly DTO_LEG_OFFSET = 3;

  /**
   * Utility method to return a one-way runway leg
   * @param airport The runway's parent airport.
   * @param oneWayRunway is the one wway runway object
   * @param isOriginRunway is a bool whether this is the origin or destination (origin = true, dest = false)
   * @returns a leg object for the runway
   */
  public static buildRunwayLeg(airport: AirportFacility, oneWayRunway: OneWayRunway, isOriginRunway: boolean): FlightPlanLeg {
    const leg = FlightPlan.createLeg({
      lat: oneWayRunway.latitude,
      lon: oneWayRunway.longitude,
      type: isOriginRunway ? LegType.IF : LegType.TF,
      fixIcao: RunwayUtils.getRunwayFacilityIcao(airport, oneWayRunway),
      altitude1: oneWayRunway.elevation
    });
    return leg;
  }

  /**
   * Utility method to return a one-way runway leg from an approach runway leg definition
   * @param airport is the facility associated with the arrival
   * @param runwayIcao is the icao string for the runway waypoint in the final legs
   * @returns a leg object for the runway
   */
  public static buildRunwayLegForApproach(airport: AirportFacility, runwayIcao: string): FlightPlanLeg | undefined {
    for (let i = 0; i < airport.runways.length; i++) {
      const match = RunwayUtils.getOneWayRunways(airport.runways[i], i).find((r) => {
        return (r.designation == ICAO.getIdent(runwayIcao));
      });
      if (match) {
        const leg = FlightPlan.createLeg({
          lat: match.latitude,
          lon: match.longitude,
          type: LegType.TF,
          fixIcao: runwayIcao
        });
        return leg;
      }
    }
    return undefined;
  }

  /**
   * Utility method to return a visual approach for a runway.
   * @param airport is the airport facility for the visual approach.
   * @param runway is the runway to build the visual approach for.
   * @param finalLegDistance is the distance from the runway to place the faf leg in NM.
   * @param initialLegDistance is the distance from the final leg to place the iaf leg in NM.
   * @param name is the optional name for the approach.
   * @param finalLegIdent is the optional name for the faf leg.
   * @param initialLegIdent is the optional name for the iaf leg.
   * @returns an approach procedure.
   */
  public static buildVisualApproach(
    airport: AirportFacility,
    runway: OneWayRunway,
    finalLegDistance: number,
    initialLegDistance: number,
    name?: string,
    finalLegIdent?: string,
    initialLegIdent?: string
  ): ApproachProcedure {
    const runwayVec = GeoPoint.sphericalToCartesian(runway.latitude, runway.longitude, FmsUtils.vec3Cache[0]);
    const approachPath = FmsUtils.geoCircleCache[0].setAsGreatCircle(runwayVec, runway.course);

    const iafLatLon = approachPath.offsetDistanceAlong(
      runwayVec,
      UnitType.NMILE.convertTo(-(initialLegDistance + finalLegDistance), UnitType.GA_RADIAN),
      FmsUtils.geoPointCache[0]
    );

    const runwayCode = RunwayUtils.getRunwayCode(runway.direction);
    const runwayLetter = RunwayUtils.getDesignatorLetter(runway.runwayDesignator).padStart(1, ' ');
    initialLegIdent ??= 'STRGHT';

    const iafLeg = FlightPlan.createLeg({
      type: LegType.IF,
      fixIcao: `S${ICAO.getIdent(airport.icao).padStart(4, ' ')}${runwayCode}${runwayLetter}${initialLegIdent}`,
      lat: iafLatLon.lat,
      lon: iafLatLon.lon,
    });

    const fafLatLon = approachPath.offsetDistanceAlong(
      runwayVec,
      UnitType.NMILE.convertTo(-finalLegDistance, UnitType.GA_RADIAN),
      FmsUtils.geoPointCache[0]
    );
    finalLegIdent ??= ' FINAL';

    const fafLeg = FlightPlan.createLeg({
      type: LegType.CF,
      fixIcao: `S${ICAO.getIdent(airport.icao).padStart(4, ' ')}${runwayCode}${runwayLetter}${finalLegIdent}`,
      course: MagVar.trueToMagnetic(approachPath.bearingAt(fafLatLon), fafLatLon),
      fixTypeFlags: FixTypeFlags.FAF,
      lat: fafLatLon.lat,
      lon: fafLatLon.lon,
      altDesc: AltitudeRestrictionType.AtOrAbove,
      altitude1: runway.elevation + 110,
    });

    const runwayLeg = FmsUtils.buildRunwayLeg(airport, runway, false);
    runwayLeg.fixTypeFlags = FixTypeFlags.MAP;

    const finalLegs: FlightPlanLeg[] = [];
    finalLegs.push(iafLeg);
    finalLegs.push(fafLeg);
    finalLegs.push(runwayLeg);

    const missedLegLatLon = approachPath.offsetDistanceAlong(
      runwayVec,
      UnitType.NMILE.convertTo(5, UnitType.GA_RADIAN),
      FmsUtils.geoPointCache[0]
    );

    const missedLeg = FlightPlan.createLeg({
      type: LegType.TF,
      fixIcao: `S${ICAO.getIdent(airport.icao).padStart(4, ' ')}${runwayCode}${runwayLetter}MANSEQ`,
      lat: missedLegLatLon.lat,
      lon: missedLegLatLon.lon,
    });

    const missedLegs: FlightPlanLeg[] = [];
    missedLegs.push(missedLeg);

    const proc: ApproachProcedure = {
      name: name ?? `Visual RW${runway.designation}`,
      runway: runway.designation,
      icaos: [],
      transitions: [{ name: 'STRAIGHT', legs: [] }],
      finalLegs: finalLegs,
      missedLegs: missedLegs,
      approachType: AdditionalApproachType.APPROACH_TYPE_VISUAL,
      approachSuffix: '',
      runwayDesignator: runway.runwayDesignator,
      runwayNumber: runway.direction,
      rnavTypeFlags: RnavTypeFlags.None
    };
    return proc;
  }

  /**
   * Utility method to return a single RnavTypeFlag from multiple possible flags.
   * @param rnavTypeFlags The input RnavTypeFlags.
   * @returns A single RnavTypeFlag
   */
  public static getBestRnavType(rnavTypeFlags: RnavTypeFlags): RnavTypeFlags {
    if (rnavTypeFlags & RnavTypeFlags.LPV) {
      return RnavTypeFlags.LPV;
    }
    if (rnavTypeFlags & RnavTypeFlags.LNAVVNAV) {
      return RnavTypeFlags.LNAVVNAV;
    }
    if (rnavTypeFlags & RnavTypeFlags.LP) {
      return RnavTypeFlags.LP;
    }
    if (rnavTypeFlags & RnavTypeFlags.LNAV) {
      return RnavTypeFlags.LNAV;
    }
    return RnavTypeFlags.None;
  }

  /**
   * Utility method to check whether an approach is authorized for GPS guidance.
   * @param approach The approach procedure
   * @returns True if GPS guidance is authorized, false otherwise.
   */
  public static isGpsApproach(approach: ApproachProcedure): boolean {
    switch (approach.approachType) {
      case ApproachType.APPROACH_TYPE_GPS:
      case ApproachType.APPROACH_TYPE_RNAV:
        return true;
    }
    return false;
  }

  /**
   * Utility method to check for an approach with a a tunable localizer.
   * @param approach The approach procedure
   * @returns True if a localizer needs to be tuned, otherwise false.
   */
  public static isLocalizerApproach(approach: ApproachProcedure): boolean {
    switch (approach.approachType) {
      case ApproachType.APPROACH_TYPE_ILS:
      case ApproachType.APPROACH_TYPE_LDA:
      case ApproachType.APPROACH_TYPE_LOCALIZER:
      case ApproachType.APPROACH_TYPE_LOCALIZER_BACK_COURSE:
      case ApproachType.APPROACH_TYPE_SDF:
        return true;
    }
    return false;
  }

  /**
   * Gets an approach procedure from a flight plan.
   * @param plan A flight plan.
   * @param destination The detsination airport of the flight plan.
   * @returns The approach procedure from the flight plan, or undefined if the plan has no approach.
   */
  public static getApproachFromPlan(plan: FlightPlan, destination: AirportFacility): ApproachProcedure | undefined {
    let approach = destination.approaches[plan.procedureDetails.approachIndex];

    if (!approach) {
      const visualRwyDesignation = plan.getUserData<string>('visual_approach');
      if (visualRwyDesignation && plan.destinationAirport) {
        const runway = RunwayUtils.matchOneWayRunwayFromDesignation(destination, visualRwyDesignation);
        if (runway) {
          approach = {
            name: `VISUAL ${visualRwyDesignation}`,
            runway: runway.designation,
            icaos: [],
            transitions: [],
            finalLegs: [],
            missedLegs: [],
            approachType: AdditionalApproachType.APPROACH_TYPE_VISUAL,
            approachSuffix: '',
            runwayDesignator: runway.runwayDesignator,
            runwayNumber: runway.direction,
            rnavTypeFlags: RnavTypeFlags.None
          };
        }
      }
    }

    return approach;
  }

  /**
   * Checks whether a flight plan has an approach loaded.
   * @param plan A flight plan.
   * @returns Whether the flight plan has an approach loaded.
   */
  public static isApproachLoaded(plan: FlightPlan): boolean {
    return plan.procedureDetails.approachIndex >= 0 || (plan.getUserData('visual_approach') !== undefined && plan.destinationAirport !== undefined);
  }

  /**
   * Checks whether a plan has a vectors-to-final approach loaded.
   * @param plan A flight plan.
   * @returns Whether the flight plan has a vectors-to-final approach loaded.
   */
  public static isVtfApproachLoaded(plan: FlightPlan): boolean {
    return !!FmsUtils.getApproachVtfLeg(plan);
  }

  /**
   * Gets the vectors-to-final leg of a flight plan.
   * @param plan A flight plan.
   * @returns The vectors-to-final leg of the flight plan, or undefined if one could not be found.
   */
  public static getApproachVtfLeg(plan: FlightPlan): LegDefinition | undefined {
    if (!FmsUtils.isApproachLoaded(plan) || plan.procedureDetails.approachTransitionIndex >= 0) {
      return undefined;
    }

    // There should only be one approach segment
    for (const approachSegment of plan.segmentsOfType(FlightPlanSegmentType.Approach)) {
      return approachSegment.legs.find(leg => BitFlags.isAll(leg.flags, LegDefinitionFlags.VectorsToFinal) && BitFlags.isAll(leg.leg.fixTypeFlags, FixTypeFlags.FAF));
    }

    return undefined;
  }

  /**
   * Gets the name of a departure procedure as a string.
   * @param airport The airport to which the departure belongs.
   * @param departure A departure procedure definition.
   * @param transitionIndex The index of the departure enroute transition.
   * @param runway The runway of the departure, if any.
   * @returns The name of the departure procedure.
   */
  public static getDepartureNameAsString(airport: AirportFacility, departure: DepartureProcedure, transitionIndex: number, runway: OneWayRunway | undefined): string {
    let name = `${ICAO.getIdent(airport.icao)}–`;

    if (runway) {
      name += `RW${runway.designation}.`;
    }

    const transition = departure.enRouteTransitions[transitionIndex];
    if (transition !== undefined && transitionIndex > -1 && transition.legs.length > 0) {
      name += `${departure.name}.${ICAO.getIdent(transition.legs[transition.legs.length - 1].fixIcao)}`;
    } else if (departure.commonLegs.length > 0) {
      name += `${departure.name}.${ICAO.getIdent(departure.commonLegs[departure.commonLegs.length - 1].fixIcao)}`;
    } else {
      name += `${departure.name}`;
    }

    return name;
  }

  /**
   * Gets the name of a arrival procedure as a string.
   * @param airport The airport to which the departure belongs.
   * @param arrival An arrival procedure definition.
   * @param transitionIndex The index of the arrival enroute transition.
   * @param runway The runway of the arrival, if any.
   * @returns The name of the arrival procedure.
   */
  public static getArrivalNameAsString(airport: AirportFacility, arrival: ArrivalProcedure, transitionIndex: number, runway: OneWayRunway | undefined): string {
    let name = `${ICAO.getIdent(airport.icao)}–`;

    const transition = arrival.enRouteTransitions[transitionIndex];
    if (transition !== undefined && transitionIndex > -1 && transition.legs.length > 0) {
      name += `${ICAO.getIdent(transition.legs[0].fixIcao)}.${arrival?.name}`;
    } else if (arrival.commonLegs.length > 0) {
      name += `${ICAO.getIdent(arrival.commonLegs[0].fixIcao)}.${arrival?.name}`;
    } else {
      name += `${arrival?.name}`;
    }

    if (runway) {
      name += `.RW${runway.designation}`;
    }

    return name;
  }

  /**
   * Utility method to analyze an approach for its name components and
   * pack them into a custom type.
   * @param proc The approach procedure.
   * @returns The name as an ApproachNameParts
   */
  public static getApproachNameAsParts(proc: ApproachProcedure): ApproachNameParts {
    let type: string;
    let subtype: string | undefined;
    let rnavType: string | undefined;

    switch (proc.approachType) {
      case ApproachType.APPROACH_TYPE_GPS:
        type = 'GPS'; break;
      case ApproachType.APPROACH_TYPE_VOR:
        type = 'VOR'; break;
      case ApproachType.APPROACH_TYPE_NDB:
        type = 'NDB'; break;
      case ApproachType.APPROACH_TYPE_ILS:
        type = 'ILS'; break;
      case ApproachType.APPROACH_TYPE_LOCALIZER:
        type = 'LOC'; break;
      case ApproachType.APPROACH_TYPE_SDF:
        type = 'SDF'; break;
      case ApproachType.APPROACH_TYPE_LDA:
        type = 'LDA'; break;
      case ApproachType.APPROACH_TYPE_VORDME:
        type = 'VOR/DME'; break;
      case ApproachType.APPROACH_TYPE_NDBDME:
        type = 'NDB/DME'; break;
      case ApproachType.APPROACH_TYPE_RNAV:
        type = 'RNAV';
        subtype = 'GPS';
        break;
      case ApproachType.APPROACH_TYPE_LOCALIZER_BACK_COURSE:
        type = 'LOC BC'; break;
      case AdditionalApproachType.APPROACH_TYPE_VISUAL:
        type = 'VISUAL'; break;
      default:
        type = '???'; break;
    }

    const approachIsCircling = !proc.runway ? true : false;

    if (proc.approachType === ApproachType.APPROACH_TYPE_RNAV) {
      switch (FmsUtils.getBestRnavType(proc.rnavTypeFlags)) {
        case RnavTypeFlags.LNAV:
          rnavType = approachIsCircling ? 'LNAV' : 'LNAV+V'; break;
        case RnavTypeFlags.LP:
          rnavType = approachIsCircling ? 'LP' : 'LP+V'; break;
        case RnavTypeFlags.LNAVVNAV:
          rnavType = 'LNAV/VNAV'; break;
        case RnavTypeFlags.LPV:
          rnavType = 'LPV'; break;
      }
    }

    return {
      type: type,
      subtype: subtype,
      suffix: proc.approachSuffix ? proc.approachSuffix : undefined,
      runway: proc.runwayNumber === 0 ? undefined : RunwayUtils.getRunwayNameString(proc.runwayNumber, proc.runwayDesignator, true),
      flags: rnavType
    };
  }

  /**
   * Utility method that takes an approach and returns its name as a flat
   * string suitable for use in embedded text content.
   * @param approach The approach as an ApproaceProcedure
   * @returns The formatted name as a string.
   */
  public static getApproachNameAsString(approach: ApproachProcedure): string {
    const parts = FmsUtils.getApproachNameAsParts(approach);
    let name = parts.type;
    parts.subtype && (name += `${parts.subtype}`);
    parts.suffix && (name += `${parts.runway ? ' ' : '–'}${parts.suffix}`);
    parts.runway && (name += ` ${parts.runway}`);
    parts.flags && (name += ` ${parts.flags}`);
    return name;
  }

  /**
   * Gets an approach frequency from the facility record.
   * @param facility The airport facility.
   * @param approachIndex The approach Index.
   * @returns The FacilityFrequency or undefined
   */
  public static getApproachFrequency(facility?: AirportFacility, approachIndex?: number): FacilityFrequency | undefined {
    const approach = facility?.approaches[approachIndex ?? -1];
    if (approach && (approach.approachType === ApproachType.APPROACH_TYPE_ILS
      || approach.approachType === ApproachType.APPROACH_TYPE_LOCALIZER
      || approach.approachType === ApproachType.APPROACH_TYPE_LDA
      || approach.approachType === ApproachType.APPROACH_TYPE_SDF)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const freq = RunwayUtils.getLocFrequency(facility!, approach.runwayNumber, approach.runwayDesignator);
      return freq;
    } else {
      return undefined;
    }
  }

  /**
   * Gets the nominal leg from which a specified flight plan leg originates. The nominal from leg excludes any legs
   * which are part of a direct to or vectors-to-final sequence.
   * @param plan A flight plan.
   * @param segmentIndex The index of the segment containing the leg for which to get the from leg.
   * @param segmentLegIndex The index of the leg for which to get the from leg in its segment.
   * @returns The nominal leg from which the specified flight plan leg originates.
   */
  public static getNominalFromLeg(plan: FlightPlan, segmentIndex: number, segmentLegIndex: number): LegDefinition | undefined {
    let leg = plan.getPrevLeg(segmentIndex, segmentLegIndex);

    if (!leg) {
      return undefined;
    }

    for (leg of plan.legs(true, plan.getLegIndexFromLeg(leg))) {
      if (!BitFlags.isAny(leg.flags, LegDefinitionFlags.DirectTo | LegDefinitionFlags.VectorsToFinal)) {
        return leg;
      }
    }

    return undefined;
  }

  /**
   * Gets the global leg index of the nominal leg from which a specified flight plan leg originates. The nominal from
   * leg excludes any legs which are part of a direct to or vectors-to-final sequence.
   * @param plan A flight plan.
   * @param segmentIndex The index of the segment containing the leg for which to get the from leg.
   * @param segmentLegIndex The index of the leg for which to get the from leg in its segment.
   * @returns The nominal leg from which the specified flight plan leg originates.
   */
  public static getNominalFromLegIndex(plan: FlightPlan, segmentIndex: number, segmentLegIndex: number): number {
    let leg = plan.getPrevLeg(segmentIndex, segmentLegIndex);

    if (!leg) {
      return -1;
    }

    let index = plan.getLegIndexFromLeg(leg);
    for (leg of plan.legs(true, index)) {
      if (!BitFlags.isAny(leg.flags, LegDefinitionFlags.DirectTo | LegDefinitionFlags.VectorsToFinal)) {
        return index;
      }
      index--;
    }

    return -1;
  }
}

/** Transition List Items for the Select Procedure Page */
export interface TransitionListItem {
  /** Transition Name */
  name: string;
  /** Source Transition Index from Facility Approach */
  transitionIndex: number;
  /** The starting leg index from Facility Approach Transition for this offset transition */
  startIndex?: number;
}

/**
 * A type representing the three parts of an approach name.
 */
export type ApproachNameParts = {
  /** The approach type. */
  type: string;
  /** The approach subtype (eg, GPS) */
  subtype?: string;
  /** The approach suffix */
  suffix?: string;
  /** The runway identifier. */
  runway?: string;
  /** Additonal flags (eg, RNAV type) */
  flags?: string;
}