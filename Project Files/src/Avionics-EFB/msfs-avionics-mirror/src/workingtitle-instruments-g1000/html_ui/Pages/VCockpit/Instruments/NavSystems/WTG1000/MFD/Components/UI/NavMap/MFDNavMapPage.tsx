import { FSComponent, Subject, VNode } from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import { FlightPlanner } from 'msfssdk/flightplan';

import { MapRangeSettings } from '../../../../Shared/Map/MapRangeSettings';
import { MapDeclutterSettingMode, MapUserSettings } from '../../../../Shared/Map/MapUserSettings';
import { TrafficAdvisorySystem } from '../../../../Shared/Traffic/TrafficAdvisorySystem';
import { NavMapModel } from '../../../../Shared/UI/NavMap/NavMapModel';
import { FmsHEvent } from '../../../../Shared/UI/FmsHEvent';
import { MFDUiPage, MFDUiPageProps } from '../MFDUiPage';
import { MFDNavMapComponent } from './MFDNavMapComponent';
import { MFDPageMenuDialog } from '../MFDPageMenuDialog';

import './MFDNavMapPage.css';
import { MapPointerController } from '../../../../Shared/Map/Controllers/MapPointerController';

/**
 * Component props for MFDNavMapPage.
 */
export interface MFDNavMapPageProps extends MFDUiPageProps {
  /** The event bus. */
  bus: EventBus;

  /** An instance of the flight planner. */
  flightPlanner: FlightPlanner;

  /** The G1000 traffic advisory system. */
  tas: TrafficAdvisorySystem;
}

/**
 * A page which displays the navigation map.
 */
export class MFDNavMapPage extends MFDUiPage<MFDNavMapPageProps> {
  private static readonly DECLUTTER_TEXT = {
    [MapDeclutterSettingMode.All]: 'All',
    [MapDeclutterSettingMode.Level3]: '3',
    [MapDeclutterSettingMode.Level2]: '2',
    [MapDeclutterSettingMode.Level1]: '1',
  };

  private static readonly UPDATE_FREQ = 30; // Hz
  private static readonly POINTER_MOVE_INCREMENT = 5; // pixels

  private readonly mapRef = FSComponent.createRef<MFDNavMapComponent>();

  private readonly mapModel = NavMapModel.createModel(this.props.bus, this.props.tas);
  private readonly pointerModule = this.mapModel.getModule('pointer');

  private readonly mapSettingManager = MapUserSettings.getMfdManager(this.props.bus);
  private readonly mapRangeSettingManager = MapRangeSettings.getManager(this.props.bus);
  private readonly mapRangeSetting = this.mapRangeSettingManager.getSetting('mfdMapRangeIndex');

  private mapPointerController?: MapPointerController;

  private readonly pageMenuItems = [
    {
      id: 'map-settings',
      renderContent: (): VNode => <span>Map Settings</span>,
      action: (): void => {
        this.props.viewService.open('MapSettings', false);
      }
    },
    {
      id: 'declutter',
      renderContent: (): VNode => <span>Declutter (Current Detail {MFDNavMapPage.DECLUTTER_TEXT[this.mapSettingManager.getSetting('mapDeclutter').value]})</span>,
      action: (): void => {
        const setting = this.mapSettingManager.getSetting('mapDeclutter');
        switch (setting.value) {
          case MapDeclutterSettingMode.All:
            setting.value = MapDeclutterSettingMode.Level3;
            break;
          case MapDeclutterSettingMode.Level3:
            setting.value = MapDeclutterSettingMode.Level2;
            break;
          case MapDeclutterSettingMode.Level2:
            setting.value = MapDeclutterSettingMode.Level1;
            break;
          case MapDeclutterSettingMode.Level1:
            setting.value = MapDeclutterSettingMode.All;
            break;
        }
      }
    },
    {
      id: 'measure-brg-dist',
      renderContent: (): VNode => <span>Measure Bearing/Distance</span>,
      isEnabled: false
    },
    {
      id: 'charts',
      renderContent: (): VNode => <span>Charts</span>,
      isEnabled: false
    },
    {
      id: 'hide-vsd',
      renderContent: (): VNode => <span>Hide VSD</span>,
      isEnabled: false
    },
  ];

  /** @inheritdoc */
  constructor(props: MFDNavMapPageProps) {
    super(props);

    this._title.set('Map – Navigation Map');
  }

  /** @inheritdoc */
  public onAfterRender(thisNode: VNode): void {
    super.onAfterRender(thisNode);

    this.mapPointerController = new MapPointerController(this.mapModel, this.mapRef.instance.mapProjection);
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
      case FmsHEvent.JOYSTICK_PUSH:
        this.mapPointerController?.togglePointerActive();
        return true;
    }

    return this.handleMapPointerMoveEvent(evt) || super.onInteractionEvent(evt);
  }

  /**
   * Changes the MFD map range index setting.
   * @param delta The change in index to apply.
   */
  private changeMapRangeIndex(delta: number): void {
    const newIndex = Utils.Clamp(this.mapRangeSetting.value + delta, 0, this.mapModel.getModule('range').nominalRanges.get().length - 1);

    if (this.mapRangeSetting.value !== newIndex) {
      this.mapPointerController?.targetPointer();
      this.mapRangeSetting.value = newIndex;
    }
  }

  /**
   * Handles events that move the map pointer.
   * @param evt The event.
   * @returns Whether the event was handled.
   */
  private handleMapPointerMoveEvent(evt: FmsHEvent): boolean {
    if (!this.pointerModule.isActive.get()) {
      return false;
    }

    switch (evt) {
      case FmsHEvent.JOYSTICK_LEFT:
        this.mapPointerController?.movePointer(-MFDNavMapPage.POINTER_MOVE_INCREMENT, 0);
        return true;
      case FmsHEvent.JOYSTICK_UP:
        this.mapPointerController?.movePointer(0, -MFDNavMapPage.POINTER_MOVE_INCREMENT);
        return true;
      case FmsHEvent.JOYSTICK_RIGHT:
        this.mapPointerController?.movePointer(MFDNavMapPage.POINTER_MOVE_INCREMENT, 0);
        return true;
      case FmsHEvent.JOYSTICK_DOWN:
        this.mapPointerController?.movePointer(0, MFDNavMapPage.POINTER_MOVE_INCREMENT);
        return true;
    }

    return false;
  }

  /** @inheritdoc */
  protected onViewOpened(): void {
    super.onViewOpened();

    this.props.viewService.clearPageHistory();

    this.props.menuSystem.clear();
    this.props.menuSystem.pushMenu('navmap-root');

    this.mapRef.instance.wake();
  }

  /** @inheritdoc */
  protected onViewClosed(): void {
    super.onViewClosed();

    this.mapPointerController?.setPointerActive(false);
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
        <MFDNavMapComponent
          ref={this.mapRef} model={this.mapModel} bus={this.props.bus}
          updateFreq={Subject.create(MFDNavMapPage.UPDATE_FREQ)}
          dataUpdateFreq={Subject.create(MFDNavMapPage.UPDATE_FREQ)}
          projectedWidth={876} projectedHeight={734}
          deadZone={new Float64Array([0, 56, 0, 0])} flightPlanner={this.props.flightPlanner}
          id='mfd_navmap' bingId='mfd_page_map'
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
      </div>
    );
  }
}
