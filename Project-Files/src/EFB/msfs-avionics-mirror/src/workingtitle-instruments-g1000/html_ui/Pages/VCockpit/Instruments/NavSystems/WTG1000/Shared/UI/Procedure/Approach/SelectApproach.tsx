import { FSComponent, NodeReference, Subject, UnitType, VNode } from 'msfssdk';
import { ControlEvents, EventBus } from 'msfssdk/data';
import { AdditionalApproachType, AirportFacility, ApproachProcedure, ExtendedApproachType, FacilitySearchType } from 'msfssdk/navigation';
import { FlightPathCalculator } from 'msfssdk/flightplan';
import { SortedMappedSubscribableArray } from 'msfssdk/utils/datastructures';

import { G1000ControlEvents } from '../../../G1000Events';
import { Fms, TransitionListItem } from 'garminsdk/flightplan';
import { SelectApproachController } from './SelectApproachController';
import { ApproachListItem, SelectApproachStore } from './SelectApproachStore';
import { FmsHEvent } from '../../FmsHEvent';
import { NumberInput } from '../../UIControls/NumberInput';
import { WaypointInput } from '../../UIControls/WaypointInput';
import { ApproachNameDisplay } from '../../FPL/ApproachNameDisplay';
import { UiControlGroup, UiControlGroupProps } from '../../UiControlGroup';
import { ViewService } from '../../ViewService';
import { GenericControl } from '../../UIControls/GenericControl';
import { SelectControl } from '../../UiControls2/SelectControl';
import { ContextMenuDialog, ContextMenuItemDefinition, ContextMenuPosition } from '../../Dialogs/ContextMenuDialog';
import { FocusPosition } from 'msfssdk/components/controls';
import { DHEvents } from 'msfssdk/instruments';
import { UnitsUserSettingManager } from '../../../Units/UnitsUserSettings';

/**
 * Component props for SelectApproach.
 */
export interface SelectApproachProps extends UiControlGroupProps {
  /** A view service. */
  viewService: ViewService;

  /** The fms */
  fms: Fms;

  /** The event bus */
  bus: EventBus;

  /** A flight path calculator to use to build preview flight plans. */
  calculator: FlightPathCalculator;

  /** A units settings manager, for DA units. */
  unitsSettingManager: UnitsUserSettingManager
}

/**
 * A component for selecting approaches.
 */
export abstract class SelectApproach<P extends SelectApproachProps = SelectApproachProps> extends UiControlGroup<P>{
  protected static readonly APPROACH_TYPE_PRIORITIES: Record<ExtendedApproachType, number> = {
    [ApproachType.APPROACH_TYPE_ILS]: 0,
    [ApproachType.APPROACH_TYPE_LOCALIZER]: 1,
    [ApproachType.APPROACH_TYPE_LOCALIZER_BACK_COURSE]: 2,
    [ApproachType.APPROACH_TYPE_LDA]: 3,
    [ApproachType.APPROACH_TYPE_SDF]: 4,
    [ApproachType.APPROACH_TYPE_RNAV]: 5,
    [ApproachType.APPROACH_TYPE_GPS]: 6,
    [ApproachType.APPROACH_TYPE_VORDME]: 7,
    [ApproachType.APPROACH_TYPE_VOR]: 8,
    [ApproachType.APPROACH_TYPE_NDBDME]: 9,
    [ApproachType.APPROACH_TYPE_NDB]: 10,
    [AdditionalApproachType.APPROACH_TYPE_VISUAL]: 11,
    [ApproachType.APPROACH_TYPE_UNKNOWN]: 12
  };
  protected static readonly APPROACH_RUNWAY_DESIGNATOR_PRIORITIES_FWD: Record<RunwayDesignator, number> = {
    [RunwayDesignator.RUNWAY_DESIGNATOR_NONE]: 0,
    [RunwayDesignator.RUNWAY_DESIGNATOR_CENTER]: 1,
    [RunwayDesignator.RUNWAY_DESIGNATOR_LEFT]: 2,
    [RunwayDesignator.RUNWAY_DESIGNATOR_RIGHT]: 3,
    [RunwayDesignator.RUNWAY_DESIGNATOR_WATER]: 4,
    [RunwayDesignator.RUNWAY_DESIGNATOR_B]: 5,
    [RunwayDesignator.RUNWAY_DESIGNATOR_A]: 6,
  };
  protected static readonly APPROACH_RUNWAY_DESIGNATOR_PRIORITIES_REV: Record<RunwayDesignator, number> = {
    [RunwayDesignator.RUNWAY_DESIGNATOR_NONE]: 0,
    [RunwayDesignator.RUNWAY_DESIGNATOR_CENTER]: 1,
    [RunwayDesignator.RUNWAY_DESIGNATOR_LEFT]: 3,
    [RunwayDesignator.RUNWAY_DESIGNATOR_RIGHT]: 2,
    [RunwayDesignator.RUNWAY_DESIGNATOR_WATER]: 4,
    [RunwayDesignator.RUNWAY_DESIGNATOR_B]: 5,
    [RunwayDesignator.RUNWAY_DESIGNATOR_A]: 6,
  };

