import { FSComponent, GeoPoint, GeoPointSubject, NumberFormatter, Subject, VNode } from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import { Facility, FacilitySearchType } from 'msfssdk/navigation';
import { ADCEvents, GNSSEvents } from 'msfssdk/instruments';

import { UiView, UiViewProps } from '../UiView';
import { WptInfoStore } from './WptInfoStore';
import { WptInfoController } from './WptInfoController';
import { FmsHEvent } from '../FmsHEvent';
import { FacilityWaypoint, Waypoint } from '../../Navigation/Waypoint';
import { WaypointInput } from '../UIControls/WaypointInput';
import { NumberUnitDisplay } from '../Common/NumberUnitDisplay';
import { UnitsUserSettings } from '../../Units/UnitsUserSettings';
import { BearingDisplay } from '../Common/BearingDisplay';

/**
 * The properties on the waypoint info popout component.
 */
export interface WptInfoProps extends UiViewProps {
  /** An instance of the event bus. */
  bus: EventBus;
}

/**
 * The PFD waypoint info popout.
 */
export abstract class WptInfo<T extends WptInfoProps> extends UiView<T, Facility> {
  protected readonly inputSelectedIcao = Subject.create('');

  protected readonly selectedWaypointSub = Subject.create<Waypoint | null>(null);
  protected readonly planePosSub = GeoPointSubject.createFromGeoPoint(new GeoPoint(NaN, NaN));
  protected readonly planeHeadingSub = Subject.create(NaN);

  private readonly planePosConsumer = this.props.bus.getSubscriber<GNSSEvents>().on('gps-position').whenChanged();
  private readonly planeHeadingConsumer = this.props.bus.getSubscriber<ADCEvents>().on('hdg_deg_true').withPrecision(1);
  private readonly planePosHandler = this.onPlanePosChanged.bind(this);
  private readonly planeHeadingHandler = this.onPlaneHeadingChanged.bind(this);

  protected readonly store = new WptInfoStore(this.selectedWaypointSub, this.planePosSub);
  protected readonly controller = new WptInfoController(this.store, this.selectedWaypointSub);

  protected readonly unitSettingManager = UnitsUserSettings.getManager(this.props.bus);

  /** @inheritdoc */
  public onInteractionEvent(evt: FmsHEvent): boolean {
    switch (evt) {
      case FmsHEvent.CLR:
        this.close();
        return true;
      case FmsHEvent.ENT:
        this.onEnterPressed();
        return true;
    }
    return false;
  }

  /**
   * Executes actions when Enter is pressed.
   */
  protected onEnterPressed(): void {
    const matchedWaypoints = this.store.matchedWaypoints;
    const selectedWaypoint = this.store.waypoint.get() as FacilityWaypoint<Facility>;

    if (matchedWaypoints.length > 1) {
      const dialog = this.props.viewService.open('WptDup', true).setInput(matchedWaypoints);
      dialog.onAccept.on((sender: UiView<any, Facility, readonly FacilityWaypoint<Facility>[]>, facility: Facility | null) => {
        this.onWptDupDialogAccept(facility);
      });
      dialog.onClose.on(() => { this.onWptDupDialogClose(); });
    } else if (selectedWaypoint) {
      this.accept(selectedWaypoint.facility);
    }
  }

  /**
   * A callback which is called when a waypoint duplicate dialog invoked by this view accepts.
   * @param facility The facility returned by the waypoint duplicate dialog.
   */
  protected onWptDupDialogAccept(facility: Facility | null): void {
    facility && this.accept(facility);
  }

  /**
   * A callback which is called when a waypoint duplicate dialog invoked by this view closes.
   */
  protected onWptDupDialogClose(): void {
    // noop
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected onViewOpened(): void {
    this.inputSelectedIcao.set('');
    this.planePosConsumer.handle(this.planePosHandler);
    this.planeHeadingConsumer.handle(this.planeHeadingHandler);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected onViewClosed(): void {
    this.planePosConsumer.off(this.planePosHandler);
    this.planeHeadingConsumer.off(this.planeHeadingHandler);
  }

  /**
   * A callback which is called when the plane's current position changes.
   * @param pos The new position.
   */
  private onPlanePosChanged(pos: LatLongAlt): void {
    this.planePosSub.set(pos.lat, pos.long);
  }

  /**
   * A callback which is called when the plane's current true heading changes.
   * @param heading The new heading, in degrees.
   */
  private onPlaneHeadingChanged(heading: number): void {
    this.planeHeadingSub.set(heading);
  }

  /**
   * Renders a waypoint input component.
   * @returns a waypoint input component, as a VNode.
   */
  protected renderWaypointInput(): VNode {
    return (
      <WaypointInput
        bus={this.props.bus}
        onRegister={this.register}
        selectedIcao={this.inputSelectedIcao}
        onMatchedWaypointsChanged={this.controller.matchedWaypointsChangedHandler}
        onWaypointChanged={this.controller.selectedWaypointChangedHandler}
        onInputEnterPressed={this.onEnterPressed.bind(this)}
        planeHeading={this.planeHeadingSub}
        filter={FacilitySearchType.None}
      />
    );
  }

  /**
   * Renders a component which displays the bearing to the store's selected waypoint.
   * @param cssClass CSS class(es) to apply to the root of the component.
   * @returns a component which displays the bearing to the store's selected waypoint, as a VNode.
   */
  protected renderBearing(cssClass?: string): VNode {
    return (
      <BearingDisplay
        value={this.store.bearing} displayUnit={this.unitSettingManager.navAngleUnits}
        formatter={NumberFormatter.create({ precision: 1, pad: 3, nanString: '___' })}
        class={cssClass}
      />
    );
  }

  /**
   * Renders a component which displays the distance to the store's selected waypoint.
   * @param cssClass CSS class(es) to apply to the root of the component.
   * @returns a component which displays the distance to the store's selected waypoint, as a VNode.
   */
  protected renderDistance(cssClass?: string): VNode {
    return (
      <NumberUnitDisplay
        value={this.store.distance} displayUnit={this.unitSettingManager.distanceUnitsLarge}
        formatter={NumberFormatter.create({ precision: 0.1, maxDigits: 3, forceDecimalZeroes: true, nanString: '__._' })}
        class={cssClass}
      />
    );
  }
}