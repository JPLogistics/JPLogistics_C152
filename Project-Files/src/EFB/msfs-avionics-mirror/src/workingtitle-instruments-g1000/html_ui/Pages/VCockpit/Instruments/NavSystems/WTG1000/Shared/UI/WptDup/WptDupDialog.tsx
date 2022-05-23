import { ArraySubject, FSComponent, Subject, VNode } from 'msfssdk';
import { Facility, FacilityWaypoint, ICAO } from 'msfssdk/navigation';

import { FmsHEvent } from '../FmsHEvent';
import { List } from '../List';
import { UiControl, UiControlProps } from '../UiControl';
import { UiView, UiViewProps } from '../UiView';
import { WptDupListItem } from './WptDupListItem';

/**
 * A dialog for selecting from a list of duplicate waypoints.
 */
export abstract class WptDupDialog<T extends UiViewProps> extends UiView<T, Facility | null, readonly FacilityWaypoint<Facility>[]> {
  protected readonly listRef = FSComponent.createRef<List>();

  protected readonly waypoints = ArraySubject.create<FacilityWaypoint<Facility>>();
  protected readonly ident = Subject.create('');

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected onInputDataSet(input: readonly FacilityWaypoint<Facility>[] | undefined): void {
    this.ident.set(input?.length ? ICAO.getIdent(input[0].facility.icao) : '');
    input ? this.waypoints.set(input) : this.waypoints.clear();
    this.scrollController.gotoFirst();
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public onInteractionEvent(evt: FmsHEvent): boolean {
    switch (evt) {
      case FmsHEvent.ENT:
        return this.onEnterPressed();
      case FmsHEvent.CLR:
        return this.onClearPressed();
    }
    return false;
  }

  /**
   * This method is called when Enter is pressed.
   * @returns whether the event was handled.
   */
  protected onEnterPressed(): boolean {
    const selectedWaypoint: FacilityWaypoint<Facility> | null = this.listRef.instance.getSelectedItem();
    if (selectedWaypoint) {
      this.accept(selectedWaypoint.facility, true);
      return true;
    }

    return false;
  }

  /**
   * This method is called when CLR is pressed.
   * @returns whether the event was handled.
   */
  protected onClearPressed(): boolean {
    this.close();
    return true;
  }

  /**
   * Renders a duplicate waypoint list item.
   * @param cssClass CSS class(es) to add to the list item.
   * @param waypoint A waypoint.
   * @param registerFn The register callback to use.
   * @returns a list item VNode.
   */
  protected renderListItem(
    cssClass: string | undefined,
    waypoint: FacilityWaypoint<Facility>,
    registerFn: (ctrl: UiControl<UiControlProps>) => void
  ): VNode {
    return (
      <WptDupListItem onRegister={registerFn} waypoint={Subject.create(waypoint)} class={cssClass} />
    );
  }

  public abstract render(): VNode;
}