import { VNode, FSComponent } from 'msfssdk';
import { AirportFacility, OneWayRunway } from 'msfssdk/navigation';

import { ContextMenuDialog, ContextMenuItemDefinition } from '../Dialogs/ContextMenuDialog';
import { FmsHEvent } from '../FmsHEvent';
import { UiView, UiViewProps } from '../UiView';
import { SetRunwayStore } from './SetRunwayStore';

/**
 * A dialog for setting runways.
 */
export abstract class SetRunway extends UiView<UiViewProps, OneWayRunway | undefined, AirportFacility> {
  protected readonly store = new SetRunwayStore();

  protected selectedRunway: OneWayRunway | undefined = undefined;

  /** @inheritdoc */
  protected onInputDataSet(input: AirportFacility | undefined): void {
    this.store.airport.set(input ?? null);
    this.scrollController.gotoFirst();
  }

  /** @inheritdoc */
  public onInteractionEvent(evt: FmsHEvent): boolean {
    switch (evt) {
      case FmsHEvent.ENT:
        return this.onEnterPressed();
      case FmsHEvent.CLR:
        return this.onCLRPressed();
    }
    return false;
  }

  /**
   * This method is called when an Enter button event occurs.
   * @returns whether the event was handled.
   */
  protected onEnterPressed(): boolean {
    this.accept(this.selectedRunway, true);
    return true;
  }

  /**
   * This method is called when a CLR button event occurs.
   * @returns whether the event was handled.
   */
  protected onCLRPressed(): boolean {
    this.selectedRunway = undefined;
    this.close();
    return true;
  }

  /**
   * A callback which is called when a runway is selected.
   * @param index The index of the selection.
   * @param runway The runway which was selected.
   */
  protected onRunwaySelected(index: number, runway: OneWayRunway): void {
    this.selectedRunway = (runway !== undefined && runway.designation !== '') ? runway : undefined;
  }

  /**
   * Builds a runway menu item definition for a runway.
   * @param runway A runway.
   * @param index The index of the item in the menu.
   * @returns a menu item definition for the runway.
   */
  protected buildRunwayMenuItem(runway: OneWayRunway, index: number): ContextMenuItemDefinition {
    const text = (runway.designation !== '') ? runway.designation : 'NONE';
    return { id: index.toString(), renderContent: (): VNode => <span>{text}</span>, estimatedWidth: text.length * ContextMenuDialog.CHAR_WIDTH };
  }
}




