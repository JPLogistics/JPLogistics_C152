import { Wait } from 'msfssdk';
import { AirportFacility, AirportRunway, FacilityType, ICAO, LegType, OneWayRunway, FlightPlanLeg, UserFacilityUtils, RunwayUtils } from 'msfssdk/navigation';
import { FlightPlan, FlightPlanSegmentType } from 'msfssdk/flightplan';

import { Fms } from './FlightPlan/Fms';

/** A class for syncing a flight plan with the game */
export class FlightPlanAsoboSync {
  static fpChecksum = 0;
  static fpListenerInitialized = false;

  /**
   * Inits flight plan asobo sync
   */
  public static init(): void {
    if (!FlightPlanAsoboSync.fpListenerInitialized) {
      RegisterViewListener('JS_LISTENER_FLIGHTPLAN');
      FlightPlanAsoboSync.fpListenerInitialized = true;
    }
  }

  /**
   * Loads the flight plan from the sim.
   * @param fms The fms.
   * @returns a Promise which is fulfilled when the flight plan has been loaded.
   */
  public static async loadFromGame(fms: Fms): Promise<void> {
    FlightPlanAsoboSync.init();

    await Wait.awaitDelay(200);
    Coherent.call('LOAD_CURRENT_ATC_FLIGHTPLAN');
    // Coherent.call('LOAD_CURRENT_GAME_FLIGHT');
    await Wait.awaitDelay(5000);
    const isBushtrip = await Coherent.call('GET_IS_BUSHTRIP');
    if (!isBushtrip) {
      const data = await Coherent.call('GET_FLIGHTPLAN');

      const isDirectTo = data.isDirectTo;
      let lastEnrouteSegment = 1;

      // TODO: dirto
      if (!isDirectTo) {
        if (data.waypoints.length === 0) {
          return;
        }

        // init a flightplan
        await fms.emptyPrimaryFlightPlan();
        const plan = fms.getPrimaryFlightPlan();

        // set origin
        let originFacilityType: FacilityType | undefined = undefined;
        if (ICAO.isFacility(data.waypoints[0].icao)) {
          originFacilityType = ICAO.getFacilityType(data.waypoints[0].icao);
        }
        if (originFacilityType === FacilityType.Airport) {
          const originFac = await fms.facLoader.getFacility(ICAO.getFacilityType(data.waypoints[0].icao), data.waypoints[0].icao);
          if (originFac !== undefined) {
            FlightPlanAsoboSync.setDeparture(originFac as AirportFacility, data, fms);
          }
        } else if (originFacilityType !== undefined) {
          FlightPlanAsoboSync.buildNonAirportOriginLeg(data, plan, fms);
        }

        // set dest
        const destIndex = data.waypoints.length - 1;
        let destFacilityType: FacilityType | undefined = undefined;
        if (ICAO.isFacility(data.waypoints[destIndex].icao)) {
          destFacilityType = ICAO.getFacilityType(data.waypoints[destIndex].icao);
        }
        if (destFacilityType === FacilityType.Airport) {
          const destFac = await fms.facLoader.getFacility(ICAO.getFacilityType(data.waypoints[destIndex].icao), data.waypoints[destIndex].icao);
          if (destFac !== undefined) {
            await FlightPlanAsoboSync.setDestination(destFac as AirportFacility, data, fms);
          }
        }

        // set enroute waypoints
        lastEnrouteSegment = FlightPlanAsoboSync.setEnroute(data, plan, fms);

        // set non-airport destination leg as the last enroute leg
        if (destFacilityType !== FacilityType.Airport && destFacilityType !== undefined) {
          FlightPlanAsoboSync.buildNonAirportDestLeg(data, plan, fms, lastEnrouteSegment);
        }


        // if (destinationSet && !originSet) {
        //   if (plan.length >= 1) {
        //     plan.getSegmentIndex(0)
        //     fms.createDirectToExisting()
        //   }
        // }
        plan.calculate(0).then(() => {
          plan.setLateralLeg(0);
        });
      }
    }
  }

  // public static async SaveToGame(fpln: FlightPlanManager): Promise<void> {
  //   // eslint-disable-next-line no-async-promise-executor
  //   return new Promise(async (resolve, reject) => {
  //     FlightPlanAsoboSync.init();
  //     const plan = fpln.getCurrentFlightPlan();
  //     if (WTDataStore.get('WT_CJ4_FPSYNC', 0) !== 0 && (plan.checksum !== this.fpChecksum)) {

