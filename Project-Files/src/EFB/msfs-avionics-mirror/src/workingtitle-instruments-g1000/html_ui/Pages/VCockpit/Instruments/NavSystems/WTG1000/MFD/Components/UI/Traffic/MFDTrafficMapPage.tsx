import { FSComponent, Subject, VNode } from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import { FlightPlanner } from 'msfssdk/flightplan';

import { MapRangeSettings } from '../../../../Shared/Map/MapRangeSettings';
import { TrafficAdvisorySystem } from '../../../../Shared/Traffic/TrafficAdvisorySystem';
import { TrafficAltitudeModeSetting, TrafficOperatingModeSetting, TrafficUserSettings } from '../../../../Shared/Traffic/TrafficUserSettings';
import { MenuItemDefinition } from '../../../../Shared/UI/Dialogs/PopoutMenuItem';
import { FmsHEvent } from '../../../../Shared/UI/FmsHEvent';
import { TrafficMapModel } from '../../../../Shared/UI/TrafficMap/TrafficMapModel';
import { MFDPageMenuDialog } from '../MFDPageMenuDialog';
import { MFDUiPage, MFDUiPageProps } from '../MFDUiPage';
import { MFDTrafficMapComponent } from './MFDTrafficMapComponent';

import './MFDTrafficMapPage.css';

/**
 * Component props for MFDTrafficMapPage.
 */
export interface MFDTrafficMapPageProps extends MFDUiPageProps {
  /** The event bus. */
  bus: EventBus;

  /** An instance of the flight planner. */
  flightPlanner: FlightPlanner;

  /** The G1000 traffic advisory system. */
  tas: TrafficAdvisorySystem;
}

/**
 * The MFD traffic map page.
 */
export class MFDTrafficMapPage extends MFDUiPage<MFDTrafficMapPageProps> {
  private static readonly UPDATE_FREQ = 30; // Hz

  private readonly mapRef = FSComponent.createRef<MFDTrafficMapComponent>();

  private readonly mapModel = TrafficMapModel.createModel(this.props.tas);
  private readonly mapRangeSettingManager = MapRangeSettings.getManager(this.props.bus);
  private readonly mapRangeSetting = this.mapRangeSettingManager.getSetting('mfdMapRangeIndex');

  private readonly trafficSettingManager = TrafficUserSettings.getManager(this.props.bus);

  private readonly pageMenuItems: MenuItemDefinition[] = [
    {
      id: 'tas-operate',
      renderContent: (): VNode => <span>TAS {this.trafficSettingManager.getSetting('trafficOperatingMode').value === TrafficOperatingModeSetting.Operating ? 'Standby' : 'Operate'} Mode</span>,
      action: (): void => { this.trafficSettingManager.getSetting('trafficOperatingMode').value = TrafficOperatingModeSetting.Operating; }
    },
    {
      id: 'test',
      renderContent: (): VNode => <span>Test Mode</span>,
      isEnabled: false
    },
    {
      id: 'below',
      renderContent: (): VNode => <span>Below</span>,
      action: (): void => { this.trafficSettingManager.getSetting('trafficAltitudeMode').value = TrafficAltitudeModeSetting.Below; },
      isEnabled: this.trafficSettingManager.getSetting('trafficAltitudeMode').value !== TrafficAltitudeModeSetting.Below
    },
    {
      id: 'normal',
      renderContent: (): VNode => <span>Normal</span>,
      action: (): void => { this.trafficSettingManager.getSetting('trafficAltitudeMode').value = TrafficAltitudeModeSetting.Normal; },
      isEnabled: this.trafficSettingManager.getSetting('trafficAltitudeMode').value !== TrafficAltitudeModeSetting.Normal
    },
    {
      id: 'above',
      renderContent: (): VNode => <span>Above</span>,
      action: (): void => { this.trafficSettingManager.getSetting('trafficAltitudeMode').value = TrafficAltitudeModeSetting.Above; },
      isEnabled: this.trafficSettingManager.getSetting('trafficAltitudeMode').value !== TrafficAltitudeModeSetting.Above
    },
    {
      id: 'unrestricted',
      renderContent: (): VNode => <span>Unrestricted</span>,
      action: (): void => { this.trafficSettingManager.getSetting('trafficAltitudeMode').value = TrafficAltitudeModeSetting.Unrestricted; },
      isEnabled: this.trafficSettingManager.getSetting('trafficAltitudeMode').value !== TrafficAltitudeModeSetting.Unrestricted
    },
  ];

  /** @inheritdoc */
  constructor(props: MFDTrafficMapPageProps) {
    super(props);

    this._title.set('Map – Traffic Map');
  }

  /** @inheritdoc */
  public onAfterRender(thisNode: VNode): void {
    super.onAfterRender(thisNode);

    this.mapRef.instance.sleep();
  }

  /** @inheritdoc */
  public onInteractionEvent(evt: FmsHEvent): boolean {
    switch (evt) {
      case FmsHEvent.RANGE_DEC:
        this.changeMapRangeIndex(-1);
        return true;
      case FmsHEvent.RANGE_INC:
        this.changeMapRangeIndex(1);
        return true;
    }

    return super.onInteractionEvent(evt);
  }

  /**
   * Changes the MFD map range index setting.
   * @param delta The change in index to apply.
   */
  private changeMapRangeIndex(delta: 1 | -1): void {
    const ranges = this.mapModel.getModule('range').nominalRanges.get();
    const currentIndex = this.mapRangeSetting.value;
    const currentRange = ranges[currentIndex];

    let index = currentIndex;
    let newIndex = currentIndex;
    if (delta === 1) {
      while (++index < ranges.length) {
        if (!ranges[index].equals(currentRange)) {
          newIndex = index;
          break;
        }
      }
    } else {
      while (--index >= 0) {
        if (!ranges[index].equals(currentRange)) {
          newIndex = index;
          break;
        }
      }
    }

    this.mapRangeSetting.value = newIndex;
  }

  /** @inheritdoc */
  protected onViewOpened(): void {
    super.onViewOpened();

    this.props.viewService.clearPageHistory();

    this.props.menuSystem.clear();
    this.props.menuSystem.pushMenu('traffic-root');

    this.mapRef.instance.wake();
  }

  /** @inheritdoc */
  protected onViewClosed(): void {
    super.onViewClosed();

    this.mapRef.instance.sleep();
  }

  /** @inheritdoc */
  protected onMenuPressed(): boolean {
    this.props.menuSystem.pushMenu('empty');
    const pageMenu = (this.props.viewService.open('PageMenuDialog') as MFDPageMenuDialog);
    pageMenu.setMenuItems(this.pageMenuItems);
    pageMenu.onClose.on(() => { this.props.menuSystem.back(); });
    return true;
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div ref={this.viewContainerRef} class='mfd-page'>
        <MFDTrafficMapComponent
          ref={this.mapRef} model={this.mapModel} bus={this.props.bus}
          updateFreq={Subject.create(MFDTrafficMapPage.UPDATE_FREQ)}
          dataUpdateFreq={Subject.create(MFDTrafficMapPage.UPDATE_FREQ)}
          projectedWidth={876} projectedHeight={678}
          flightPlanner={this.props.flightPlanner}
          ownAirplaneLayerProps={{
            imageFilePath: 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG1000/Assets/own_airplane_icon.svg',
            iconSize: 40,
            iconAnchor: new Float64Array([0.5, 0])
          }}
          trafficIntruderLayerProps={{
            fontSize: 28,
            iconSize: 52
          }}
          class='mfd-trafficmap'
        />
      </div>
    );
  }
}
