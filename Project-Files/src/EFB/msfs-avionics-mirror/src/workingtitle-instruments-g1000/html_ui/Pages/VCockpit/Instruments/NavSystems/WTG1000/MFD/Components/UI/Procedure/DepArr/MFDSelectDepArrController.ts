import { Subject } from 'msfssdk';
import { FlightPathCalculator, FlightPlan } from 'msfssdk/flightplan';
import { AirportFacility, ArrivalProcedure, DepartureProcedure, EnrouteTransition, RunwayTransition } from 'msfssdk/navigation';
import { Fms, ProcedureType } from 'garminsdk/flightplan';
import { FlightPlanFocus } from '../../../../../Shared/UI/FPL/FPLTypesAndProps';
import { SelectDepArrController } from '../../../../../Shared/UI/Procedure/DepArr/SelectDepArrController';
import { SelectDepArrStore } from '../../../../../Shared/UI/Procedure/DepArr/SelectDepArrStore';
import { SelectControl } from '../../../../../Shared/UI/UiControls2/SelectControl';

/**
 * A data store for MFD departure/arrival selection components.
 */
export interface MFDSelectDepArrStore<T extends DepartureProcedure | ArrivalProcedure> extends SelectDepArrStore<T> {
  /** A subject which provides the transition preview flight plan. */
  transitionPreviewPlan: Subject<FlightPlan | null>;
}

/**
 * A controller for MFD departure/arrival selection components.
 */
export abstract class MFDSelectDepArrController<T extends DepartureProcedure | ArrivalProcedure, S extends MFDSelectDepArrStore<T> = MFDSelectDepArrStore<T>>
  extends SelectDepArrController<T, S> {

  /**
   * Constructor.
   * @param store A data store.
   * @param selectNextCb Callback when the next control should be focused.
   * @param fms The FMS instance.
   * @param calculator The flight path calculator used by this controller to build preview flight plans.
   * @param procedurePlan A subject to provide the procedure preview flight plan.
   * @param transitionPlan A subject to provide the procedure transition preview flight plan.
   * @param focus A subject to provide the flight plan focus for the selected approach.
   * @param procType The procedure type for this controller.
   */
  constructor(
    store: S,
    selectNextCb: () => void,
    fms: Fms,
    calculator: FlightPathCalculator,
    protected readonly procedurePlan: Subject<FlightPlan | null>,
    protected readonly transitionPlan: Subject<FlightPlan | null>,
    protected readonly focus: Subject<FlightPlanFocus>,
    procType: ProcedureType.DEPARTURE | ProcedureType.ARRIVAL
  ) {
    super(store, selectNextCb, fms, calculator, procType);

    store.previewPlan.sub(plan => { procedurePlan.set(plan); }, true);
    store.transitionPreviewPlan.sub(plan => { transitionPlan.set(plan); }, true);
    store.sequence.sub(this.onSequenceChanged.bind(this));
  }

  /**
   * Refreshes the procedure and transition preview plan subjects.
   */
  public refreshPreviewPlans(): void {
    this.procedurePlan.set(this.store.previewPlan.get());
    this.transitionPlan.set(this.store.transitionPreviewPlan.get());
    this.onSequenceChanged();
  }

  /** @inheritdoc */
  protected async onProcSelectionClosed(source: SelectControl<T>, selectionMade: boolean): Promise<void> {
    await super.onProcSelectionClosed(source, selectionMade);

    if (!selectionMade) {
      await this.buildTransitionPreviewPlan(this.store.selectedFacility.get(), this.store.selectedProcIndex.get(), this.store.selectedRwyTransIndex.get());
    }
  }

  /** @inheritdoc */
  protected async onRwyTransSelectionClosed(source: SelectControl<RunwayTransition>, selectionMade: boolean): Promise<void> {
    await super.onRwyTransSelectionClosed(source, selectionMade);

    if (!selectionMade) {
      await this.buildTransitionPreviewPlan(this.store.selectedFacility.get(), this.store.selectedProcIndex.get(), this.store.selectedRwyTransIndex.get());
    }
  }

  /** @inheritdoc */
  protected onProcSelected(index: number, item: T, isRefresh: boolean): void {
    super.onProcSelected(index, item, isRefresh);
    this.store.transitionPreviewPlan.set(null);
  }

  /** @inheritdoc */
  protected async onProcFocused(departure: T): Promise<void> {
    await super.onProcFocused(departure);

    const procIndex = this.store.procedures.getArray().indexOf(departure);
    await this.buildTransitionPreviewPlan(this.store.selectedFacility.get(), procIndex, 0);
  }

  /** @inheritdoc */
  protected async onRunwaySelected(index: number, item: RunwayTransition, isRefresh: boolean): Promise<void> {
    await super.onRunwaySelected(index, item, isRefresh);
    this.store.transitionPreviewPlan.set(null);
  }

  /** @inheritdoc */
  protected async onRunwayFocused(trans: RunwayTransition): Promise<void> {
    await super.onRunwayFocused(trans);

    const rwyTransIndex = this.store.runways.getArray().indexOf(trans);
    await this.buildTransitionPreviewPlan(this.store.selectedFacility.get(), this.store.selectedProcIndex.get(), rwyTransIndex);
  }

  /** @inheritdoc */
  protected async onTransSelected(index: number, item: EnrouteTransition, isRefresh: boolean): Promise<void> {
    await super.onTransSelected(index, item, isRefresh);
    this.store.transitionPreviewPlan.set(null);
  }

  /** @inheritdoc */
  protected async onTransFocused(trans: EnrouteTransition): Promise<void> {
    await super.onTransFocused(trans);

    if (!this.store.transitionPreviewPlan.get()) {
      await this.buildTransitionPreviewPlan(this.store.selectedFacility.get(), this.store.selectedProcIndex.get(), this.store.selectedRwyTransIndex.get());
    }
  }

  /**
   * Responds to changes in the selected approach leg sequence.
   */
  private onSequenceChanged(): void {
    const sequence = this.store.sequence.getArray();
    this.focus.set(sequence.length > 0 ? sequence.map(sub => sub.get()) : null);
  }

  private transitionPreviewOpId = 0;

  /**
   * Updates the transition preview plan.
   * @param airport The airport of the procedure for which to preview transitions.
   * @param procIndex The index of the procedure for which to preview transitions.
   * @param rwyTransIndex The index of the runway transition of the procedure for which to preview transitions.
   */
  private async buildTransitionPreviewPlan(airport: AirportFacility | undefined, procIndex: number, rwyTransIndex: number): Promise<void> {
    if (airport) {
      const opId = ++this.transitionPreviewOpId;
      const plan = await this.fms.buildProcedureTransitionPreviewPlan(this.calculator, airport, this.procType, procIndex, rwyTransIndex);
      if (opId === this.transitionPreviewOpId) {
        this.store.transitionPreviewPlan.set(plan.length > 0 ? plan : null);
      }
    } else {
      this.store.transitionPreviewPlan.set(null);
    }
  }
}