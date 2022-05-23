import { BitFlags, FSComponent, MagVar, NavMath, Subject, UnitType, VNode } from 'msfssdk';
import { AirportFacility, Facility, FacilityType, ICAO, LegType } from 'msfssdk/navigation';
import { FlightPathCalculator, FlightPlan, LegDefinition, LegDefinitionFlags } from 'msfssdk/flightplan';

import { ApproachListItem, SelectApproachStore } from './SelectApproachStore';
import { MessageDialogDefinition } from '../../Dialogs/MessageDialog';
import { ViewService } from '../../ViewService';
import { SelectControl } from '../../UiControls2/SelectControl';
import { G1000ControlEvents } from '../../../G1000Events';
import { ControlEvents, EventBus } from 'msfssdk/data';
import { Fms, FmsUtils, ProcedureType, TransitionListItem } from 'garminsdk/flightplan';

/**
 * Controller for SelectApproach component.
 */
export class SelectApproachController<S extends SelectApproachStore = SelectApproachStore> {
  public readonly facilityChangedHandler = this.onFacilityChanged.bind(this);
  public readonly approachSelectedHandler = this.onApproachSelected.bind(this);
  public readonly approachFocusedHandler = this.onApproachFocused.bind(this);
  public readonly transSelectedHandler = this.onTransSelected.bind(this);
  public readonly transFocusedHandler = this.onTransFocused.bind(this);
  public readonly approachSelectionClosedHandler = this.onApproachSelectionClosed.bind(this);
  public readonly transSelectionClosedHandler = this.onTransSelectionClosed.bind(this);

  public readonly inputIcao = Subject.create('');
  public readonly canLoad = Subject.create(false);
  public readonly canActivate = Subject.create(false);
  public readonly canLoadOrText = this.canLoad.map(canLoad => canLoad ? 'OR' : '');

  protected skipCourseReversal = false;
  protected readonly controlPub = this.bus.getPublisher<ControlEvents>();
  protected readonly g1000ControlPub = this.bus.getPublisher<G1000ControlEvents>();


  /**
   * A callback called after a facility is completed loading.
   */
  public onAfterFacilityLoad: (() => void) | undefined;

  /**
   * Creates an instance of select approach controller.
   * @param bus The Event Bus.
   * @param store The store.
   * @param selectNextCb Callback when the next control should be focused.
   * @param fms Instance of FMS.
   * @param calculator The flight path calculator used by this controller to build preview flight plans.
   * @param viewService The view service used by this controller.
   * @param fplKey The FPL ViewService Key.
   * @param hasSequence If this instance of the controller should support a sequence display.
   */
  constructor(
    protected readonly bus: EventBus,
    protected readonly store: S,
    protected readonly selectNextCb: () => void,
    protected readonly fms: Fms,
    protected readonly calculator: FlightPathCalculator,
    protected readonly viewService: ViewService,
    protected readonly fplKey: string,
    protected readonly hasSequence = false
  ) {
  }

