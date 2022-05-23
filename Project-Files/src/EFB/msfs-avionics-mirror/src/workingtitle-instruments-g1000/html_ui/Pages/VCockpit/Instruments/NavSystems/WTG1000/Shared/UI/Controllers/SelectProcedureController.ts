import { Subject } from 'msfssdk';
import { Facility, AirportFacility, Procedure, RunwayTransition, EnrouteTransition } from 'msfssdk/navigation';
import { LegDefinition, FlightPlannerEvents, FlightPathCalculator } from 'msfssdk/flightplan';

import { Fms, ProcedureType } from 'garminsdk/flightplan';
import { SelectProcedureStore } from './SelectProcedureStore';

/** The controller for SelectProcedure views. */
export abstract class SelectProcedureController {
  public readonly facilityChangedHandler = this.onFacilityChanged.bind(this);
  public readonly procSelectedHandler = this.onProcSelected.bind(this);
  public readonly runwaySelectedHandler = this.onRunwaySelected.bind(this);
  public readonly transSelectedHandler = this.onTransSelected.bind(this);

  public readonly inputIcao = Subject.create('');
  public readonly canLoad = Subject.create(false);

  /**
   * Ctor
   * @param store The store.
   * @param selectNextCb Callback when the next control should be focused.
   * @param fms The FMS instance.
   * @param calculator The flight path calculator used by this controller to build preview flight plans.
   * @param procType is the procedure type for this controller.
   */
  constructor(
    protected readonly store: SelectProcedureStore,
    protected readonly selectNextCb: () => void,
    protected readonly fms: Fms,
    protected readonly calculator: FlightPathCalculator,
    protected readonly procType: ProcedureType
  ) {

    const fpl = this.fms.bus.getSubscriber<FlightPlannerEvents>();
    fpl.on('fplCalculated').handle((e) => {
      if (e.planIndex == 2) {
        const plan = this.fms.flightPlanner.getFlightPlan(2);
        if (plan.segmentCount > 0) {
          const segment = plan.getSegment(0);
          for (let i = 0; i < segment.legs.length; i++) {
            const leg = this.store.sequence.tryGet(i);
            if (leg !== undefined) {
              leg.get().calculated = segment.legs[i].calculated;
              leg.notify();
            }
          }
        }
      }
    });
  }

  /** Initialize the controller. */
  public initialize(): void {
    this.canLoad.set(false);
    const initIcao = this.getInitialICAO() ?? '';
    this.inputIcao.set(initIcao);

    if (initIcao !== '') {
      setTimeout(() => {
        this.gotoNextSelect(false);
      }, 100);
    }
  }

  /**
   * Gets the initial ICAO on load.
   * @returns The initial ICAO string or undefined.
   */
  protected abstract getInitialICAO(): string | undefined;

  /**
   * Responds to when the waypoint input's selected facility changes.
   * @param facility The selected facility.
   */
  protected onFacilityChanged(facility: Facility | undefined): void {
    this.store.clearFacility();
    if (facility !== undefined) {
      this.store.loadFacility(facility as AirportFacility);
    }
  }

  /**
   * Evaluates if the next select should be focused.
   * @param isRefresh If select event happened based on a data refresh.
   */
  private gotoNextSelect = (isRefresh: boolean): void => {
    if (!isRefresh) {
      this.selectNextCb();
    }
  };

  /**
   * Callback handler for when a procedure is selected.
   * @param index The index of the selected procedure.
   * @param item The procedure selected.
   * @param isRefresh If select event happened based on a data refresh.
   */
  protected async onProcSelected(index: number, item: Procedure, isRefresh: boolean): Promise<void> {
    this.store.selectedProcIndex.set(index);
    this.store.runways.set((index > -1) ? this.store.getRunways() : []);
    this.store.transitions.set((index > -1) ? this.store.getTransitions() : []);
    this.canLoad.set(this.store.selectedProcIndex.get() !== -1);
    const isPreviewBuilt = await this.buildSequence();
    if (isPreviewBuilt) {
      this.gotoNextSelect(isRefresh);
    }
  }

  /**
   * Responds to when a runway transition is selected.
   * @param index The index of the selected transition.
   * @param item The transition selected.
   * @param isRefresh If select event happened based on a data refresh.
   */
  protected async onRunwaySelected(index: number, item: RunwayTransition, isRefresh: boolean): Promise<void> {
    this.store.selectedRwyIndex.set(index);
    const isPreviewBuilt = await this.buildSequence();
    if (isPreviewBuilt) {
      this.gotoNextSelect(isRefresh);
    }
  }

  /**
   * Responds to when an enroute transition is selected.
   * @param index The index of the selected transition.
   * @param item The transition selected.
   * @param isRefresh If select event happened based on a data refresh.
   */
  protected async onTransSelected(index: number, item: EnrouteTransition, isRefresh: boolean): Promise<void> {
    this.store.selectedTransIndex.set(index - 1);
    const isPreviewBuilt = await this.buildSequence();
    if (isPreviewBuilt) {
      this.gotoNextSelect(isRefresh);
    }
  }

  protected buildSequenceOpId = 0;

  /**
   * Builds the sequence list for the approach preview
   * @returns A Promise which is fulfilled with whether a preview sequence was successfully built.
   */
  protected async buildSequence(): Promise<boolean> {
    if (this.store.selectedProcIndex.get() > -1) {
      const opId = ++this.buildSequenceOpId;

      const legs: Subject<LegDefinition>[] = [];
      if (this.store.selectedFacility !== undefined) {
        const plan = await this.fms.buildProcedurePreviewPlan(
          this.calculator,
          this.store.selectedFacility,
          this.procType,
          this.store.selectedProcIndex.get(),
          this.store.selectedTransIndex.get(),
          this.store.getOneWayRunway(),
          this.store.selectedRwyIndex.get()
        );

        if (opId === this.buildSequenceOpId) {
          plan.getSegment(0).legs.forEach((l) => {
            legs.push(Subject.create(l));
          });
          this.store.sequence.set(legs);
          return true;
        }
      }
    }

    return false;
  }

  /** Callback handler for when load is pressed. */
  public onLoadSelected = (): void => {
    this.onLoadExecute();
  };

  /** Called when the load procedure button is clicked. */
  public abstract onLoadExecute: () => void;
}