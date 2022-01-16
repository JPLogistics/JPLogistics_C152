import { AirportFacility, ArrivalProcedure, ICAO } from 'msfssdk/navigation';
import { SelectDepArrStore } from './SelectDepArrStore';

/**
 * A data store for arrival selection components.
 */
export class SelectArrivalStore extends SelectDepArrStore<ArrivalProcedure> {
  /** @inheritdoc */
  protected getProcedures(airport: AirportFacility | undefined): readonly ArrivalProcedure[] {
    return airport?.arrivals ?? [];
  }

  /** @inheritdoc */
  public getTransitionName(procedure: ArrivalProcedure, transitionIndex: number, rwyTransitionIndex: number): string {
    if (transitionIndex == -1) {
      if (procedure.commonLegs.length > 0) {
        /** For Arrivals, default transition name should be first leg icao */
        return ICAO.getIdent(procedure.commonLegs[0].fixIcao);
      } else {
        const rwyTrans = procedure.runwayTransitions[rwyTransitionIndex];
        /** For Arrivals, default transition name should be first leg icao */
        return ICAO.getIdent(rwyTrans.legs[0].fixIcao);
      }
    } else {
      const enrTrans = procedure.enRouteTransitions[transitionIndex];
      if (enrTrans.name.length > 0) {
        return enrTrans.name;
      } else {
        /** For Arrivals, default transition name should be first leg icao */
        return ICAO.getIdent(enrTrans.legs[0].fixIcao);
      }
    }
  }
}