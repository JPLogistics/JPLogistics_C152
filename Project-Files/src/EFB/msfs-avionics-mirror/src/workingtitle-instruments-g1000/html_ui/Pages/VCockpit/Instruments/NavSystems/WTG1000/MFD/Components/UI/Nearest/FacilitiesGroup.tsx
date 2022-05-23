import { FSComponent, GeoPoint, NavAngleSubject, NavAngleUnit, NumberUnitSubject, UnitType, VNode } from 'msfssdk';
import { ICAO, NearestSubscription, Facility } from 'msfssdk/navigation';
import { NumberFormatter } from 'msfssdk/graphics/text';
import { G1000UiControl, G1000UiControlProps, G1000ControlList } from '../../../../Shared/UI/G1000UiControl';
import { ViewService } from '../../../../Shared/UI/ViewService';
import { NumberUnitDisplay } from '../../../../Shared/UI/Common/NumberUnitDisplay';
import { BearingDisplay } from '../../../../Shared/UI/Common/BearingDisplay';
import { UnitsUserSettingManager } from '../../../../Shared/Units/UnitsUserSettings';

import './FacilitiesGroup.css';

/** Props on the FacilitiesGroup component. */
export interface FacilitiesGroupProps<T extends Facility> extends G1000UiControlProps {

  /** The view service. */
  viewService: ViewService;

  /** A user setting manager for measurement units. */
  unitsSettingManager: UnitsUserSettingManager;

  /** The nearest facility subscription for this display group. */
  data: NearestSubscription<T>;

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
export class FacilitiesGroup<T extends Facility> extends G1000UiControl<FacilitiesGroupProps<T>> {
  private readonly facilityList = FSComponent.createRef<G1000ControlList<T>>();

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
      <FacilityItem<T>
        viewService={this.props.viewService}
        unitsSettingManager={this.props.unitsSettingManager}
        facility={data}
        currentPosition={this.currentPosition}
        onFocused={(c): void => {
          this.onSelected(c as (FacilityItem<T> | null));
        }}
        onUnregistered={(c): void => {
          if (this.currentlySelected === c) {
            this.onSelected(null);
          }
        }}
        iconSource={this.props.iconSource}
        innerKnobScroll
      />
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
        const airportItem = this.facilityList.instance.getChildInstance<FacilityItem<T>>(i);
        airportItem?.updateDistanceAndBearing(pos);
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
          <G1000ControlList
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
export interface FacilityItemProps<T extends Facility> extends G1000UiControlProps {
  /** The view service. */
  viewService: ViewService;

  /** A user setting manager for measurement units. */
  unitsSettingManager: UnitsUserSettingManager;

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
export class FacilityItem<T extends Facility> extends G1000UiControl<FacilityItemProps<T>> {

  private readonly bearing = NavAngleSubject.createFromNavAngle(NavAngleUnit.create(false).createNumber(NaN));
  private readonly distance = NumberUnitSubject.createFromNumberUnit(UnitType.GA_RADIAN.createNumber(NaN));

  private readonly arrowEl = FSComponent.createRef<HTMLDivElement>();
  private readonly icaoEl = FSComponent.createRef<HTMLDivElement>();

  private readonly facilityPos: GeoPoint;

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

    this.bearing.set(bearing, pos.lat, pos.lon);
    this.distance.set(distance);
  }

  /**
   * Sets the airport item to a selected status, showing the selected facility arrow.
   * @param selected Whether or not this facility is selected.
   */
  public setSelected(selected: boolean): void {
    this.arrowEl.instance.style.visibility = selected ? '' : 'hidden';
  }

  /** @inheritdoc */
  protected onFocused(): void {
    this.icaoEl.instance.classList.add('highlight-select');
    this.props.onFocused && this.props.onFocused(this);
  }

  /** @inheritdoc */
  protected onBlurred(source: G1000UiControl): void {
    this.icaoEl.instance.classList.remove('highlight-select');
    super.onBlurred(source);
  }

  /** @inheritdoc */
  public onEnter(): boolean {
    return this.scroll('forward');
  }

  /** @inheritdoc */
  public onDirectTo(): boolean {
    this.props.viewService.open('DirectTo').setInput({
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
        <BearingDisplay
          value={this.bearing}
          displayUnit={this.props.unitsSettingManager.navAngleUnits}
          formatter={NumberFormatter.create({ precision: 1, pad: 3, nanString: '___' })}
          class='mfd-nearest-facility-bearing'
        />
        <NumberUnitDisplay
          value={this.distance}
          displayUnit={this.props.unitsSettingManager.distanceUnitsLarge}
          formatter={NumberFormatter.create({ precision: 0.1, maxDigits: 3, nanString: '__._' })}
          class='mfd-nearest-facility-distance'
        />
      </div>
    );
  }
}