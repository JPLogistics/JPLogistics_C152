import { BitFlags, GeoCircle, GeoPoint, GeoPointInterface, MagVar, NavMath, ObjectSubject, UnitType } from 'msfssdk';
import { ConsumerSubject, EventBus, SimVarValueType } from 'msfssdk/data';
import { AirportFacility, FacilityType, FixTypeFlags, LegType, FacilityLoader, RnavTypeFlags, AdditionalApproachType } from 'msfssdk/navigation';
import {
  FlightPlanSegment, FlightPlanSegmentType, LegDefinition, FlightPlanner, FlightPlannerEvents,
  FlightPlanOriginDestEvent, OriginDestChangeType, FlightPathUtils, FlightPathVectorFlags, LegDefinitionFlags, ActiveLegType
} from 'msfssdk/flightplan';
import { LNavEvents, LNavTransitionMode, LNavDataVars } from 'msfssdk/autopilot';
import { LNavDirector } from 'msfssdk/autopilot/directors';
import { ClockEvents, GNSSEvents, NavEvents } from 'msfssdk/instruments';

import { ApproachDetails } from '../flightplan';
import { GarminControlEvents } from '../instruments';
import { CDIScaleLabel, GarminLNavDataVars } from './LNavDataEvents';

/**
 * Computes Garmin LNAV-related data.
 */
