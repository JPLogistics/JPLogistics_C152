import { AirportFacility, DepartureProcedure, ICAO } from 'msfssdk/navigation';
import { SelectDepArrStore } from './SelectDepArrStore';

/**
 * A data store for departure selection components.
 */
export class SelectDepartureStore extends SelectDepArrStore<DepartureProcedure> {
  /** @inheritdoc */
  protected getProcedures(airport: AirportFacility | undefined): readonly DepartureProcedure[] {
    return airport?.departures ?? [];
  }

  /** @inheritdoc */
  public getTransitionName(procedure: DepartureProcedure, transitionIndex: number, rwyTransitionIndex: number): string {
    if (transitionIndex == -1) {
      if (procedure.commonLegs.length > 0) {
        const legsLen = procedure.commonLegs.length;
        /** For Departures, default transition name should be last leg icao */
        return ICAO.getIdent(procedure.commonLegs[legsLen - 1].fixIcao);
      } else {
        const rwyTrans = procedure.runwayTransitions[rwyTransitionIndex];
        const legsLen = rwyTrans.legs.length;
        /** For Departures, default transition name should be last leg icao */
        return ICAO.getIdent(rwyTrans.legs[legsLen - 1].fixIcao);
      }
    } else {
      const enrTrans = procedure.enRouteTransitions[transitionIndex];
      if (enrTrans.name.length > 0) {
        return enrTrans.name;
      } else {
        /** For Departures, default transition name should be last leg icao */
        const legsLen = enrTrans.legs.length;
        return ICAO.getIdent(enrTrans.legs[legsLen - 1].fixIcao);
      }
    }
  }
}