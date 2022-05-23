import { FSComponent, NodeReference, VNode } from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import { FlightPathCalculator } from 'msfssdk/flightplan';
import { ArrivalProcedure, DepartureProcedure, EnrouteTransition, FacilitySearchType, RunwayTransition } from 'msfssdk/navigation';
import { Fms } from 'garminsdk/flightplan';
import { FocusPosition } from 'msfssdk/components/controls';
import { ContextMenuDialog, ContextMenuItemDefinition, ContextMenuPosition } from '../../Dialogs/ContextMenuDialog';
import { FmsHEvent } from '../../FmsHEvent';
import { UiControlGroup, UiControlGroupProps } from '../../UiControlGroup';
import { GenericControl } from '../../UIControls/GenericControl';
import { WaypointInput } from '../../UIControls/WaypointInput';
import { SelectControl } from '../../UiControls2/SelectControl';
import { ViewService } from '../../ViewService';
import { SelectDepArrController } from './SelectDepArrController';
import { SelectDepArrStore } from './SelectDepArrStore';

/**
 * Component props for SelectDepArr.
 */
export interface SelectDepArrProps extends UiControlGroupProps {
  /** A view service. */
  viewService: ViewService;

  /** The fms */
  fms: Fms;

  /** The event bus */
  bus: EventBus;

  /** A flight path calculator to use to build preview flight plans. */
  calculator: FlightPathCalculator;
}

/**
 * A component for selecting departures/arrivals.
 */
export abstract class SelectDepArr<T extends DepartureProcedure | ArrivalProcedure, P extends SelectDepArrProps = SelectDepArrProps> extends UiControlGroup<P>{
  protected readonly procSelectRef = FSComponent.createRef<SelectControl<T>>();
  protected readonly transSelectRef = FSComponent.createRef<SelectControl<EnrouteTransition>>();
  protected readonly rwyTransSelectRef = FSComponent.createRef<SelectControl<RunwayTransition>>();

  protected readonly store = this.createStore();
  protected readonly controller = this.createController(this.store);

  /**
   * Creates an instance of a departure/arrival selection component data store.
   * @returns A departure/arrival selection component data store.
   */
  protected abstract createStore(): SelectDepArrStore<T>;

  /**
   * Creates an instance of a departure/arrival selection component controller.
   * @param store This component's data store.
   * @returns A departure/arrival selection component controller.
   */
  protected abstract createController(store: SelectDepArrStore<T>): SelectDepArrController<T>;

  /**
   * Gets the display label for the procedure.
   * @returns The procedure label string.
   */
  protected abstract getProcLabel(): string;