  protected readonly approachSelectRef = FSComponent.createRef<SelectControl<ApproachListItem>>();
  protected readonly transitionSelectRef = FSComponent.createRef<SelectControl<TransitionListItem>>();

  protected readonly store = this.createStore();
  protected readonly controller = this.createController(this.store);

  protected readonly sortedApproachSub = SortedMappedSubscribableArray.create(this.store.procedures, this.sortApproaches.bind(this));
  protected readonly controlPub = this.props.bus.getPublisher<ControlEvents>();

  /**
   * Creates an instance of an approach selection component data store.
   * @returns An approach selection component data store.
   */
  protected abstract createStore(): SelectApproachStore;

  /**
   * Creates an instance of an approach selection component controller.
   * @param store This component's data store.
   * @returns An approach selection component controller.
   */
  protected abstract createController(store: SelectApproachStore): SelectApproachController;

  /** @inheritdoc */
  public onInteractionEvent(evt: FmsHEvent): boolean {
    switch (evt) {
      case FmsHEvent.CLR:
        this.controller.inputIcao.set('');
        //this.close();
        return true;
    }

    return false;
  }

  /** Goto and activate next select control. */
  protected gotoNextSelect(): void {
    this.scrollController.gotoNext();
    setTimeout(() => {
      const focusedCtrl = this.scrollController.getFocusedUiControl();
      if (focusedCtrl instanceof GenericControl) {
        if (((focusedCtrl.props.children as unknown as VNode[])[0].instance as SelectControl<any>).menuItems.length > 1) {
          focusedCtrl.onUpperKnobInc();
        } else {
          this.gotoNextSelect();
        }
      }
    }, 50);
  }

  /** @inheritdoc */
  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    const g1000Events = this.props.bus.getSubscriber<G1000ControlEvents>();


    g1000Events.on('show_minimums').handle((mode) => {
      const option = mode ? 1 : 0;
      this.store.minimumsMode.set(option);
    });

    this.props.unitsSettingManager.altitudeUnits.sub(u => {
      const oldUnit = this.store.minimumsUnit.getRaw();
      this.store.minimumsUnit.set(u);
      if (u !== oldUnit) {
        switch (u) {
          case UnitType.FOOT:
            this.store.minimumsSubject.set(Math.round(this.store.currentMinFeet.get()));
            this.controlPub.pub('set_da_distance_unit', 'feet');
            break;
          case UnitType.METER:
            this.store.minimumsSubject.set(Math.round(UnitType.METER.convertFrom(this.store.currentMinFeet.get(), UnitType.FOOT)));
            this.controlPub.pub('set_da_distance_unit', 'meters');
            break;
          default:
            console.warn('Unknown altitude unit handled in Select Approach Controller: ' + u.name);
        }
      }
    });

    this.store.minimumsUnit.set(this.props.unitsSettingManager.altitudeUnits.get());

    this.store.currentMinFeet.sub(v => {
      if (this.store.minimumsUnit.getRaw() === UnitType.FOOT) {
        this.store.minimumsSubject.set(Math.round(v));
      } else {
        this.store.minimumsSubject.set(Math.round(UnitType.METER.convertFrom(v, UnitType.FOOT)));
      }
    });

