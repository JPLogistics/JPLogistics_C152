import { Subject } from 'msfssdk';
import { Facility, AirportFacility, RunwayTransition, EnrouteTransition, DepartureProcedure, ArrivalProcedure } from 'msfssdk/navigation';
import { LegDefinition, FlightPathCalculator } from 'msfssdk/flightplan';
import { SelectDepArrStore } from './SelectDepArrStore';
import { Fms, ProcedureType } from 'garminsdk/flightplan';
import { SelectControl } from '../../UiControls2/SelectControl';

/**
 * Controller for departure/arrival selection components.
 */
export abstract class SelectDepArrController<T extends DepartureProcedure | ArrivalProcedure, S extends SelectDepArrStore<T> = SelectDepArrStore<T>> {
  public readonly facilityChangedHandler = this.onFacilityChanged.bind(this);
  public readonly procSelectedHandler = this.onProcSelected.bind(this);
  public readonly procFocusedHandler = this.onProcFocused.bind(this);
  public readonly runwaySelectedHandler = this.onRunwaySelected.bind(this);
  public readonly runwayFocusedHandler = this.onRunwayFocused.bind(this);
  public readonly transSelectedHandler = this.onTransSelected.bind(this);
  public readonly transFocusedHandler = this.onTransFocused.bind(this);
  public readonly procSelectionClosedHandler = this.onProcSelectionClosed.bind(this);
  public readonly rwyTransSelectionClosedHandler = this.onRwyTransSelectionClosed.bind(this);
  public readonly transSelectionClosedHandler = this.onTransSelectionClosed.bind(this);

  public readonly inputIcao = Subject.create('');
  public readonly canLoad = Subject.create(false);

  /**
   * Constructor.
   * @param store A data store.
   * @param selectNextCb Callback when the next control should be focused.
   * @param fms The FMS instance.
   * @param calculator The flight path calculator used by this controller to build preview flight plans.
   * @param procType The procedure type for this controller.
   */
  constructor(
    protected readonly store: S,
    protected readonly selectNextCb: () => void,
    protected readonly fms: Fms,
    protected readonly calculator: FlightPathCalculator,
    protected readonly procType: ProcedureType.DEPARTURE | ProcedureType.ARRIVAL
  ) {
  }

  /**
   * Initializes the airport ICAO input.
   */
  public initializeIcaoInput(): void {
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
    this.store.selectedFacility.set(facility as AirportFacility);
  }

  /**
   * Evaluates if the next select should be focused.
   * @param isRefresh If select event happened based on a data refresh.
   */
  private gotoNextSelect(isRefresh: boolean): void {
    if (!isRefresh) {
      this.selectNextCb();
    }
  }

  /**
   * Handles when the procedure selection dialog is closed.
   * @param source The SelectControl controlling the dialog that was closed.
   * @param selectionMade Whether a selection was made.
   */
  protected async onProcSelectionClosed(source: SelectControl<T>, selectionMade: boolean): Promise<void> {
    if (!selectionMade) {
      await this.buildSequence(
        this.store.selectedFacility.get(),
        this.store.selectedProcedure.get(),
        this.store.selectedProcIndex.get(),
        this.store.selectedTransIndex.get(),
        this.store.selectedRwyTransIndex.get()
      );
    }
  }

  /**
   * Handles when the runway transition selection dialog is closed.
   * @param source The SelectControl controlling the dialog that was closed.
   * @param selectionMade Whether a selection was made.
   */
  protected async onRwyTransSelectionClosed(source: SelectControl<RunwayTransition>, selectionMade: boolean): Promise<void> {
    if (!selectionMade) {
      await this.buildSequence(
        this.store.selectedFacility.get(),
        this.store.selectedProcedure.get(),
        this.store.selectedProcIndex.get(),
        this.store.selectedTransIndex.get(),
        this.store.selectedRwyTransIndex.get()
      );
    }
  }

  /**
   * Handles when the enroute transition selection dialog is closed.
   * @param source The SelectControl controlling the dialog that was closed.
   * @param selectionMade Whether a selection was made.
   */
  protected async onTransSelectionClosed(source: SelectControl<EnrouteTransition>, selectionMade: boolean): Promise<void> {
    if (!selectionMade) {
      await this.buildSequence(
        this.store.selectedFacility.get(),
        this.store.selectedProcedure.get(),
        this.store.selectedProcIndex.get(),
        this.store.selectedTransIndex.get(),
        this.store.selectedRwyTransIndex.get()
      );
    }
  }

  /**
   * Callback handler for when a procedure is selected.
   * @param index The index of the selected procedure.
   * @param item The procedure selected.
   * @param isRefresh If select event happened based on a data refresh.
   */
  protected onProcSelected(index: number, item: T, isRefresh: boolean): void {
    this.store.selectedProcIndex.set(index);
    this.store.selectedProcedure.set(item);
    this.canLoad.set(this.store.selectedProcIndex.get() !== -1);

    if (item) {
      this.gotoNextSelect(isRefresh);
    }
  }

