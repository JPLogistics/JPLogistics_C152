import { FSComponent, GeoPoint, Subject, UnitType, VNode } from 'msfssdk';
import { Consumer, ControlPublisher, EventBus, EventSubscriber } from 'msfssdk/data';
import { GNSSEvents } from 'msfssdk/instruments';
import { Facility, FacilityLoader, FacilityWaypointCache, NearestSubscription } from 'msfssdk/navigation';
import { FocusPosition } from 'msfssdk/components/controls';

import { Fms } from 'garminsdk/flightplan';

import { MapUserSettings } from '../../../../Shared/Map/MapUserSettings';
import { TrafficAdvisorySystem } from '../../../../Shared/Traffic/TrafficAdvisorySystem';
import { FmsHEvent } from '../../../../Shared/UI/FmsHEvent';
import { G1000UiControl } from '../../../../Shared/UI/G1000UiControl';
import { MenuSystem } from '../../../../Shared/UI/Menus/MenuSystem';
import { NavMapModel } from '../../../../Shared/UI/NavMap/NavMapModel';
import { UiPageProps } from '../../../../Shared/UI/UiPage';
import { MFDUiPage } from '../MFDUiPage';
import { MFDViewService } from '../MFDViewService';
import { FacilitiesGroup } from './FacilitiesGroup';
import { MFDNearestNavMapComponent } from './MFDNearestNavMapComponent';
import { UnitsUserSettings } from '../../../../Shared/Units/UnitsUserSettings';

/** The properties on the flight plan popout component. */
export interface MFDNearestPageProps extends UiPageProps {
  /** An instance of the event bus. */
  bus: EventBus;

  /** An FMS state manager. */
  fms: Fms;

  /** The MenuSystem. */
  menuSystem: MenuSystem;

  /** A facility loader. */
  loader: FacilityLoader;

  /** A ControlPublisher */
  publisher: ControlPublisher;

  /** The G1000 traffic advisory system. */
  tas: TrafficAdvisorySystem;

  /** The MFD view service. */
  viewService: MFDViewService;
}

/**
 * A component that display a list of the nearest facilities with accompanying information
 * and a map indicating the facilities location.
 */
export abstract class MFDNearestPage<T extends Facility, P extends MFDNearestPageProps = MFDNearestPageProps> extends MFDUiPage<P> {
  private gps: EventSubscriber<GNSSEvents>;
  private consumer: Consumer<LatLongAlt>;

  protected readonly unitsSettingManager = UnitsUserSettings.getManager(this.props.bus);

  protected readonly uiRoot = FSComponent.createRef<G1000UiControl>();
  protected readonly facilitiesGroup = FSComponent.createRef<FacilitiesGroup<T>>();
  protected readonly mapRef = FSComponent.createRef<MFDNearestNavMapComponent>();

  protected readonly mapModel = NavMapModel.createModel(this.props.bus, this.props.tas);
  protected readonly data = this.buildNearestSubscription();

  private readonly locGeoPoint: GeoPoint;

  /**
   * Creates an instance of a nearest facilities page.
   * @param props The props.
   */
  constructor(props: P) {
    super(props);

    this.gps = this.props.bus.getSubscriber<GNSSEvents>();
    this.consumer = this.gps.on('gps-position').atFrequency(1);
    this.locGeoPoint = new GeoPoint(0, 0);
  }

  /** @inheritdoc */
  public onViewOpened(): void {
    super.onViewOpened();

    this.props.viewService.clearPageHistory();

    this.consumer.handle(this.onGps);
    this.mapRef.instance.wake();
  }

  /** @inheritdoc */
  public onViewClosed(): void {
    super.onViewClosed();

    this.uiRoot.instance.blur();
    this.consumer.off(this.onGps);
    this.mapRef.instance.sleep();
  }

  /** @inheritdoc */
  public onAfterRender(thisNode: VNode): void {
    super.onAfterRender(thisNode);
    this.data.start().then(() => this.setFilter());
  }

  /** @inheritdoc */
  public processHEvent(evt: FmsHEvent): boolean {
    const selectedGroup = this.getSelectedGroup();

    switch (evt) {
      case FmsHEvent.UPPER_PUSH:
        if (!selectedGroup.isFocused) {
          selectedGroup.focus(FocusPosition.MostRecent);
          this.setScrollEnabled(true);
        } else {
          selectedGroup.blur();
          this.setScrollEnabled(false);
        }

        return true;
      case FmsHEvent.RANGE_DEC:
        this.mapRef.instance.setRangeIndex(this.mapRef.instance.getCurrentRangeIndex() - 1, true);
        return true;
      case FmsHEvent.RANGE_INC:
        this.mapRef.instance.setRangeIndex(this.mapRef.instance.getCurrentRangeIndex() + 1, true);
        return true;
    }

    if (this.uiRoot.instance.isFocused && this.uiRoot.instance.onInteractionEvent(evt)) {
      return true;
    }

    return super.processHEvent(evt);
  }