    this.props.bus.getSubscriber<DHEvents>().on('decision_altitude').handle((set) => {
      this.store.currentMinFeet.set(set);
    });
  }

  /**
   * Sorts approaches into the order they should appear in the approach list.
   * @param a An approach list item.
   * @param b An approach list item.
   * @returns 0 if the two approaches are to be sorted identically, a negative number if approach `a` is to be sorted
   * before `b`, or a positive number if approach `a` is to be sorted after `b`.
   */
  protected sortApproaches(a: ApproachListItem, b: ApproachListItem): number {
    // sort first by approach type (ILS, LOC, RNAV, etc)
    let compare = SelectApproach.APPROACH_TYPE_PRIORITIES[a.approach.approachType] - SelectApproach.APPROACH_TYPE_PRIORITIES[b.approach.approachType];
    if (compare === 0) {
      // then sort by runway (circling approaches go last)
      compare = (a.approach.runwayNumber === 0 ? 37 : a.approach.runwayNumber) - (b.approach.runwayNumber === 0 ? 37 : b.approach.runwayNumber);
      if (compare === 0) {
        // then sort by L, C, R (order depends on if runway number is <= 18)
        const priorities = a.approach.runwayNumber <= 18
          ? SelectApproach.APPROACH_RUNWAY_DESIGNATOR_PRIORITIES_FWD
          : SelectApproach.APPROACH_RUNWAY_DESIGNATOR_PRIORITIES_REV;
        compare = priorities[a.approach.runwayDesignator] - priorities[b.approach.runwayDesignator];
        if (compare === 0) {
          // finally sort by approach suffix
          compare = a.approach.approachSuffix.localeCompare(b.approach.approachSuffix);
        }
      }
    }

    return compare;
  }

  /**
   * A callback which is called when enter is pressed on certain controls.
   * @returns Whether or not the control handled the event. Always true here.
   */
  protected onEnterPressedAdvance(): boolean {
    this.gotoNextSelect();
    return true;
  }

  /**
   * Sets the facility and approach input data for the select approach pane.
   * @param facility The facility to set.
   * @param approach The approach to set.
   */
  public setFacilityAndApproach(facility: AirportFacility, approach: ApproachProcedure): void {
    this.controller.onAfterFacilityLoad = (): void => {
      this.gotoNextSelect();

      const index = this.sortedApproachSub.getArray().findIndex(x => x.approach.name === approach.name);
      this.approachSelectRef.instance.selectedIndex.set(index);
      this.approachSelectRef.instance.props.onItemSelected(index, this.approachSelectRef.instance.props.data.get(index), false);

      this.controller.onAfterFacilityLoad = undefined;
    };

    const currentAirport = this.store.selectedFacility.get();
    if (currentAirport?.icao !== facility.icao) {
      this.controller.inputIcao.set(facility.icao);
    } else {
      this.controller.onAfterFacilityLoad();
    }
  }

  /**
   * Initializes the default approach selection page display.
   */
  public initDefaults(): void {
    this.controller.initialize();
  }

  /**
   * Builds a approach procedure menu item.
   * @param proc The approach procedure.
   * @returns A menu item definition.
   */
  protected buildApprMenuItem(proc: ApproachListItem): ContextMenuItemDefinition {
    return {
      renderContent: (): VNode => (
        <ApproachNameDisplay approach={Subject.create(proc.approach)} />
      ),
      estimatedWidth: proc.approach.name.length * ContextMenuDialog.CHAR_WIDTH,
      onFocused: this.controller.approachFocusedHandler.bind(this.controller, proc)
    };
  }

  /**
   * Builds a transition menu item.
   * @param trans The transition.
   * @returns A menu item definition.
   */
  protected buildTransMenuItem(trans: TransitionListItem): ContextMenuItemDefinition {
    return {
      renderContent: (): VNode => <span>{trans.name}</span>,
      estimatedWidth: trans.name.length * ContextMenuDialog.CHAR_WIDTH,
      onFocused: this.controller.transFocusedHandler.bind(this.controller, trans)
    };
  }

  /**
   * Renders the waypoint input component.
   * @returns The rendered waypoint input component, as a VNode.
   */
  protected renderWaypointInput(): VNode {
    return (
      <WaypointInput
        bus={this.props.bus}
        viewService={this.props.viewService}
        onRegister={this.register} onInputEnterPressed={this.gotoNextSelect.bind(this)} selectedIcao={this.controller.inputIcao}
        onFacilityChanged={this.controller.facilityChangedHandler} filter={FacilitySearchType.Airport}
      />
    );
  }

  /**
   * Renders the approach select control component.
   * @param container A reference to the container that constrains the position of the select control pop-up.
   * @param dialogPosition The position of the pop-up context menu dialog spawned by the select control.
   * @returns The rendered approach select control component, as a VNode.
   */
  protected renderApproachSelectControl(container: NodeReference<HTMLElement>, dialogPosition?: ContextMenuPosition): VNode {
    return (
      <GenericControl
        onRegister={this.register}
        onFocused={(): void => { this.approachSelectRef.instance.focus(FocusPosition.First); }}
        onBlurred={(): void => { this.approachSelectRef.instance.blur(); }}
        onUpperKnobInc={(): void => { this.approachSelectRef.instance.onInteractionEvent(FmsHEvent.UPPER_INC); }}
        onUpperKnobDec={(): void => { this.approachSelectRef.instance.onInteractionEvent(FmsHEvent.UPPER_DEC); }}
        class='slct-appr-value'
      >
        <SelectControl<ApproachListItem>
          ref={this.approachSelectRef}
          viewService={this.props.viewService}
          outerContainer={container}
          data={this.sortedApproachSub} onItemSelected={this.controller.approachSelectedHandler} buildMenuItem={this.buildApprMenuItem.bind(this)}
          dialogPosition={dialogPosition}
          onSelectionDialogClosed={this.controller.approachSelectionClosedHandler}
        />
      </GenericControl>
    );
  }

  /**
   * Renders the transition select control component.
   * @param container A reference to the container that constrains the position of the select control pop-up.
   * @param dialogPosition The position of the pop-up context menu dialog spawned by the select control.
   * @returns The rendered transition select control component, as a VNode.
   */
  protected renderTransitionSelectControl(container: NodeReference<HTMLElement>, dialogPosition?: ContextMenuPosition): VNode {
    return (
      <GenericControl
        onRegister={this.register}
        onFocused={(): void => { this.transitionSelectRef.instance.focus(FocusPosition.First); }}
        onBlurred={(): void => { this.transitionSelectRef.instance.blur(); }}
        onUpperKnobInc={(): void => { this.transitionSelectRef.instance.onInteractionEvent(FmsHEvent.UPPER_INC); }}
        onUpperKnobDec={(): void => { this.transitionSelectRef.instance.onInteractionEvent(FmsHEvent.UPPER_DEC); }}
        class='slct-appr-trans-value'
      >
        <SelectControl<TransitionListItem>
          ref={this.transitionSelectRef}
          viewService={this.props.viewService}
          outerContainer={container}
          data={this.store.transitions} onItemSelected={this.controller.transSelectedHandler} buildMenuItem={this.buildTransMenuItem.bind(this)}
          dialogPosition={dialogPosition}
          onSelectionDialogClosed={this.controller.transSelectionClosedHandler}
        />
      </GenericControl>
    );
  }

  /**
   * Renders the minimums number input component.
   * @param cssClass CSS class(es) to apply to the number input component.
   * @returns The minimums number input component, as a VNode.
   */
  protected renderMinimumsNumberInput(cssClass?: string): VNode {
    return (
      <NumberInput
        onRegister={this.register} quantize={true} onValueChanged={this.controller.updateMinimumsValue} dataSubject={this.store.minimumsSubject}
        minValue={0} maxValue={16000} increment={10} wrap={false} defaultDisplayValue={'_ _ _ _ _'} onEnter={this.onEnterPressedAdvance.bind(this)}
        class={cssClass}
      />
    );
  }
}