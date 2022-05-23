import { FSComponent, Subject, VNode } from 'msfssdk';
import { ControlPublisher, EventBus } from 'msfssdk/data';
import { FacilityLoader, ICAO, Waypoint } from 'msfssdk/navigation';
import { FocusPosition } from 'msfssdk/components/controls';

import { Fms } from 'garminsdk/flightplan';

import { MapPointerInfoLayerSize } from '../../../../Shared/Map/Layers/MapPointerInfoLayer';
import { TrafficAdvisorySystem } from '../../../../Shared/Traffic/TrafficAdvisorySystem';
import { FmsHEvent } from '../../../../Shared/UI/FmsHEvent';
import { G1000UiControl } from '../../../../Shared/UI/G1000UiControl';
import { MenuSystem } from '../../../../Shared/UI/Menus/MenuSystem';
import { NavMapModel } from '../../../../Shared/UI/NavMap/NavMapModel';
import { UiPageProps } from '../../../../Shared/UI/UiPage';
import { WaypointMapComponent, WaypointMapRangeTargetRotationController } from '../../../../Shared/UI/WaypointMap/WaypointMapComponent';
import { MFDUiPage } from '../MFDUiPage';
import { FacilityGroup } from './FacilityGroup';
import { UnitsUserSettings } from '../../../../Shared/Units/UnitsUserSettings';

import './MFDInformationPage.css';

/** The properties on the flight plan popout component. */
export interface MFDInformationPageProps extends UiPageProps {
  /** An instance of the event bus. */
  bus: EventBus;

  /** An FMS state manager. */
  fms: Fms;

  /** A facility loader. */
  facilityLoader: FacilityLoader;

  /** The G1000 traffic advisory system. */
  tas: TrafficAdvisorySystem;

  /** The MenuSystem. */
  menuSystem: MenuSystem;

  /** A control system publisher. */
  controlPublisher: ControlPublisher;
}

/**
 * A component that displays a list of the nearest facilities with accompanying information
 * and a map indicating the facilities location.
 */
export abstract class MFDInformationPage extends MFDUiPage<MFDInformationPageProps> {

  protected readonly unitsSettingManager = UnitsUserSettings.getManager(this.props.bus);

  protected readonly mapRef = FSComponent.createRef<WaypointMapComponent>();
  protected readonly uiRoot = FSComponent.createRef<G1000UiControl>();
  protected readonly facilityGroup = FSComponent.createRef<FacilityGroup<any>>();

  protected readonly mapRangeIndexSub = Subject.create<number>(WaypointMapRangeTargetRotationController.DEFAULT_MAP_RANGE_INDEX);
  protected readonly waypoint = Subject.create<Waypoint | null>(null);
  protected readonly mapModel = NavMapModel.createModel(this.props.bus, this.props.tas);

  /** Renders the other groups to display on the page. */
  protected abstract renderGroups(): VNode;

  /** Gets the class to add to the page display for the groups. */
  protected abstract getPageClass(): string;

  /** @inheritdoc */
  protected onViewOpened(): void {
    super.onViewOpened();

    this.props.viewService.clearPageHistory();

    this.props.menuSystem.clear();
    this.props.menuSystem.pushMenu('navmap-root');

    this.mapRef.instance.wake();
  }

  /** @inheritdoc */
  public onViewClosed(): void {
    super.onViewClosed();

    this.uiRoot.instance.blur();
    this.mapRef.instance.sleep();
  }

  /** @inheritdoc */
  protected onInputDataSet(icao: string | undefined): void {
    if (typeof icao === 'string' && ICAO.isFacility(icao)) {
      this.facilityGroup.instance.inputIcao.set(icao);

      this.facilityGroup.instance.focus(FocusPosition.First);
      setTimeout(() => {
        this.facilityGroup.instance.onInteractionEvent(FmsHEvent.ENT);
        this.uiRoot.instance.blur();
      });
    }
  }

  /** @inheritdoc */
  public processHEvent(evt: FmsHEvent): boolean {
    switch (evt) {
      case FmsHEvent.UPPER_PUSH:
        this.toggleScroll();
        if (!this.uiRoot.instance.isFocused) {
          this.uiRoot.instance.focus(FocusPosition.MostRecent);
        } else {
          this.uiRoot.instance.blur();
        }

        return true;
      case FmsHEvent.RANGE_DEC:
        this.mapRangeIndexSub.set(this.mapRangeIndexSub.get() - 1);
        return true;
      case FmsHEvent.RANGE_INC:
        this.mapRangeIndexSub.set(this.mapRangeIndexSub.get() + 1);
        return true;
    }

    if (this.uiRoot.instance.isFocused && this.uiRoot.instance.onInteractionEvent(evt)) {
      return true;
    }

    return super.processHEvent(evt);
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div class="mfd-page" ref={this.viewContainerRef}>
        <WaypointMapComponent ref={this.mapRef} model={this.mapModel} bus={this.props.bus}
          updateFreq={Subject.create(30)}
          dataUpdateFreq={Subject.create(30)}
          projectedWidth={578} projectedHeight={734}
          deadZone={Subject.create(new Float64Array([0, 56, 0, 0]))}
          pointerBoundsOffset={Subject.create(new Float64Array([0.1, 0.1, 0.1, 0.1]))}
          bingId='mfd_page_map'
          rangeIndex={this.mapRangeIndexSub}
          waypoint={this.waypoint}
          ownAirplaneLayerProps={{
            imageFilePath: 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG1000/Assets/own_airplane_icon.svg',
            iconSize: 40,
            iconAnchor: new Float64Array([0.5, 0])
          }}
          pointerInfoSize={MapPointerInfoLayerSize.Full}
          class='mfd-infomap'
        />
        <div class={`mfd-dark-background ${this.getPageClass()}`}>
          <G1000UiControl ref={this.uiRoot} isolateScroll>
            {this.renderGroups()}
          </G1000UiControl>
        </div>
      </div>
    );
  }
}