  //       // await Coherent.call("CREATE_NEW_FLIGHTPLAN");
  //       await Coherent.call("SET_CURRENT_FLIGHTPLAN_INDEX", 0).catch(console.log);
  //       await Coherent.call("CLEAR_CURRENT_FLIGHT_PLAN").catch(console.log);

  //       if (plan.hasOrigin && plan.hasDestination) {
  //         if (plan.hasOrigin) {
  //           await Coherent.call("SET_ORIGIN", plan.originAirfield.icao, false);
  //         }

  //         if (plan.hasDestination) {
  //           await Coherent.call("SET_DESTINATION", plan.destinationAirfield.icao, false);
  //         }

  //         let coIndex = 1;
  //         for (let i = 0; i < plan.enroute.waypoints.length; i++) {
  //           const wpt = plan.enroute.waypoints[i];
  //           if (wpt.icao.trim() !== "") {
  //             await Coherent.call("ADD_WAYPOINT", wpt.icao, coIndex, false);
  //             coIndex++;
  //           }
  //         }

  //         await Coherent.call("SET_ORIGIN_RUNWAY_INDEX", plan.procedureDetails.originRunwayIndex).catch(console.log);
  //         await Coherent.call("SET_DEPARTURE_RUNWAY_INDEX", plan.procedureDetails.departureRunwayIndex);
  //         await Coherent.call("SET_DEPARTURE_PROC_INDEX", plan.procedureDetails.departureIndex);
  //         await Coherent.call("SET_DEPARTURE_ENROUTE_TRANSITION_INDEX", plan.procedureDetails.departureTransitionIndex);

  //         await Coherent.call("SET_ARRIVAL_RUNWAY_INDEX", plan.procedureDetails.arrivalRunwayIndex);
  //         await Coherent.call("SET_ARRIVAL_PROC_INDEX", plan.procedureDetails.arrivalIndex);
  //         await Coherent.call("SET_ARRIVAL_ENROUTE_TRANSITION_INDEX", plan.procedureDetails.arrivalTransitionIndex);

  //         await Coherent.call("SET_APPROACH_INDEX", plan.procedureDetails.approachIndex).then(() => {
  //           Coherent.call("SET_APPROACH_TRANSITION_INDEX", plan.procedureDetails.approachTransitionIndex);
  //         });
  //       }

  //       this.fpChecksum = plan.checksum;
  //     }
  //     Coherent.call("RECOMPUTE_ACTIVE_WAYPOINT_INDEX");
  //   });
  // }

  /**
   * Sets the departure procedure or facility if specified
   * @param facility is the origin airport facility record
   * @param data is the flight plan sync data object from the world map
   * @param fms an instance of the fms
   * @returns whether a departure was set.
   */
  private static setDeparture(facility: AirportFacility, data: any, fms: Fms): boolean {
    let originOneWayRunway = undefined;
    if (data.originRunwayIndex > -1) {
      const oneWayRunways: OneWayRunway[] = [];
      let index = 0;
      facility.runways.forEach((runway: AirportRunway) => {
        for (const rw of RunwayUtils.getOneWayRunways(runway, index)) {
          oneWayRunways.push(rw);
        }
        index++;
      });
      oneWayRunways.sort(RunwayUtils.sortRunways);
      originOneWayRunway = oneWayRunways[data.originRunwayIndex];
    }
    if (data.departureProcIndex !== -1) {
      if (data.departureRunwayIndex > -1) {
        const runwayTransition = facility.departures[data.departureProcIndex].runwayTransitions[data.departureRunwayIndex];
        const runwayString = RunwayUtils.getRunwayNameString(runwayTransition.runwayNumber, runwayTransition.runwayDesignation);
        originOneWayRunway = RunwayUtils.matchOneWayRunwayFromDesignation(facility, runwayString);
      }
      const enrouteTransitionIndex = data.departureEnRouteTransitionIndex === 0 &&
        facility.departures[data.departureProcIndex].enRouteTransitions.length < 1 ? -1 : data.departureEnRouteTransitionIndex;
      fms.insertDeparture(facility, data.departureProcIndex, data.departureRunwayIndex, enrouteTransitionIndex, originOneWayRunway);
      return true;
    } else if (facility !== undefined) {
      fms.setOrigin(facility, originOneWayRunway);
      return true;
    }
    return false;
  }