export class NavdataComputer {
  private readonly geoPointCache = [new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0)];
  private readonly geoCircleCache = [new GeoCircle(new Float64Array(3), 0)];

  private readonly planePos = new GeoPoint(0, 0);
  private readonly isObsActive: ConsumerSubject<boolean>;

  private obsAvailable = false;
  private approachDetails: ApproachDetails = {
    approachLoaded: false,
    approachType: ApproachType.APPROACH_TYPE_UNKNOWN,
    approachRnavType: RnavTypeFlags.None,
    approachIsActive: false,
    approachIsCircling: false
  };

  private readonly lnavIsTracking: ConsumerSubject<boolean>;
  private readonly lnavLegIndex: ConsumerSubject<number>;
  private readonly lnavVectorIndex: ConsumerSubject<number>;
  private readonly lnavTransitionMode: ConsumerSubject<LNavTransitionMode>;
  private readonly lnavIsSuspended: ConsumerSubject<boolean>;
  private readonly lnavDtk: ConsumerSubject<number>;
  private readonly lnavXtk: ConsumerSubject<number>;

  private readonly lnavData = ObjectSubject.create({
    dtkTrue: 0,
    dtkMag: 0,
    xtk: 0,
    nextDtkTrue: 0,
    nextDtkMag: 0,
    cdiScale: 0,
    cdiScaleLabel: CDIScaleLabel.Enroute,
    waypointBearingTrue: 0,
    waypointBearingMag: 0,
    waypointDistance: 0,
    destinationDistance: 0,
    egressDistance: 0
  });

  private readonly initialDtk = { true: 0, mag: 0 };

  private originFacility?: AirportFacility;

  private destinationFacility?: AirportFacility;

  /**
   * Creates a new instance of the NavdataComputer.
   * @param bus The event bus to use with this instance.
   * @param flightPlanner The flight planner to use with this instance.
   * @param facilityLoader The facility loader to use with this instance.
   */
  constructor(private bus: EventBus, private flightPlanner: FlightPlanner, private facilityLoader: FacilityLoader) {
    const sub = this.bus.getSubscriber<NavEvents & GNSSEvents & LNavEvents & FlightPlannerEvents & ClockEvents & GarminControlEvents>();

    this.isObsActive = ConsumerSubject.create(sub.on('gps_obs_active'), false);

    this.lnavIsTracking = ConsumerSubject.create(sub.on('lnav_is_tracking'), false);
    this.lnavLegIndex = ConsumerSubject.create(sub.on('lnav_tracked_leg_index'), 0);
    this.lnavVectorIndex = ConsumerSubject.create(sub.on('lnav_tracked_vector_index'), 0);
    this.lnavTransitionMode = ConsumerSubject.create(sub.on('lnav_transition_mode'), LNavTransitionMode.None);
    this.lnavIsSuspended = ConsumerSubject.create(sub.on('lnav_is_suspended'), false);
    this.lnavDtk = ConsumerSubject.create(sub.on('lnav_dtk'), 0);
    this.lnavXtk = ConsumerSubject.create(sub.on('lnav_xtk'), 0);

    sub.on('gps-position').handle(lla => { this.planePos.set(lla.lat, lla.long); });
    sub.on('fplOriginDestChanged').handle(this.flightPlanOriginDestChanged.bind(this));
    sub.on('fplActiveLegChange').handle(event => { event.type === ActiveLegType.Lateral && this.onActiveLegChanged(); });
    sub.on('fplIndexChanged').handle(this.onActiveLegChanged.bind(this));
    sub.on('fplSegmentChange').handle(this.onActiveLegChanged.bind(this));
    sub.on('approach_details_set').handle(d => { this.approachDetails = d; });
    sub.on('realTime').atFrequency(1).handle(() => {
      this.computeCDIScaling();
    });
    sub.on('realTime').handle(() => {
      this.computeTrackingVars(MagVar.get(this.planePos));
    });

    this.lnavData.sub((obj, key, value) => {
      switch (key) {
        case 'dtkTrue': SimVar.SetSimVarValue(LNavDataVars.DTKTrue, SimVarValueType.Degree, value); break;
        case 'dtkMag': SimVar.SetSimVarValue(LNavDataVars.DTKMagnetic, SimVarValueType.Degree, value); break;
        case 'xtk': SimVar.SetSimVarValue(LNavDataVars.XTK, SimVarValueType.NM, value); break;
        case 'nextDtkTrue': SimVar.SetSimVarValue(GarminLNavDataVars.NextDTKTrue, SimVarValueType.Degree, value); break;
        case 'nextDtkMag': SimVar.SetSimVarValue(GarminLNavDataVars.NextDTKMagnetic, SimVarValueType.Degree, value); break;
        case 'cdiScale': SimVar.SetSimVarValue(LNavDataVars.CDIScale, SimVarValueType.NM, value); break;
        case 'cdiScaleLabel': SimVar.SetSimVarValue(GarminLNavDataVars.CDIScaleLabel, SimVarValueType.Number, value); break;
        case 'waypointBearingTrue': SimVar.SetSimVarValue(LNavDataVars.WaypointBearingTrue, SimVarValueType.Degree, value); break;
        case 'waypointBearingMag': SimVar.SetSimVarValue(LNavDataVars.WaypointBearingMagnetic, SimVarValueType.Degree, value); break;
        case 'waypointDistance': SimVar.SetSimVarValue(LNavDataVars.WaypointDistance, SimVarValueType.NM, value); break;
        case 'destinationDistance': SimVar.SetSimVarValue(LNavDataVars.DestinationDistance, SimVarValueType.NM, value); break;
        case 'egressDistance': SimVar.SetSimVarValue(GarminLNavDataVars.EgressDistance, SimVarValueType.NM, value); break;
      }
    }, true);
  }

  /**
   * A callback fired when the active flight plan leg changes.
   */
  private onActiveLegChanged(): void {
    let activeLeg = null;
    if (this.flightPlanner.hasActiveFlightPlan()) {
      const plan = this.flightPlanner.getActiveFlightPlan();
      activeLeg = plan.tryGetLeg(plan.activeLateralLeg);
    }

    this.updateObsAvailable(activeLeg);
  }

  /**
   * A callback fired when the origin or destination changes in the flight plan.
   * @param e The event that was captured.
   */
  private flightPlanOriginDestChanged(e: FlightPlanOriginDestEvent): void {
    if (e.airport !== undefined) {
      this.facilityLoader.getFacility(FacilityType.Airport, e.airport).then(fac => {
        switch (e.type) {
          case OriginDestChangeType.OriginAdded:
            this.originFacility = fac;
            break;
          case OriginDestChangeType.DestinationAdded:
            this.destinationFacility = fac;
            break;
        }
      });
    }

    if (e.type === OriginDestChangeType.OriginRemoved) {
      this.originFacility = undefined;
    }

    if (e.type === OriginDestChangeType.DestinationRemoved) {
      this.destinationFacility = undefined;
    }
  }

  /**
   * Computes the nav tracking data, such as XTK, DTK, and distance to turn.
   * @param magVar The computed current location magvar.
   */
  private computeTrackingVars(magVar: number): void {
    let xtk = 0;
    let dtkTrue = 0;
    let dtkMag = 0;
    let nextDtkTrue = 0;
    let nextDtkMag = 0;
    let distance = 0;
    let waypointBearingTrue = 0;
    let waypointBearingMag = 0;
    let egressDistance = 0;
    let totalDistance = 0;

    if (this.lnavIsTracking.get()) {
      const plan = this.flightPlanner.hasActiveFlightPlan() && this.flightPlanner.getActiveFlightPlan();

      const trackedLegIndex = this.lnavLegIndex.get();
      const nextLegIndex = trackedLegIndex + 1;

      const currentLeg = plan && trackedLegIndex >= 0 && trackedLegIndex < plan.length ? plan.getLeg(trackedLegIndex) : undefined;
      const nextLeg = plan && nextLegIndex >= 0 && nextLegIndex < plan.length ? plan.getLeg(nextLegIndex) : undefined;

      if (currentLeg?.calculated) {
        distance = this.getActiveDistance(currentLeg, this.planePos);
        totalDistance = this.getTotalDistance(trackedLegIndex, distance);

        if (currentLeg.calculated.endLat !== undefined && currentLeg.calculated.endLon) {
          waypointBearingTrue = this.planePos.bearingTo(currentLeg.calculated.endLat, currentLeg.calculated.endLon);
          waypointBearingMag = MagVar.trueToMagnetic(waypointBearingTrue, magVar);
        }
      }

      if (nextLeg) {
        ({ true: nextDtkTrue, mag: nextDtkMag } = this.getInitialDtk(nextLeg, this.initialDtk));
      }

      if (this.isObsActive.get()) {
        xtk = this.lnavXtk.get();
        dtkTrue = this.lnavDtk.get();
        dtkMag = MagVar.trueToMagnetic(dtkTrue, magVar);
        egressDistance = Number.MAX_VALUE;
      } else {
        const transitionMode = this.lnavTransitionMode.get();

        let circle;
        if (transitionMode === LNavTransitionMode.Egress && nextLeg?.calculated?.flightPath.length) {
          circle = this.getNominalPathCircle(nextLeg, 0, LNavTransitionMode.Ingress, this.geoCircleCache[0]);

          egressDistance = this.getDistanceToTurn(nextLeg, this.planePos);
        } else if (currentLeg?.calculated?.flightPath.length) {
          circle = this.getNominalPathCircle(currentLeg, this.lnavVectorIndex.get(), transitionMode, this.geoCircleCache[0]);

          egressDistance = this.getDistanceToTurn(currentLeg, this.planePos);
        }

        if (circle !== undefined) {
          xtk = UnitType.GA_RADIAN.convertTo(circle.distance(this.planePos), UnitType.NMILE);
          dtkTrue = circle.bearingAt(this.planePos, Math.PI);
          dtkMag = MagVar.trueToMagnetic(dtkTrue, magVar);
        }
      }
    }

    this.lnavData.set('dtkTrue', dtkTrue);
    this.lnavData.set('dtkMag', dtkMag);
    this.lnavData.set('xtk', xtk);
    this.lnavData.set('nextDtkTrue', nextDtkTrue);
    this.lnavData.set('nextDtkMag', nextDtkMag);
    this.lnavData.set('waypointBearingTrue', waypointBearingTrue);
    this.lnavData.set('waypointBearingMag', waypointBearingMag);
    this.lnavData.set('waypointDistance', distance);
    this.lnavData.set('destinationDistance', totalDistance);
    this.lnavData.set('egressDistance', egressDistance);
  }

  /**
   * Computes the CDI scaling for the given LNAV data.
   */
  private computeCDIScaling(): void {
    let scale = 2.0;
    let scaleLabel = CDIScaleLabel.Enroute;
    const flightPlan = this.flightPlanner.hasActiveFlightPlan() ? this.flightPlanner.getActiveFlightPlan() : undefined;

    if (flightPlan && flightPlan.length > 0 && flightPlan.activeLateralLeg < flightPlan.length) {
      const activeSegment = flightPlan.getSegment(flightPlan.getSegmentIndex(flightPlan.activeLateralLeg));

      let previousLeg: LegDefinition | undefined;
      try {
        previousLeg = flightPlan.getLeg(flightPlan.activeLateralLeg - 1);
      } catch { /*Do nothing*/ }

      //We are currently in the departure segment
      if (activeSegment.segmentType === FlightPlanSegmentType.Departure) {
        scale = 0.3;
        scaleLabel = CDIScaleLabel.Departure;

        const prevLegType = previousLeg?.leg.type;
        if (prevLegType && prevLegType !== LegType.IF && prevLegType !== LegType.CA && prevLegType !== LegType.FA) {
          scale = 1.0;
          scaleLabel = CDIScaleLabel.Terminal;
        }
      }

      //We are not in the departure segment any longer
      if (this.originFacility !== undefined && activeSegment.segmentType !== FlightPlanSegmentType.Departure) {
        const distance = UnitType.GA_RADIAN.convertTo(this.planePos.distance(this.originFacility), UnitType.NMILE);
        scale = 2.0 - NavMath.clamp(31 - distance, 0, 1);

        if (distance <= 30) {
          scaleLabel = CDIScaleLabel.Terminal;
        }
      }

      //Check for distance to destination
      if (this.destinationFacility !== undefined && activeSegment.segmentType !== FlightPlanSegmentType.Departure) {
        const distance = UnitType.GA_RADIAN.convertTo(this.planePos.distance(this.destinationFacility), UnitType.NMILE);
        scale = 2.0 - NavMath.clamp(31 - distance, 0, 1);

        if (distance <= 30) {
          scaleLabel = CDIScaleLabel.Terminal;
        }
      }

      //Check for distance from arrival start
      if (activeSegment.segmentType === FlightPlanSegmentType.Arrival && activeSegment.legs.length > 1) {
        const firstArrivalLeg = activeSegment.legs[1];

        //If we're going from the start of the arrival (i.e. the second leg)
        if (
          flightPlan.activeLateralLeg === activeSegment.offset + 1
          && firstArrivalLeg.calculated?.startLat !== undefined
          && firstArrivalLeg.calculated?.startLon !== undefined
          && firstArrivalLeg.calculated?.endLat !== undefined
          && firstArrivalLeg.calculated?.endLon !== undefined
        ) {
          const start = this.geoPointCache[1].set(firstArrivalLeg.calculated.startLat, firstArrivalLeg.calculated.startLon);
          const end = this.geoPointCache[2].set(firstArrivalLeg.calculated.endLat, firstArrivalLeg.calculated.endLon);
          const distance = NavMath.alongTrack(start, end, this.planePos);
          scale = 2.0 - NavMath.clamp(distance, 0, 1);

          if (distance >= 1) {
            scaleLabel = CDIScaleLabel.Terminal;
          }
        } else if (flightPlan.activeLateralLeg > activeSegment.offset + 1) {
          scale = 1.0;
          scaleLabel = CDIScaleLabel.Terminal;
        }
      }

      //We are in the approach
      if (activeSegment.segmentType === FlightPlanSegmentType.Approach) {

        scale = 1.0;
        scaleLabel = CDIScaleLabel.Terminal;

        const fafIndex = this.getFafIndex(activeSegment);

        const currentLeg = flightPlan.activeLateralLeg >= 0 && flightPlan.activeLateralLeg < flightPlan.length ? flightPlan.getLeg(flightPlan.activeLateralLeg) : undefined;

        if (fafIndex !== undefined && flightPlan.activeLateralLeg === fafIndex) {
          const fafCalc = flightPlan.getLeg(fafIndex).calculated;

          if (fafCalc?.endLat !== undefined && fafCalc?.endLon !== undefined) {
            const distance = UnitType.GA_RADIAN.convertTo(this.planePos.distance(fafCalc.endLat, fafCalc.endLon), UnitType.NMILE);
            scale = 1.0 - (0.7 * (NavMath.clamp(2 - distance, 0, 2) / 2));

            if (distance <= 2) {
              scaleLabel = this.getApproachCdiScale();
            }
          }
        } else if (currentLeg?.calculated?.endLat && currentLeg?.calculated?.endLon && fafIndex !== undefined && flightPlan.activeLateralLeg > fafIndex) {

          if (currentLeg && BitFlags.isAll(currentLeg.flags, LegDefinitionFlags.MissedApproach)) {
            scale = 1.0;
            scaleLabel = CDIScaleLabel.MissedApproach;
          } else {
            const legLength = currentLeg.calculated.distance;
            const distance = UnitType.GA_RADIAN.convertTo(this.planePos.distance(currentLeg.calculated.endLat, currentLeg.calculated.endLon), UnitType.NMILE);

            scale = 0.3 - (0.112 * (NavMath.clamp(legLength - distance, 0, legLength) / legLength));
            scaleLabel = this.getApproachCdiScale();
          }
        }
      }
    }

    this.lnavData.set('cdiScale', scale);
    this.lnavData.set('cdiScaleLabel', scaleLabel);
  }

  /**
   * Gets the index of the FAF in a segment.
   * @param segment The segment to search.
   * @returns The index of the FAF if found.
   */
  private getFafIndex(segment: FlightPlanSegment): number | undefined {
    let fafLeg = segment.legs[segment.legs.length - 2];
    let fafIndex = segment.legs.length - 2;

    for (let i = 0; i < segment.legs.length; i++) {
      const leg = segment.legs[i];
      if (leg.leg.fixTypeFlags & FixTypeFlags.FAF) {
        fafLeg = leg;
        fafIndex = i;
        break;
      }
    }

    if (fafLeg !== undefined) {
      return segment.offset + fafIndex;
    }
  }

  /**
   * Gets the initial desired track of a flight plan leg in degrees true and magnetic.
   * @param leg A flight plan leg.
   * @param out The object to which to write the result.
   * @param out.true The desired track, in degrees true.
   * @param out.mag The desired track, in degrees magnetic.
   * @returns The initial desired track of a flight plan leg in degrees true and magnetic.
   */
  // eslint-disable-next-line jsdoc/require-jsdoc
  private getInitialDtk(leg: LegDefinition, out: { true: number, mag: number }): { true: number, mag: number } {
    out.true = 0;
    out.mag = 0;

    if (leg.calculated) {
      switch (leg.leg.type) {
        case LegType.DF: {
          const vector = leg.calculated.flightPath[leg.calculated.flightPath.length - 1];
          if (vector) {
            const circle = FlightPathUtils.setGeoCircleFromVector(vector, this.geoCircleCache[0]);
            const point = circle.isGreatCircle()
              ? this.geoPointCache[0].set(vector.startLat, vector.startLon)
              : this.geoPointCache[0].set(vector.endLat, vector.endLon);

            out.true = circle.bearingAt(point, Math.PI);
            out.mag = MagVar.trueToMagnetic(out.true, point);
          }

          break;
        }
        default:
          if (leg.calculated.initialDtk) {
            out.mag = leg.calculated.initialDtk;
            out.true = leg.calculated.startLat !== undefined && leg.calculated.startLon !== undefined
              ? MagVar.magneticToTrue(out.mag, leg.calculated.startLat, leg.calculated.startLon)
              : out.mag;
          }
      }
    }

    return out;
  }

  /**
   * Gets the geo circle describing the nominal path tracked by LNAV.
   * @param leg The flight plan leg currently tracked by LNAV.
   * @param vectorIndex The index of the vector currently tracked by LNAV.
   * @param transitionMode The current LNAV transition mode.
   * @param out The geo circle to which to write the result.
   * @returns The geo circle describing the initial path of a flight plan leg, or undefined if one could not be
   * determined.
   */
  private getNominalPathCircle(leg: LegDefinition, vectorIndex: number, transitionMode: LNavTransitionMode, out: GeoCircle): GeoCircle | undefined {
    if (!leg.calculated) {
      return undefined;
    }

    const legCalc = leg.calculated;

    switch (leg.leg.type) {
      case LegType.DF: {
        const vector = legCalc.flightPath[legCalc.flightPath.length - 1];

        if (!vector) {
          return undefined;
        }

        if (FlightPathUtils.isVectorGreatCircle(vector)) {
          return FlightPathUtils.setGeoCircleFromVector(vector, out);
        } else {
          const turn = FlightPathUtils.setGeoCircleFromVector(vector, out);
          const turnEnd = this.geoPointCache[0].set(vector.endLat, vector.endLon);
          const bearingAtEnd = turn.bearingAt(turnEnd);
          return isNaN(bearingAtEnd) ? undefined : out.setAsGreatCircle(turnEnd, bearingAtEnd);
        }
      }
      case LegType.HM:
      case LegType.HF:
      case LegType.HA: {
        const vectors = transitionMode === LNavTransitionMode.None
          ? LNavDirector.getVectorsForTransitionMode(legCalc, transitionMode, this.lnavIsSuspended.get())
          : legCalc.flightPath;
        const searchStartIndex = transitionMode === LNavTransitionMode.None
          ? vectorIndex
          : transitionMode === LNavTransitionMode.Ingress
            ? 0
            : 3;

        let vector;
        for (let i = searchStartIndex; i < vectors.length; i++) {
          const holdVector = vectors[i];
          if (BitFlags.isAny(holdVector.flags, FlightPathVectorFlags.HoldOutboundLeg | FlightPathVectorFlags.HoldInboundLeg)) {
            vector = holdVector;
            break;
          }
        }

        return vector ? FlightPathUtils.setGeoCircleFromVector(vector, out) : undefined;
      }
      default: {
        const vector = legCalc.flightPath[
          transitionMode === LNavTransitionMode.None
            ? vectorIndex
            : transitionMode === LNavTransitionMode.Ingress
              ? 0
              : legCalc.flightPath.length - 1
        ];

        return vector ? FlightPathUtils.setGeoCircleFromVector(vector, out) : undefined;
      }
    }
  }

  /**
   * Gets the active distance from the plane position to the leg end.
   * @param leg The leg to get the distance for.
   * @param pos The current plane position.
   * @returns The distance, in nautical miles.
   */
  private getActiveDistance(leg: LegDefinition, pos: GeoPointInterface): number {
    const finalVector = leg.calculated?.flightPath[leg.calculated.flightPath.length - 1];
    if (finalVector !== undefined) {
      return UnitType.GA_RADIAN.convertTo(pos.distance(finalVector.endLat, finalVector.endLon), UnitType.NMILE);
    }

    return 0;
  }

  /**
   * Gets the total distance from the plane position to the destination leg.
   * @param activeLegIndex The global leg index of the active flight plan leg.
   * @param activeLegDistance The distance from the present position to the end of the active leg, in nautical miles.
   * @returns The distance, in nautical miles.
   */
  private getTotalDistance(activeLegIndex: number, activeLegDistance: number): number {
    const plan = this.flightPlanner.getActiveFlightPlan();
    const activeLegCumulativeDistance = plan.tryGetLeg(activeLegIndex)?.calculated?.cumulativeDistanceWithTransitions ?? 0;

    let lastLegIndex = plan.length - 1;
    for (const leg of plan.legs(true)) {
      if (!BitFlags.isAll(leg.flags, LegDefinitionFlags.MissedApproach)) {
        break;
      }
      lastLegIndex--;
    }

    const destinationLegCumulativeDistance = plan.tryGetLeg(lastLegIndex)?.calculated?.cumulativeDistanceWithTransitions ?? 0;

    return UnitType.METER.convertTo(destinationLegCumulativeDistance - activeLegCumulativeDistance, UnitType.NMILE) + activeLegDistance;
  }

  /**
   * Gets the active distance from the plane position to the next leg turn.
   * @param leg The leg to get the distance for.
   * @param pos The current plane position.
   * @returns The distance, in nautical miles.
   */
  private getDistanceToTurn(leg: LegDefinition, pos: GeoPointInterface): number {
    if (leg.calculated !== undefined) {
      const firstEgressVector = leg.calculated.egress[0];
      if (firstEgressVector) {
        return UnitType.GA_RADIAN.convertTo(pos.distance(firstEgressVector.startLat, firstEgressVector.startLon), UnitType.NMILE);
      } else {
        return this.getActiveDistance(leg, pos);
      }
    }

    return 0;
  }

  /**
   * Updates whether OBS is available based on the current active flight plan leg, and sends a control event if OBS
   * availability has changed since the last update.
   * @param activeLeg The active flight plan leg, or `null` if none exists.
   */
  private updateObsAvailable(activeLeg: LegDefinition | null): void {
    let newObsAvailable = false;
    if (activeLeg) {
      switch (activeLeg.leg.type) {
        case LegType.AF:
        case LegType.CD:
        case LegType.CF:
        case LegType.CR:
        case LegType.DF:
        case LegType.IF:
        case LegType.RF:
        case LegType.TF:
          newObsAvailable = true;
          break;
      }
    }
    if (newObsAvailable !== this.obsAvailable) {
      this.obsAvailable = newObsAvailable;
      this.bus.getPublisher<GarminControlEvents>().pub('obs_available', this.obsAvailable, true, true);
    }
  }

  /**
   * Checks and returns the CDI Scale when in an approach.
   * @returns The CDIScaleLabel appropriate for the approach.
   */
  private getApproachCdiScale(): CDIScaleLabel {
    switch (this.approachDetails.approachType) {
      case ApproachType.APPROACH_TYPE_GPS:
      case ApproachType.APPROACH_TYPE_RNAV:
        switch (this.approachDetails.approachRnavType) {
          case RnavTypeFlags.LPV:
            return CDIScaleLabel.LPV;
          case RnavTypeFlags.LP:
            return this.approachDetails.approachIsCircling ? CDIScaleLabel.LP : CDIScaleLabel.LPPlusV;
          case RnavTypeFlags.LNAVVNAV:
            return CDIScaleLabel.LNavVNav;
        }
        return this.approachDetails.approachIsCircling ? CDIScaleLabel.LNav : CDIScaleLabel.LNavPlusV;
      case AdditionalApproachType.APPROACH_TYPE_VISUAL:
        return CDIScaleLabel.Visual;
      default:
        return CDIScaleLabel.Terminal;
    }
  }
}