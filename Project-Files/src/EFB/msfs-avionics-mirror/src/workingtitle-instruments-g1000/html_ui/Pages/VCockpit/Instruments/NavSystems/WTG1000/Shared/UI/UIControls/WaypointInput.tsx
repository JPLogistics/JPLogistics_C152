import { FSComponent, Subject, VNode } from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import { Facility, FacilitySearchType, FacilityWaypoint, Waypoint } from 'msfssdk/navigation';

import { MessageDialog } from '../../UI/Dialogs/MessageDialog';
import { InputComponent } from '../../UI/UIControls/InputComponent';
import { UiControlGroup, UiControlGroupProps } from '../UiControlGroup';
import { ViewService } from '../ViewService';
import { WaypointIcon } from '../Waypoint/WaypointIcon';
import { WaypointInputController } from './WaypointInputController';
import { WaypointInputStore } from './WaypointInputStore';

import './WaypointInput.css';

/**
 * The properties for the WaypointInput component.
 */
interface WaypointInputProps extends UiControlGroupProps {
  /** The view service. */
  viewService: ViewService;

  /** The event bus. */
  bus: EventBus;

  /** Filter for the search. */
  filter: FacilitySearchType;

  /** A callback function to call when the input's matched waypoints list changes. */
  onMatchedWaypointsChanged?(waypoints: readonly FacilityWaypoint<Facility>[]): void;

  /** A callback function to call when the input's selected waypoint changes. */
  onWaypointChanged?(waypoint: Waypoint | null): void;

  // TODO: Leaving this here for backwards compatibility, but eventually we will want to migrate everything to
  // onWaypointChanged().
  /** A callback function to call when the selected facility changes. */
  onFacilityChanged?(facility: Facility | undefined): void;

  /** A subject which provides an ICAO string for the input to bind. */
  selectedIcao: Subject<string>;

  /** A callback function to call when ENT is pressed on the input. */
  onInputEnterPressed?(facility: Facility): void;

  /**
   * A subject which provides the plane's current true heading. Required to dynamically update airport icons which
   * display runway heading information.
   */
  planeHeading?: Subject<number>;
}

/** The WaypointInput component. */
export class WaypointInput extends UiControlGroup<WaypointInputProps> {
  private readonly inputComponentRef = FSComponent.createRef<InputComponent>();

  private readonly store = new WaypointInputStore(
    this.props.bus,
    this.props.filter,
    this.props.onWaypointChanged,
    this.props.onFacilityChanged,
    this.props.onMatchedWaypointsChanged
  );
  private readonly controller = new WaypointInputController(this.store, this.props.selectedIcao, this.onInputTextValueOverride.bind(this));

  /**
   * A callback which is called when the input text value needs to be overridden.
   * @param value The new input text value.
   */
  private onInputTextValueOverride(value: string): void {
    this.inputComponentRef.instance.setText(value, value === '' ? 0 : undefined, false);
  }

  /**
   * A callback which is called when Enter is pressed on this component's InputComponent child.
   * @returns whether the Enter event was handled.
   */
  private onInputEnterPressed(): boolean {
    const facilityWaypoint = this.store.selectedWaypoint.get();
    if (!facilityWaypoint && this.store.inputValue.get() !== '') {
      this.props.viewService.open(MessageDialog.name, true).setInput({ inputString: `${this.store.inputValue.get().replace(/^_+|_+$/g, '')} does not exist.` }).onClose.on(() => {
        this.inputComponentRef.instance.activate();
      });
    } else {
      if (this.props.onInputEnterPressed !== undefined && facilityWaypoint !== null) {
        this.props.onInputEnterPressed(facilityWaypoint.facility);
      }
    }
    return true;
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div class="wpt-entry">
        <InputComponent onRegister={this.register} ref={this.inputComponentRef} maxLength={6}
          onTextChanged={this.controller.onInputChanged.bind(this.controller)} onEnter={this.onInputEnterPressed.bind(this)} />
        <WaypointIcon waypoint={this.store.selectedWaypoint} planeHeading={this.props.planeHeading} class='wpt-entry-icon' />
        <div class="wpt-entry-location">{this.store.displayWaypoint.city}</div>
        <div class="wpt-entry-name">{this.store.displayWaypoint.name}</div>
      </div>
    );
  }
}