  /**
   * Sets the destination airport
   * @param facility is the destination airport facility record
   * @param data is the flight plan sync data object from the world map
   * @param fms an instance of the fms
   * @returns A Promise which is fulfilled with whether a destination was set.
   */
  private static async setDestination(facility: AirportFacility, data: any, fms: Fms): Promise<boolean> {
    let destOneWayRunway = undefined;
    let setDestination = false;
    if (data.arrivalProcIndex !== -1) {
      if (data.arrivalRunwayIndex > -1) {
        const runwayTransition = facility.arrivals[data.arrivalProcIndex].runwayTransitions[data.arrivalRunwayIndex];
        if (runwayTransition !== undefined) {
          const runwayString = RunwayUtils.getRunwayNameString(runwayTransition.runwayNumber, runwayTransition.runwayDesignation);
          destOneWayRunway = RunwayUtils.matchOneWayRunwayFromDesignation(facility, runwayString);
        }
      }
      const enrouteTransitionIndex = data.arrivalEnRouteTransitionIndex === 0 &&
        facility.arrivals[data.arrivalProcIndex].enRouteTransitions.length < 1 ? -1 : data.arrivalEnRouteTransitionIndex;
      fms.insertArrival(facility, data.arrivalProcIndex, data.arrivalRunwayIndex, enrouteTransitionIndex, destOneWayRunway);
      setDestination = true;
    }

    if (data.approachIndex !== -1) {
      const approachTransitionIndex = data.approachTransitionIndex === 0 &&
        facility.approaches[data.approachIndex].transitions.length < 1 ? -1 : data.approachTransitionIndex;
      await fms.insertApproach(facility, data.approachIndex, approachTransitionIndex);
      setDestination = true;
    }

    if (facility !== undefined && data.arrivalProcIndex === -1 && data.approachIndex === -1) {
      fms.setDestination(facility);
      setDestination = true;
    }
    return setDestination;
  }

  /**
   * Sets the enroute portion of the flight plan
   * @param data is the flight plan sync data object from the world map
   * @param plan an instance of the flight plan
   * @param fms an instance of the fms
   * @returns the last enroute segment
   */
  private static setEnroute(data: any, plan: FlightPlan, fms: Fms): number {
    const enrouteStart = (data.departureWaypointsSize == -1) ? 1 : data.departureWaypointsSize;
    const enroute = data.waypoints.slice(enrouteStart, -(data.arrivalWaypointsSize + 1));
    let custIdx = 1;
    let currentSegment = 1;
    let lastDepartureLegIcao = undefined;
    let lastLegWasAirway = false;
    if (data.departureProcIndex > -1) {
      const depSegment = plan.getSegment(0);
      if (depSegment.legs.length > 1) {
        lastDepartureLegIcao = depSegment.legs[depSegment.legs.length - 1].leg.fixIcao;
      }
    }

    for (let i = 0; i < enroute.length; i++) {
      const wpt = enroute[i];
      const segment = plan.getSegment(currentSegment);
      if (wpt.airwayIdent) {
        if (currentSegment == 1 && lastDepartureLegIcao == wpt.icao) {
          //do not add this leg and build the airway in this segment
        } else {
          const leg = FlightPlan.createLeg({
            type: LegType.TF,
            fixIcao: wpt.icao
          });
          plan.addLeg(currentSegment, leg);
          if (!lastLegWasAirway) {
            plan.insertSegment(currentSegment + 1, FlightPlanSegmentType.Enroute, wpt.airwayIdent);
            currentSegment += 1;
            // plan.setAirway(currentSegment, segment.airway + '.' + wpt.ident);
          }
        }
        for (let j = i + 1; j < enroute.length; j++) {
          i++;
          const airwayLeg = FlightPlan.createLeg({
            type: LegType.TF,
            fixIcao: enroute[j].icao
          });
          plan.addLeg(currentSegment, airwayLeg);

          if (enroute[j].airwayIdent !== wpt.airwayIdent) {
            lastLegWasAirway = enroute[j].airwayIdent ? true : false;
            break;
          }
        }

        plan.setAirway(currentSegment, wpt.airwayIdent + '.' + enroute[i].ident);

        currentSegment += 1;
        plan.insertSegment(currentSegment, FlightPlanSegmentType.Enroute, lastLegWasAirway ? enroute[i].airwayIdent : undefined);

      } else {
        let skip = false;
        if (currentSegment == 1 && lastDepartureLegIcao == wpt.icao) {
          skip = true;
        }
        let leg: FlightPlanLeg | undefined = undefined;
        if (!skip && wpt.icao.trim() == '') {
          const re = /(?:[D][\d])|(?:DLast)|(?:TIMEVERT)|(?:TIMECLIMB)|(?:TIMECRUIS)|(?:TIMEDSCNT)|(?:TIMEAPPROACH)/;
          skip = wpt.ident.match(re) !== null;
        }
        if (!skip && (wpt.ident === 'Custom' || wpt.icao.trim() == '')) {
          const userFacility = UserFacilityUtils.createFromLatLon(`U      USR${custIdx.toString().padStart(2, '0')}`,
            wpt.lla.lat, wpt.lla.long, true, wpt.icao.trim() === '' ? wpt.ident : `Custom ${custIdx.toString().padStart(2, '0')}`);
          fms.addUserFacility(userFacility);
          leg = FlightPlan.createLeg({
            type: LegType.TF,
            fixIcao: userFacility.icao,
            lat: wpt.lla.lat,
            lon: wpt.lla.long
          });
          custIdx++;
        } else if (!skip && wpt.icao.trim() !== '') {
          leg = FlightPlan.createLeg({
            type: LegType.TF,
            fixIcao: wpt.icao
          });
        }
        if (leg) {
          plan.addLeg(currentSegment, leg);
          if (lastLegWasAirway) {
            plan.setAirway(currentSegment, segment.airway + '.' + wpt.ident);
            currentSegment += 1;
            plan.insertSegment(currentSegment, FlightPlanSegmentType.Enroute);
          }
          lastLegWasAirway = false;
        }
      }
    }
    if (plan.getSegment(currentSegment).airway) {
      currentSegment += 1;
      plan.insertSegment(currentSegment, FlightPlanSegmentType.Enroute);
    }
    return currentSegment;
  }

