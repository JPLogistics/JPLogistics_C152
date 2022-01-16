import { FSComponent, Subject, VNode } from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import { Facility, FacilityLoader, FacilityTypeSearchType, FacilityType, FacilityTypeMap } from 'msfssdk/navigation';
import { FacilityWaypointCache } from '../../../../Shared/Navigation/FacilityWaypointCache';
import { FacilityWaypoint, Waypoint } from '../../../../Shared/Navigation/Waypoint';
import { FmsHEvent } from '../../../../Shared/UI/FmsHEvent';
import { ScrollDirection, UiControl2, UiControl2Props } from '../../../../Shared/UI/UiControl2';
import { WaypointInput } from '../../../../Shared/UI/UIControls/WaypointInput';
import { UiView } from '../../../../Shared/UI/UiView';
import { ViewService } from '../../../../Shared/UI/ViewService';

import './FacilityGroup.css';

/** Props for the FacilityGroup component. */
interface FacilityGroupProps<T extends FacilityType> extends UiControl2Props {

  /** A callback called when a waypoint has been selected. */
  onSelected: (waypoint: FacilityWaypoint<FacilityTypeMap[T]> | null) => void;

  /** An instance of the event bus. */
  bus: EventBus;

  /** An instance of the facility loader. */
  facilityLoader: FacilityLoader;

  /** An instance of the MFD's view service. */
  viewService: ViewService;

  /** The display class for this group. */
  class?: string;

  /** The title to display on this group. */
  title: string;

  /** The facility type for this group. */
  facilityType: T;
}

/**
 * A component that selects and displays facility waypoint information.
 */
export class FacilityGroup<T extends FacilityType> extends UiControl2<FacilityGroupProps<T>> {
  private readonly content = FSComponent.createRef<HTMLDivElement>();
  private readonly input = FSComponent.createRef<WaypointInput>();

  private waypoints: readonly Waypoint[] = [];

  /** The input icao into the waypoint input control. */
  public readonly inputIcao = Subject.create<string>('');

  /** @inheritdoc */
  protected onFocused(): void {
    this.input.instance.focus();
  }

  /** @inheritdoc */
  protected onBlurred(): void {
    this.input.instance.blur();
  }

  /** @inheritdoc */
  protected onUpperKnobInc(): boolean {
    return this.isFocused && this.input.instance.processHEvent(FmsHEvent.UPPER_INC);
  }

  /** @inheritdoc */
  protected onUpperKnobDec(): boolean {
    return this.isFocused && this.input.instance.processHEvent(FmsHEvent.UPPER_DEC);
  }

  /** @inheritdoc */
  protected onLowerKnobInc(): boolean {
    return this.isFocused && this.input.instance.processHEvent(FmsHEvent.LOWER_INC);
  }

  /** @inheritdoc */
  protected onLowerKnobDec(): boolean {
    return this.isFocused && this.input.instance.processHEvent(FmsHEvent.LOWER_DEC);
  }

  /** @inheritdoc */
  protected onClr(): boolean {
    return this.isFocused && this.input.instance.processHEvent(FmsHEvent.CLR);
  }

  /** @inheritdoc */
  protected onEnter(): boolean {
    return this.isFocused && this.input.instance.processHEvent(FmsHEvent.ENT);
  }

  /** @inheritdoc */
  protected onScroll(direction: ScrollDirection): boolean {
    return this.isFocused && this.input.instance.processHEvent(direction === 'forward' ? FmsHEvent.LOWER_INC : FmsHEvent.LOWER_DEC);
  }

  /**
   * A callback called when the waypoint input search list changes.
   * @param waypoints The waypoints returned in the search.
   */
  private onWaypointsChanged(waypoints: FacilityWaypoint<FacilityTypeMap[T]>[]): void {
    this.waypoints = waypoints;
  }

  /**
   * A callback called when a waypoint is selected in the waypoint input.
   */
  private onWaypointSelected(): void {
    if (this.waypoints.length > 1) {
      const dialog = this.props.viewService.open('WptDup', true).setInput(this.waypoints);
      dialog.onAccept.on((sender: UiView<any, Facility, readonly FacilityWaypoint<FacilityTypeMap[T]>[]>, facility: Facility | null) => {
        if (facility !== null) {
          const waypoint = FacilityWaypointCache.getCache().get(facility);

          this.setWaypoint(waypoint as FacilityWaypoint<FacilityTypeMap[T]>);
          this.scroll('forward');
        } else {
          this.setWaypoint(null);
        }
      });
    } else {
      this.setWaypoint((this.waypoints[0] as FacilityWaypoint<FacilityTypeMap[T]> | undefined) ?? null);
      this.scroll('forward');
    }
  }

  /**
   * Sets the waypoint in the waypoint information group and calls the selection callback.
   * @param waypoint The waypoint to set.
   */
  protected setWaypoint(waypoint: FacilityWaypoint<FacilityTypeMap[T]> | null): void {
    this.props.onSelected(waypoint);
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div class="groupbox">
        <div class="groupbox-title">{this.props.title}</div>
        <div class={`groupbox-container mfd-facility-information ${this.props.class ?? ''}`} ref={this.content}>
          <WaypointInput
            bus={this.props.bus} filter={(FacilityTypeSearchType as any)[this.props.facilityType as any]} selectedIcao={this.inputIcao}
            ref={this.input} onMatchedWaypointsChanged={this.onWaypointsChanged.bind(this)} onInputEnterPressed={this.onWaypointSelected.bind(this)} />
          {this.props.children}
        </div>
      </div>
    );
  }
}