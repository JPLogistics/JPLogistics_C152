import { BitFlags, Subject } from 'msfssdk';
import { FlightPathCalculator, FlightPlan, LegDefinitionFlags } from 'msfssdk/flightplan';
import { ArrivalProcedure, FacilityType, ICAO, LegType } from 'msfssdk/navigation';
import { Fms, ProcedureType } from '../../../../../Shared/FlightPlan/Fms';
import { FlightPlanFocus } from '../../../../../Shared/UI/FPL/FPLTypesAndProps';
import { MFDSelectArrivalStore } from './MFDSelectArrivalStore';
import { MFDSelectDepArrController } from './MFDSelectDepArrController';

/**
 * Controller for MFDSelectArrival component.
 */
export class MFDSelectArrivalController extends MFDSelectDepArrController<ArrivalProcedure, MFDSelectArrivalStore> {
  /**
   * Constructor.
   * @param store A data store.
   * @param selectNextCb Callback when the next control should be focused.
   * @param fms The FMS instance.
   * @param calculator The flight path calculator used by this controller to build preview flight plans.
   * @param procedurePlan A subject to provide the procedure preview flight plan.
   * @param transitionPlan A subject to provide the procedure transition preview flight plan.
   * @param focus A subject to provide the flight plan focus for the selected approach.
   */
  constructor(
    store: MFDSelectArrivalStore,
    selectNextCb: () => void,
    fms: Fms,
    calculator: FlightPathCalculator,
    procedurePlan: Subject<FlightPlan | null>,
    transitionPlan: Subject<FlightPlan | null>,
    focus: Subject<FlightPlanFocus>
  ) {
    super(store, selectNextCb, fms, calculator, procedurePlan, transitionPlan, focus, ProcedureType.ARRIVAL);
  }

  /** @inheritdoc */
  public onLoadExecute = (): void => {
    const selectedFacility = this.store.selectedFacility.get();
    const selectedProc = this.store.selectedProcedure.get();
    if (selectedFacility && selectedProc) {
      const rwyTransIndex = this.store.selectedRwyTransIndex.get();

      this.fms.insertArrival(
        selectedFacility,
        this.store.selectedProcIndex.get(),
        rwyTransIndex,
        this.store.selectedTransIndex.get(),
        this.store.getOneWayRunway(selectedFacility, selectedProc, rwyTransIndex)
      );
    }
  }

  /** @inheritdoc */
  protected getInitialICAO(): string | undefined {
    let icao: string | undefined;

    const dtoTargetIcao = this.fms.getDirectToTargetIcao();
    if (dtoTargetIcao !== undefined && ICAO.isFacility(dtoTargetIcao) && ICAO.getFacilityType(dtoTargetIcao) === FacilityType.Airport) {
      icao = dtoTargetIcao;
    } else if (this.fms.hasPrimaryFlightPlan()) {
      const plan = this.fms.getPrimaryFlightPlan();

      icao = plan.destinationAirport;

      if (icao === undefined) {
        // get the LAST airport in the flight plan.
        for (const leg of plan.legs(true)) {
          if (BitFlags.isAll(leg.flags, LegDefinitionFlags.DirectTo)) {
            continue;
          }

          switch (leg.leg.type) {
            case LegType.IF:
            case LegType.TF:
            case LegType.DF:
            case LegType.CF:
            case LegType.AF:
            case LegType.RF:
              if (ICAO.isFacility(leg.leg.fixIcao) && ICAO.getFacilityType(leg.leg.fixIcao) === FacilityType.Airport) {
                icao = leg.leg.fixIcao;
              }
              break;
          }

          if (icao !== undefined) {
            break;
          }
        }
      }
    }

    return icao;
  }
}