  /** Gets the title that should be displayed above the facility selection group. */
  protected abstract getFacilityGroupTitle(): string;

  /** Gets the class to add to the page display for the groups. */
  protected abstract getPageClass(): string;

  /** Gets the currently selected focus control group from the page. */
  protected abstract getSelectedGroup(): G1000UiControl;

  /** Builds a nearest subscription applicable for this nearest facilities page. */
  protected abstract buildNearestSubscription(): NearestSubscription<T>;

  /** Renders the other groups to display on the page. */
  protected abstract renderGroups(): VNode;

  /** Gets the icon for a given facility. */
  protected abstract getIconSource(facility: Facility): string;

  /** Sets the filter on the nearest subscription, if any. */
  protected setFilter(): void { /* virtual */ }

  /**
   * A callback called when a facility is selected from the nearest facilities group.
   * @param facility The facility that was selected.
   */
  protected onFacilitySelected(facility: T | null): void {
    if (facility !== null) {
      const waypoint = FacilityWaypointCache.getCache().get(facility);
      const distance = UnitType.GA_RADIAN.convertTo(this.locGeoPoint.distance(waypoint.location), UnitType.METER);

      const ranges = this.mapModel.getModule('range').nominalRanges.get();
      for (let i = 0; i < ranges.length; i++) {
        const rangeInMeters = ranges[i].asUnit(UnitType.METER);
        if (rangeInMeters > distance) {
          this.mapRef.instance.setRangeIndex(i, false);
          break;
        }
      }

      this.mapModel.getModule('waypointHighlight').waypoint.set(FacilityWaypointCache.getCache().get(facility));
    } else {
      this.mapModel.getModule('waypointHighlight').waypoint.set(null);
    }
  }

  /**
   * Handle a GPS update.
   * @param pos The current LatLongAlt
   */
  private onGps = (pos: LatLongAlt): void => {
    this.locGeoPoint.set(pos.lat, pos.long);
    this.facilitiesGroup.getOrDefault()?.update(this.locGeoPoint);
  };

  /**
   * Render the component.
   * @returns a VNode
   */
  public render(): VNode {
    return (
      <div class="mfd-page" ref={this.viewContainerRef}>
        <MFDNearestNavMapComponent
          ref={this.mapRef} model={this.mapModel} bus={this.props.bus}
          updateFreq={Subject.create(30)}
          dataUpdateFreq={Subject.create(30)}
          projectedWidth={578} projectedHeight={734}
          deadZone={Subject.create(new Float64Array([0, 56, 0, 0]))}
          pointerBoundsOffset={Subject.create(new Float64Array([0.1, 0.1, 0.1, 0.1]))}
          flightPlanner={this.props.fms.flightPlanner}
          bingId='mfd_page_map'
          settingManager={MapUserSettings.getMfdManager(this.props.bus)}
          ownAirplaneLayerProps={{
            imageFilePath: 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG1000/Assets/own_airplane_icon.svg',
            invalidHeadingImageFilePath: 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG1000/Assets/own_airplane_icon_nohdg.svg',
            iconSize: 40,
            iconAnchor: new Float64Array([0.5, 0]),
            invalidHeadingIconAnchor: new Float64Array([0.5, 0.5])
          }}
          trafficIntruderLayerProps={{
            fontSize: 16,
            iconSize: 30
          }}
          drawEntireFlightPlan={Subject.create(false)}
          class='mfd-navmap'
        />
        <div class={`mfd-dark-background ${this.getPageClass()}`}>
          <G1000UiControl ref={this.uiRoot} innerKnobScroll>
            <FacilitiesGroup<T>
              viewService={this.props.viewService}
              ref={this.facilitiesGroup}
              unitsSettingManager={this.unitsSettingManager}
              data={this.data}
              title={this.getFacilityGroupTitle()}
              onSelected={this.onFacilitySelected.bind(this)}
              iconSource={this.getIconSource.bind(this)}
              isolateScroll />
            {this.renderGroups()}
          </G1000UiControl>
        </div>
      </div>
    );
  }
}