  /**
   * Sets the first leg of the enroute plan as the first leg in the world map plan, but as an IF leg
   * @param data is the flight plan sync data object from the world map
   * @param plan an instance of the flight plan
   * @param fms an instance of FMS
   */
  private static buildNonAirportOriginLeg(data: any, plan: FlightPlan, fms: Fms): void {
    const wpt = data.waypoints[0];
    if (wpt.ident === 'CUSTD' || wpt.ident === 'CUSTA') {
      const userFacility = UserFacilityUtils.createFromLatLon('U      CUSTD',
        wpt.lla.lat, wpt.lla.long, true, 'Custom Origin');
      fms.addUserFacility(userFacility);
      const leg = FlightPlan.createLeg({
        type: LegType.IF,
        fixIcao: 'U      CUSTD',
        lat: wpt.lla.lat,
        lon: wpt.lla.long
      });
      plan.addLeg(1, leg);
    } else if (wpt.icao.trim() !== '') {
      const leg = FlightPlan.createLeg({
        type: LegType.IF,
        fixIcao: wpt.icao
      });
      plan.addLeg(1, leg);
    }
  }

  /**
   * Sets the last leg of the enroute plan as the last leg in the world map plan, but as an TF leg
   * @param data is the flight plan sync data object from the world map
   * @param plan an instance of the flight plan
   * @param fms an instance of FMS
   * @param lastEnrouteSegment is the last enroute segment
   */
  private static buildNonAirportDestLeg(data: any, plan: FlightPlan, fms: Fms, lastEnrouteSegment: number): void {
    const wpt = data.waypoints[data.waypoints.length - 1];
    if (wpt.ident === 'CUSTD' || wpt.ident === 'CUSTA') {
      const userFacility = UserFacilityUtils.createFromLatLon('U      CUSTA',
        wpt.lla.lat, wpt.lla.long, true, 'Custom Destination');
      fms.addUserFacility(userFacility);
      const leg = FlightPlan.createLeg({
        type: LegType.TF,
        fixIcao: userFacility.icao,
        lat: wpt.lla.lat,
        lon: wpt.lla.long
      });
      plan.addLeg(lastEnrouteSegment, leg);
    } else if (wpt.icao.trim() !== '') {
      const leg = FlightPlan.createLeg({
        type: LegType.TF,
        fixIcao: wpt.icao
      });
      plan.addLeg(lastEnrouteSegment, leg);
    }
  }
}