  /**
   * Responds to when a procedure item is focused.
   * @param proc The focused procedure.
   */
  protected async onProcFocused(proc: T): Promise<void> {
    const procIndex = this.store.procedures.getArray().indexOf(proc);
    const isProcSelected = proc === this.store.selectedProcedure.get();

    await this.buildSequence(
      this.store.selectedFacility.get(),
      proc,
      procIndex,
      isProcSelected ? this.store.selectedTransIndex.get() : -1,
      isProcSelected ? this.store.selectedRwyTransIndex.get() : 0
    );
  }

  /**
   * Responds to when a runway transition is selected.
   * @param index The index of the selected transition.
   * @param item The transition selected.
   * @param isRefresh If select event happened based on a data refresh.
   */
  protected async onRunwaySelected(index: number, item: RunwayTransition, isRefresh: boolean): Promise<void> {
    this.store.selectedRwyTransIndex.set(index);
    const isPreviewBuilt = await this.buildSequence(
      this.store.selectedFacility.get(),
      this.store.selectedProcedure.get(),
      this.store.selectedProcIndex.get(),
      this.store.selectedTransIndex.get(),
      index
    );
    if (isPreviewBuilt) {
      this.gotoNextSelect(isRefresh);
    }
  }

  /**
   * Responds to when a runway transition item is focused.
   * @param trans The focused transition.
   */
  protected async onRunwayFocused(trans: RunwayTransition): Promise<void> {
    const rwyTransIndex = this.store.runways.getArray().indexOf(trans);

    await this.buildSequence(
      this.store.selectedFacility.get(),
      this.store.selectedProcedure.get(),
      this.store.selectedProcIndex.get(),
      this.store.selectedTransIndex.get(),
      rwyTransIndex
    );
  }

  /**
   * Responds to when an enroute transition is selected.
   * @param index The index of the selected transition.
   * @param item The transition selected.
   * @param isRefresh If select event happened based on a data refresh.
   */
  protected async onTransSelected(index: number, item: EnrouteTransition, isRefresh: boolean): Promise<void> {
    this.store.selectedTransIndex.set(index - 1);
    const isPreviewBuilt = await this.buildSequence(
      this.store.selectedFacility.get(),
      this.store.selectedProcedure.get(),
      this.store.selectedProcIndex.get(),
      index - 1,
      this.store.selectedRwyTransIndex.get()
    );
    if (isPreviewBuilt) {
      this.gotoNextSelect(isRefresh);
    }
  }

  /**
   * Responds to when an enroute transition item is focused.
   * @param trans The focused transition.
   */
  protected async onTransFocused(trans: EnrouteTransition): Promise<void> {
    const transIndex = Math.max(-1, this.store.transitions.getArray().indexOf(trans) - 1);

    await this.buildSequence(
      this.store.selectedFacility.get(),
      this.store.selectedProcedure.get(),
      this.store.selectedProcIndex.get(),
      transIndex,
      this.store.selectedRwyTransIndex.get()
    );
  }

  protected buildSequenceOpId = 0;

  /**
   * Builds the sequence list and flight plan for the procedure preview.
   * @param airport The airport of the procedure to preview.
   * @param procedure The procedure to preview.
   * @param procIndex The index of the procedure to preview.
   * @param transIndex The enroute transition index of the procedure to preview.
   * @param rwyTransIndex The runway transition index of the procedure to preview.
   * @returns A Promise which is fulfilled with whether a preview sequence was successfully built.
   */
  protected async buildSequence(airport: AirportFacility | undefined, procedure: T | undefined, procIndex: number, transIndex: number, rwyTransIndex: number): Promise<boolean> {
    if (!airport || !procedure) {
      this.store.previewPlan.set(null);
      this.store.sequence.clear();
      return false;
    }

    const opId = ++this.buildSequenceOpId;

    const legs: Subject<LegDefinition>[] = [];
    const plan = await this.fms.buildProcedurePreviewPlan(
      this.calculator,
      airport,
      this.procType,
      procIndex,
      transIndex,
      this.store.getOneWayRunway(airport, procedure, rwyTransIndex),
      rwyTransIndex
    );

    if (opId === this.buildSequenceOpId) {
      this.store.previewPlan.set(plan);
      plan.getSegment(0).legs.forEach((l) => {
        legs.push(Subject.create(l));
      });
      this.store.sequence.set(legs);
      return true;
    } else {
      return false;
    }
  }

  /** Callback handler for when load is pressed. */
  public onLoadSelected = (): void => {
    this.onLoadExecute();
  };

  /** Called when the load procedure button is clicked. */
  public abstract onLoadExecute: () => void;
}