  /**
   * Initializes the airport ICAO input.
   */
  public initializeIcaoInput(): void {
    this.controller.initializeIcaoInput();
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

  /**
   * Builds a procedure menu item.
   * @param proc The procedure to build the menu item for.
   * @returns A menu item definition.
   */
  protected buildProcMenuItem(proc: T): ContextMenuItemDefinition {
    return {
      renderContent: (): VNode => <span>{proc.name}</span>,
      estimatedWidth: proc.name.length * ContextMenuDialog.CHAR_WIDTH,
      onFocused: this.controller.procFocusedHandler.bind(this.controller, proc)
    };
  }

  /**
   * Builds a runway transition menu item.
   * @param rwyTrans The runway transition to build the menu item for.
   * @returns A menu item definition.
   **/
  protected buildRwyMenuItem(rwyTrans: RunwayTransition): ContextMenuItemDefinition {
    const name = this.store.getRunwayString(rwyTrans);
    return {
      renderContent: (): VNode => <span>{name}</span>,
      estimatedWidth: name.length * ContextMenuDialog.CHAR_WIDTH,
      onFocused: this.controller.runwayFocusedHandler.bind(this.controller, rwyTrans)
    };
  }

  /**
   * Builds an enroute transition menu item.
   * @param trans The transition to build the menu item for.
   * @returns A menu item definition.
   */
  protected buildTransMenuItem(trans: EnrouteTransition): ContextMenuItemDefinition {
    const name = trans.name.trim().length < 1 ? 'NONE' : trans.name;
    return {
      renderContent: (): VNode => <span>{name}</span>,
      estimatedWidth: name.length * ContextMenuDialog.CHAR_WIDTH,
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
   * Renders the procedure select control component.
   * @param container A reference to the container that constrains the position of the select control pop-up.
   * @param dialogPosition The position of the pop-up context menu dialog spawned by the select control.
   * @returns The rendered procedure select control component, as a VNode.
   */
  protected renderProcedureSelectControl(container: NodeReference<HTMLElement>, dialogPosition?: ContextMenuPosition): VNode {
    return (
      <GenericControl
        onRegister={this.register}
        onFocused={(): void => { this.procSelectRef.instance.focus(FocusPosition.First); }}
        onBlurred={(): void => { this.procSelectRef.instance.blur(); }}
        onUpperKnobInc={(): void => { this.procSelectRef.instance.onInteractionEvent(FmsHEvent.UPPER_INC); }}
        onUpperKnobDec={(): void => { this.procSelectRef.instance.onInteractionEvent(FmsHEvent.UPPER_DEC); }}
        class='slctproc-proc-value'
      >
        <SelectControl<T>
          ref={this.procSelectRef}
          viewService={this.props.viewService}
          outerContainer={container}
          data={this.store.procedures} onItemSelected={this.controller.procSelectedHandler} buildMenuItem={this.buildProcMenuItem.bind(this)}
          dialogPosition={dialogPosition}
          onSelectionDialogClosed={this.controller.procSelectionClosedHandler}
        />
      </GenericControl>
    );
  }

  /**
   * Renders the runway transition select control component.
   * @param container A reference to the container that constrains the position of the select control pop-up.
   * @param dialogPosition The position of the pop-up context menu dialog spawned by the select control.
   * @returns The rendered runway transition select control component, as a VNode.
   */
  protected renderRunwaySelectControl(container: NodeReference<HTMLElement>, dialogPosition?: ContextMenuPosition): VNode {
    return (
      <GenericControl
        onRegister={this.register}
        onFocused={(): void => { this.rwyTransSelectRef.instance.focus(FocusPosition.First); }}
        onBlurred={(): void => { this.rwyTransSelectRef.instance.blur(); }}
        onUpperKnobInc={(): void => { this.rwyTransSelectRef.instance.onInteractionEvent(FmsHEvent.UPPER_INC); }}
        onUpperKnobDec={(): void => { this.rwyTransSelectRef.instance.onInteractionEvent(FmsHEvent.UPPER_DEC); }}
        class='slctproc-rwy-value'
      >
        <SelectControl<RunwayTransition>
          ref={this.rwyTransSelectRef}
          viewService={this.props.viewService}
          outerContainer={container}
          data={this.store.runways} onItemSelected={this.controller.runwaySelectedHandler} buildMenuItem={this.buildRwyMenuItem.bind(this)}
          dialogPosition={dialogPosition}
          onSelectionDialogClosed={this.controller.rwyTransSelectionClosedHandler}
        />
      </GenericControl>
    );
  }

  /**
   * Renders the enroute transition select control component.
   * @param container A reference to the container that constrains the position of the select control pop-up.
   * @param dialogPosition The position of the pop-up context menu dialog spawned by the select control.
   * @returns The rendered enroute transition select control component, as a VNode.
   */
  protected renderEnrouteSelectControl(container: NodeReference<HTMLElement>, dialogPosition?: ContextMenuPosition): VNode {
    return (
      <GenericControl
        onRegister={this.register}
        onFocused={(): void => { this.transSelectRef.instance.focus(FocusPosition.First); }}
        onBlurred={(): void => { this.transSelectRef.instance.blur(); }}
        onUpperKnobInc={(): void => { this.transSelectRef.instance.onInteractionEvent(FmsHEvent.UPPER_INC); }}
        onUpperKnobDec={(): void => { this.transSelectRef.instance.onInteractionEvent(FmsHEvent.UPPER_DEC); }}
        class='slctproc-trans-value'
      >
        <SelectControl<EnrouteTransition>
          ref={this.transSelectRef}
          viewService={this.props.viewService}
          outerContainer={container}
          data={this.store.transitions} onItemSelected={this.controller.transSelectedHandler} buildMenuItem={this.buildTransMenuItem.bind(this)}
          dialogPosition={dialogPosition}
          onSelectionDialogClosed={this.controller.transSelectionClosedHandler}
        />
      </GenericControl>
    );
  }
}