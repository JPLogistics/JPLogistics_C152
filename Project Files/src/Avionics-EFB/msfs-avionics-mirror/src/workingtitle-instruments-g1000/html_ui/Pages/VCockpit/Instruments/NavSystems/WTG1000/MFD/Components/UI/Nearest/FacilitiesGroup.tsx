import { FSComponent, GeoPoint, Subject, UnitType, VNode } from 'msfssdk';
import { ControlList } from '../../../../Shared/UI/ControlList';
import { UiControl2, UiControl2Props } from '../../../../Shared/UI/UiControl2';
import { ICAO, NearestSubscription, Facility } from 'msfssdk/navigation';
import { Fms } from '../../../../Shared/FlightPlan/Fms';

import './FacilitiesGroup.css';

/** Props on the FacilitiesGroup component. */
export interface FacilitiesGroupProps<T extends Facility> extends UiControl2Props {
  /** The nearest facility subscription for this display group. */
  data: NearestSubscription<T, string, string>;

  /** An event that fires when a facility is selected on this display. */
  onSelected: (facility: T | null) => void;

  /** The img tag source for the facility icon. */
  iconSource: (facility: T) => string;

  /** The title to give this facilities group in this display. */
  title: string;
}

/**
 * A component that displays the facility selection pane of a MFD
 * nearest facilites page.
 */
export class FacilitiesGroup<T extends Facility> extends UiControl2<FacilitiesGroupProps<T>> {

  private readonly facilityList = FSComponent.createRef<ControlList<T>>();

  private currentPosition = new GeoPoint(0, 0);
  private currentlySelected: FacilityItem<T> | undefined;

  /**
   * Builds a nearest facilities list item for display in the nearest
   * facilites list.
   * @param data The data to display.
   * @returns The constructed VNode.
   */
  public buildNearestItem(data: T): VNode {
    return (
      <FacilityItem<T> facility={data}
        currentPosition={this.currentPosition}
        onFocused={(c): void => this.onSelected(c as (FacilityItem<T> | null))}
        onUnregistered={(c: UiControl2): void => { if (this.currentlySelected === c) { this.onSelected(null); } }}
        iconSource={this.props.iconSource}
        innerKnobScroll />
    );
  }

  /**
   * A callback called to handle when a facility is selected in the nearest facilites list.
   * @param control The control that was selected.
   */
  private onSelected(control: FacilityItem<T> | null): void {
    if (control !== null) {
      if (this.currentlySelected !== control) {
        this.currentlySelected?.setSelected(false);
        control.setSelected(true);

        this.currentlySelected = control;
        this.props.onSelected(control.props.facility);
      }
    } else {
      this.currentlySelected?.setSelected(false);
      this.currentlySelected = undefined;
    }
  }

  /**
   * Updates the nearest facility list.
   * @param pos The current aircraft position.
   */
  public update(pos: GeoPoint): void {
    this.currentPosition.set(pos);

    if (this.props.data.started) {
      this.props.data.update(pos.lat, pos.lon, UnitType.NMILE.convertTo(200, UnitType.METER), 25)
        .then(() => {
          if (this.currentlySelected === undefined) {
            const control = this.facilityList.instance.getChildInstance<FacilityItem<T>>(0);
            this.onSelected(control);
          }
        });

      for (let i = 0; i < this.facilityList.instance.length; i++) {
        const airportItem = this.facilityList.instance.getChild(i) as FacilityItem<T>;
        airportItem.updateDistanceAndBearing(pos);
      }

      this.facilityList.instance.updateOrder();
    }
  }

  /**
   * Orders the facilities in the display.
   * @param a The first facility to compare.
   * @param b The second facility to compare.
   * @returns Positive if the first facility is further, 0 if equal, negative if closer.
   */
  private orderFacilities(a: T, b: T): number {
    const aDistance = this.currentPosition.distance(a);
    const bDistance = this.currentPosition.distance(b);

    return aDistance - bDistance;
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div class="groupbox">
        <div class="groupbox-title">{this.props.title}</div>
        <div class="groupbox-container">
          <ControlList
            innerKnobScroll
            class='mfd-nearest-facility-list'
            data={this.props.data}
            renderItem={this.buildNearestItem.bind(this)}
            orderBy={this.orderFacilities.bind(this)}
            ref={this.facilityList} />
        </div>
      </div>
    );
  }
}

