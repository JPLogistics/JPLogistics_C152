import { FSComponent, VNode } from 'msfssdk';
import { IntersectionFacility } from 'msfssdk/navigation';

import { Fms } from '../../FlightPlan/Fms';
import { FmsHEvent } from '../FmsHEvent';
import { UiView, UiViewProps } from '../UiView';
import { ContextMenuPosition } from '../Dialogs/ContextMenuDialog';
import { SelectControl } from '../UIControls/SelectControl';
import { ActionButton } from '../UIControls/ActionButton';
import { SelectAirwayStore } from '../Controllers/SelectAirwayStore';
import { SelectAirwayController, SelectAirwayInputData } from '../Controllers/SelectAirwayController';

/**
 * Component props for SelectAirway.
 */
export interface SelectAirwayProps extends UiViewProps {
  /** The fms */
  fms: Fms;
}

/**
 * A view which allows the user to select an airway.
 */
export abstract class SelectAirway<P extends SelectAirwayProps = SelectAirwayProps> extends UiView<P, undefined, SelectAirwayInputData> {
  protected readonly store;
  protected readonly controller;
  protected readonly exitSelectControlRef = FSComponent.createRef<SelectControl<IntersectionFacility>>();

  /** @inheritdoc */
  constructor(props: P) {
    super(props);
    this.store = new SelectAirwayStore();
    this.controller = new SelectAirwayController(this.store, this.gotoNextSelect, this.props.fms, this.exitSelectControlRef);
  }

  /** @inheritdoc */
  public onInteractionEvent(evt: FmsHEvent): boolean {
    switch (evt) {
      case FmsHEvent.CLR:
        this.close();
        return true;
    }

    return false;
  }

  /** @inheritdoc */
  public onInputDataSet(inputData: SelectAirwayInputData | undefined): void {
    this.store.inputSegment = inputData?.segmentIndex !== undefined ? inputData?.segmentIndex : -1;
    this.store.inputLeg = inputData?.legIndex !== undefined ? inputData?.legIndex : -1;
    this.controller.setExistingFix(inputData);
  }

  /** @inheritdoc */
  public onViewOpened(): void {
    this.controller.initialize();
  }

  /** Goto and activate next select control. */
  protected gotoNextSelect = (): void => {
    this.scrollController.gotoNext();
  }

  /**
   * A callback which is called when the Load action is executed.
   */
  private onLoadExecuted(): void {
    this.controller.onLoadExecuted();
    this.close();
  }

  /**
   * Renders the airway select control component.
   * @param dialogPosition The position of the pop-up context menu dialog spawned by the select control.
   * @returns The rendered airway select control component, as a VNode.
   */
  protected renderAirwaySelectControl(dialogPosition?: ContextMenuPosition): VNode {
    return (
      <SelectControl<string>
        onRegister={this.register} class="set-airway-airway-value" dialogPosition={dialogPosition}
        outerContainer={this.viewContainerRef} data={this.store.airways} buildMenuItem={this.controller.buildAirwayMenuItem}
        onItemSelected={this.controller.onAirwaySelected}
      />
    );
  }

  /**
   * Renders the exit waypoint select control component.
   * @param dialogPosition The position of the pop-up context menu dialog spawned by the select control.
   * @returns The rendered exit waypoint select control component, as a VNode.
   */
  protected renderExitSelectControl(dialogPosition?: ContextMenuPosition): VNode {
    return (
      <SelectControl<IntersectionFacility>
        onRegister={this.register} class="set-airway-exit-value" ref={this.exitSelectControlRef}
        dialogPosition={dialogPosition} outerContainer={this.viewContainerRef} nullSelectionText={this.controller.emptyListText}
        data={this.store.exits} onItemSelected={this.controller.onExitSelected} buildMenuItem={this.controller.buildExitMenuItem}
        dialogScrollStartIndex={this.controller.entryIndexSubject}
      />
    );
  }

  /**
   * Renders the load button.
   * @returns the rendered load button, as a VNode.
   */
  protected renderLoadButton(): VNode {
    return (
      <ActionButton onRegister={this.register} onExecute={this.onLoadExecuted.bind(this)} isVisible={this.controller.canLoad} text="Load?" />
    );
  }
}