  /** Initialize the controller. */
  public initialize(): void {
    const initIcao = this.getInitialICAO() ?? '';
    this.inputIcao.set(initIcao);

    if (initIcao !== '') {
      setTimeout(() => {
        this.gotoNextSelect(false);
      }, 100);
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

  /**
   * Responds to when the waypoint input's selected facility changes.
   * @param facility The selected facility.
   */
  private onFacilityChanged(facility: Facility | undefined): void {
    this.store.selectedFacility.set(facility as AirportFacility);
    if (facility !== undefined) {
      this.skipCourseReversal = false;
    }

    this.onAfterFacilityLoad && this.onAfterFacilityLoad();
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
   * Callback handler for when a minimums option is selected.
   * @param index The index of the option selected.
   */
  public onMinimumsOptionSelected = (index: number): void => {
    this.store.minimumsMode.set(index);
    this.g1000ControlPub.pub('show_minimums', index === 1, true);
  };

  /** Callback handler for  when a minimums value is selected. */
  public updateMinimumsValue = (): void => {
    const raw = this.store.minimumsSubject.get();
    const converted = this.store.minimumsUnit.getRaw() == UnitType.METER ? UnitType.FOOT.convertFrom(raw, UnitType.METER) : raw;
    this.controlPub.pub('set_decision_altitude', converted, true, true);
  };

  /**
   * Handles when the approach selection dialog is closed.
   * @param source The SelectControl controlling the dialog that was closed.
   * @param selectionMade Whether a selection was made.
   */
  protected async onApproachSelectionClosed(source: SelectControl<ApproachListItem>, selectionMade: boolean): Promise<void> {
    if (!selectionMade) {
      await this.buildSequence(this.store.selectedFacility.get(), this.store.selectedProcedure.get(), this.store.selectedTransition.get());
    }
  }

  /**
   * Handles when the transition selection dialog is closed.
   * @param source The SelectControl controlling the dialog that was closed.
   * @param selectionMade Whether a selection was made.
   */
  protected async onTransSelectionClosed(source: SelectControl<TransitionListItem>, selectionMade: boolean): Promise<void> {
    if (!selectionMade) {
      await this.buildSequence(this.store.selectedFacility.get(), this.store.selectedProcedure.get(), this.store.selectedTransition.get());
    }
  }

  /**
   * Responds to when an approach is selected.
   * @param index The index of the procedure selected.
   * @param item The item selected.
   * @param isRefresh If select event happened based on a data refresh.
   */
  protected onApproachSelected(index: number, item: ApproachListItem, isRefresh: boolean): void {
    this.store.selectedProcedure.set(item);
    const validApproachSelected = !!item;
    this.canActivate.set(validApproachSelected);
    this.canLoad.set(validApproachSelected && this.fms.canApproachLoad());
    this.gotoNextSelect(isRefresh);
  }

  /**
   * Responds to when an approach item is focused.
   * @param item The focused item.
   */
  protected async onApproachFocused(item: ApproachListItem): Promise<void> {
    await this.buildSequence(this.store.selectedFacility.get(), item, item === this.store.selectedProcedure.get() ? this.store.selectedTransition.get() : undefined);
  }

  /**
   * Responds to when a transition is selected.
   * @param index The index of the transition selected.
   * @param item The item selected.
   * @param isRefresh If select event happened based on a data refresh.
   */
  protected async onTransSelected(index: number, item: TransitionListItem, isRefresh: boolean): Promise<void> {
    this.store.selectedTransition.set(item);
    const isPreviewBuilt = await this.buildSequence(this.store.selectedFacility.get(), this.store.selectedProcedure.get(), item);

    if (!isPreviewBuilt) {
      return;
    }

    this.skipCourseReversal = false;

    if (this.checkForCourseReversal()) {
      const icao = this.store.sequence.tryGet(1)?.get().leg.fixIcao;
      this.viewService.open('MessageDialog', true).setInput(this.getCourseReversalDialogDef(ICAO.getIdent(icao ?? ''))).onAccept.on((sender, accept) => {
        this.skipCourseReversal = !accept;
        if (this.skipCourseReversal) {
          this.store.sequence.removeAt(1);
          this.removeCourseReversalFromPreviewPlan();
        }
        this.gotoNextSelect(isRefresh);
      });
    } else {
      this.gotoNextSelect(isRefresh);
    }
  }

  /**
   * Removes a course reversal from the preview plan.
   */
  protected async removeCourseReversalFromPreviewPlan(): Promise<void> {
    const previewPlan = this.store.previewPlan.get();
    if (previewPlan) {
      previewPlan.removeLeg(0, 1);
      await previewPlan.calculate();

      // Prevent race condition if the preview plan was updated while the old one was calculating
      if (this.store.previewPlan.get() === previewPlan) {
        this.store.previewPlan.notify();
      }
    }
  }

  /**
   * Responds to when a transition item is focused.
   * @param item The focused item.
   */
  protected async onTransFocused(item: TransitionListItem): Promise<void> {
    await this.buildSequence(this.store.selectedFacility.get(), this.store.selectedProcedure.get(), item);
  }

  protected buildSequenceOpId = 0;

  /**
   * Builds the sequence list and flight plan for the approach preview.
   * @param airport The airport of the approach to preview.
   * @param approach The approach to preview.
   * @param transition The transition of the approach preview.
   * @returns A Promise which is fulfilled with whether a preview sequence was successfully built.
   */
  protected async buildSequence(airport?: AirportFacility, approach?: ApproachListItem, transition?: TransitionListItem): Promise<boolean> {
    if (!airport || !approach) {
      this.store.previewPlan.set(null);
      this.store.sequence.clear();
      return false;
    }

    const opId = ++this.buildSequenceOpId;

    const legs: Subject<LegDefinition>[] = [];

    let plan: FlightPlan | undefined = undefined;
    if (approach.isVisualApproach) {
      plan = await this.fms.buildProcedurePreviewPlan(
        this.calculator, airport, ProcedureType.VISUALAPPROACH, -1, -1, undefined, undefined, approach.approach.runwayNumber, approach.approach.runwayDesignator
      );
    } else {
      const transIndex = transition?.transitionIndex ?? -1;
      const legOffset = transition?.startIndex ?? 0;
      plan = await this.fms.buildProcedurePreviewPlan(
        this.calculator,
        airport,
        ProcedureType.APPROACH,
        approach.index,
        transIndex,
        undefined,
        undefined,
        undefined,
        legOffset !== undefined ? legOffset : 0
      );
    }

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
  public onLoadExecuted = (): void => {
    const selectedFacility = this.store.selectedFacility.get();
    const approach = this.store.selectedProcedure.get();
    const transition = this.store.selectedTransition.get();
    if (selectedFacility && approach && transition) {
      const transIndex = transition.transitionIndex;
      const legOffset = transition.startIndex;
      this.handleExecute(false, selectedFacility, approach, transIndex, legOffset);
    }
  };

  /** Callback handler for when activate is pressed. */
  public onActivateExecuted = (): void => {
    const selectedFacility = this.store.selectedFacility.get();
    const approach = this.store.selectedProcedure.get();
    const transition = this.store.selectedTransition.get();
    if (selectedFacility && approach && transition) {
      const transIndex = transition.transitionIndex;
      const legOffset = transition.startIndex;
      this.handleExecute(true, selectedFacility, approach, transIndex, legOffset);
    }
  };

  /**
   * Checks for a course reversal in the procedure.
   * @returns true if there is an optional course reversal.
   */
  private checkForCourseReversal(): boolean {
    const legs = this.store.sequence.getArray();
    if (legs && legs.length > 0) {
      const leg = legs[1].get();
      switch (leg.leg.type) {
        case LegType.HA:
        case LegType.HF:
        case LegType.HM: {
          if (leg.calculated && leg.calculated.endLat && leg.calculated.endLon) {
            const ppos = this.fms.ppos;
            if (Math.abs(NavMath.diffAngle(MagVar.trueToMagnetic(ppos.bearingTo(leg.calculated.endLat, leg.calculated.endLon), ppos.lat, ppos.lon), leg.leg.course)) > 90) {
              return false;
            }
          }
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Handles loading and executing the approach with appropriate warning messages.
   * @param activate Whether or not to activate this approach.
   * @param facility The facility for the approach.
   * @param approach The Approach List Item to execute with.
   * @param approachTransitionIndex The transition index for the approach procedure.
   * @param transStartIndex The transition start index, if specified.
   */
  private handleExecute(
    activate: boolean,
    facility: AirportFacility,
    approach: ApproachListItem,
    approachTransitionIndex: number,
    transStartIndex?: number
  ): void {
    const trueApproachIndex = approach.index;

    if (!approach.isVisualApproach) {
      const procedure = approach.approach;

      if (!FmsUtils.isGpsApproach(procedure)) {
        const input: MessageDialogDefinition = {
          renderContent: (): VNode => this.renderProcedureWarningDialogContent('GPS guidance is for monitoring only. Load approach?', '- NOT APPROVED FOR GPS -'),
          confirmButtonText: 'YES',
          hasRejectButton: true,
          rejectButtonText: 'NO'
        };
        this.viewService.open('MessageDialog', true).setInput(input).onAccept.on((sender, accept) => {
          if (accept) {
            this.insertAndActivateApproach(activate, facility, trueApproachIndex, approachTransitionIndex, undefined, undefined, transStartIndex, this.skipCourseReversal);
            this.viewService.open(this.fplKey);
          }
        });
      } else {
        this.insertAndActivateApproach(activate, facility, trueApproachIndex, approachTransitionIndex, undefined, undefined, transStartIndex, this.skipCourseReversal);
        this.viewService.open(this.fplKey);
      }


    } else {
      const runwayNumber = approach.approach.runwayNumber;
      const runwayDesignator = approach.approach.runwayDesignator;

      this.viewService.open('MessageDialog', true).setInput({ inputString: 'Obstacle clearance is not provided for visual approaches', hasRejectButton: true })
        .onAccept.on((sender, accept) => {
          if (accept) {
            this.insertAndActivateApproach(activate, facility, -1, approachTransitionIndex, runwayNumber, runwayDesignator);
            this.viewService.open(this.fplKey);
          }
        });
    }
  }

  /**
   * Inserts and optionally activates an approach.
   * @param activate Whether to activate the approach after inserting it.
   * @param airport The approach's parent airport facility.
   * @param approachIndex The index of the approach.
   * @param transitionIndex The index of the approach transition.
   * @param visualRunwayNumber The number of the runway for a visual approach.
   * @param visualRunwayDesignator The designator of the runway for a visual approach.
   * @param transStartIndex The index of the start of the approach transition within the transition leg array. Defaults to 0.
   * @param skipCourseReversal Whether to skip the course reversal at the beginning of the approach, if one exists.
   * Defaults to false.
   */
  private async insertAndActivateApproach(
    activate: boolean,
    airport: AirportFacility,
    approachIndex: number,
    transitionIndex: number,
    visualRunwayNumber?: number,
    visualRunwayDesignator?: RunwayDesignator,
    transStartIndex?: number,
    skipCourseReversal?: boolean
  ): Promise<void> {
    const success = await this.fms.insertApproach(
      airport,
      approachIndex,
      transitionIndex,
      visualRunwayNumber,
      visualRunwayDesignator,
      transStartIndex,
      skipCourseReversal,
      activate
    );

    if (success && activate) {
      if (transitionIndex < 0) {
        await this.fms.activateVtf();
      } else {
        this.fms.activateApproach();
      }
    }
  }

  /**
   * Gets the MenuDialogDefinition for a course reversal dialog message.
   * @param fixName The name of the fix where the course reversal is.
   * @returns A MessageDialogDefinition.
   */
  private getCourseReversalDialogDef(fixName: string): MessageDialogDefinition {
    return { inputString: `Fly Course Reversal at ${fixName}?`, confirmButtonText: 'YES', hasRejectButton: true, rejectButtonText: 'NO' };
  }

  /**
   * Renders the procedure warning vnode (when we need to pass HTML).
   * @param warningMessage The dialog message content.
   * @param warningTitle The dialog message title content.
   * @returns A VNode to be rendered in the MessageDialog.
   */
  private renderProcedureWarningDialogContent = (warningMessage: string, warningTitle?: string): VNode => {
    return (
      <div>
        {warningTitle}<p />{warningMessage}
      </div>
    );
  };
}