/** Props on the FacilityItem component */
export interface FacilityItemProps<T extends Facility> extends UiControl2Props {
  /** The data to display on this nearest airports row. */
  facility: T;

  /** The current aircraft position. */
  currentPosition: GeoPoint;

  /** The img tag source for the facility icon. */
  iconSource: (facility: T) => string;
}

/**
 * A component that displays a row on the MFD nearest facilities
 * facility selection pane.
 */
export class FacilityItem<T extends Facility> extends UiControl2<FacilityItemProps<T>> {

  private readonly bearing = Subject.create<string>('');
  private readonly distanceString = Subject.create<string>('');

  private readonly arrowEl = FSComponent.createRef<HTMLDivElement>();
  private readonly icaoEl = FSComponent.createRef<HTMLDivElement>();

  private readonly facilityPos: GeoPoint;

  /** The current distance to the facility. */
  public distance = 0;

  /**
   * Creates an instance of an FacilityItem.
   * @param props The props on the FacilityItem component.
   */
  constructor(props: FacilityItemProps<T>) {
    super(props);
    this.facilityPos = new GeoPoint(props.facility.lat, props.facility.lon);
  }

  /** @inheritdoc */
  public onAfterRender(): void {
    this.updateDistanceAndBearing(this.props.currentPosition);
  }

  /**
   * Updates the distance and bearing information.
   * @param pos The position to calculate the distance and bearing from.
   */
  public updateDistanceAndBearing(pos: GeoPoint): void {
    const bearing = pos.bearingTo(this.facilityPos);
    const distance = pos.distance(this.facilityPos);

    this.bearing.set(bearing.toFixed(0).padStart(3, '0'));
    this.distance = UnitType.GA_RADIAN.convertTo(distance, UnitType.METER);
    this.distanceString.set(UnitType.GA_RADIAN.convertTo(distance, UnitType.NMILE).toFixed(1));
  }

  /**
   * Sets the airport item to a selected status, showing the selected facility arrow.
   * @param selected Whether or not this facility is selected.
   */
  public setSelected(selected: boolean): void {
    this.arrowEl.instance.style.visibility = selected ? '' : 'hidden';
  }

  /** @inheritdoc */
  public onFocused(): void {
    this.icaoEl.instance.classList.add('highlight-select');
    this.props.onFocused && this.props.onFocused(this);
  }

  /** @inheritdoc */
  public onBlurred(): void {
    this.icaoEl.instance.classList.remove('highlight-select');
  }

  /** @inheritdoc */
  public onEnter(): boolean {
    return this.scroll('forward');
  }

  /** @inheritdoc */
  public onDirectTo(): boolean {
    Fms.viewService.open('DirectTo').setInput({
      icao: this.props.facility.icao
    });

    return true;
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div class='mfd-nearest-facility'>
        <div ref={this.arrowEl} style='visibility: hidden' class='mfd-nearest-facility-arrow'>
          <svg viewBox='0 0 7 6' width='16' height='16'>
            <path d='m 0 2 L 4 2 L 4 0 L 7 3 L 4 6 L 4 4 L 0 4 z' />
          </svg>
        </div>
        <div class='mfd-nearest-facility-icao' ref={this.icaoEl}>{ICAO.getIdent(this.props.facility.icao)}</div>
        <img class='mfd-nearest-facility-icon' src={this.props.iconSource(this.props.facility)} />
        <div class='mfd-nearest-facility-bearing'>{this.bearing}°</div>
        <div class='mfd-nearest-facility-distance'>
          <span>{this.distanceString}</span>
          <span class='mfd-nearest-facility-distance-units'>NM</span>
        </div>
      </div>
    );
  }
}