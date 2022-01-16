import { BitFlags } from 'msfssdk';
import { FlightPathCalculator, LegDefinitionFlags } from 'msfssdk/flightplan';
import { DepartureProcedure, FacilityType, ICAO, LegType } from 'msfssdk/navigation';
import { Fms, ProcedureType } from '../../../FlightPlan/Fms';
import { SelectDepArrController } from './SelectDepArrController';
import { SelectDepArrStore } from './SelectDepArrStore';

/**
 * Controller for SelectDeparture.
 */
export class SelectDepartureController<S extends SelectDepArrStore<DepartureProcedure> = SelectDepArrStore<DepartureProcedure>>
  extends SelectDepArrController<DepartureProcedure, S> {

  /**
   * Constructor.
   * @param store A data store.
   * @param selectNextCb Callback when the next control should be focused.
   * @param fms The FMS instance.
   * @param calculator The flight path calculator used by this controller to build preview flight plans.
   */
  constructor(
    protected readonly store: S,
    protected readonly selectNextCb: () => void,
    protected readonly fms: Fms,
    protected readonly calculator: FlightPathCalculator,
  ) {
    super(store, selectNextCb, fms, calculator, ProcedureType.DEPARTURE);
  }

  public onLoadExecute = (): void => {
    const selectedFacility = this.store.selectedFacility.get();
    const selectedProc = this.store.selectedProcedure.get();
    if (selectedFacility && selectedProc) {
      const rwyTransIndex = this.store.selectedRwyTransIndex.get();

      this.fms.insertDeparture(
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

    if (this.fms.hasPrimaryFlightPlan()) {
      const plan = this.fms.getPrimaryFlightPlan();

      icao = plan.originAirport;

      if (icao === undefined) {
        // get the FIRST airport in the flight plan.
        for (const leg of plan.legs()) {
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