import { FSComponent, DisplayComponent, VNode, NodeReference, Subject } from 'msfssdk';
import { EventBus, HEvent } from 'msfssdk/data';
import { FlightPlanner } from 'msfssdk/flightplan';

import { NavMapModel } from '../../../Shared/UI/NavMap/NavMapModel';
import { TrafficAdvisorySystem } from '../../../Shared/Traffic/TrafficAdvisorySystem';
import { PFDInsetNavMapComponent } from './PFDInsetNavMapComponent';
import { MapRangeSettings } from '../../../Shared/Map/MapRangeSettings';
import { PfdMapLayoutSettingMode, PFDUserSettings } from '../../PFDUserSettings';
import { MapUserSettings } from '../../../Shared/Map/MapUserSettings';

import './MapInset.css';
import { MapPointerController } from '../../../Shared/Map/Controllers/MapPointerController';
import { InstrumentEvents } from 'msfssdk/instruments';

/**
 * The properties on the map inset component.
 */
interface MapInsetProps {

  /** An instance of the event bus. */
  bus: EventBus;

  /** An instance of the flight planner. */
  flightPlanner: FlightPlanner;

  /** The G1000 traffic advisory system. */
  tas: TrafficAdvisorySystem;
}

/**
 * The PFD map inset overlay.
 */
export class MapInset extends DisplayComponent<MapInsetProps> {
  private static readonly UPDATE_FREQ = 30; // Hz
  private static readonly DATA_UPDATE_FREQ = 4; // Hz
  private static readonly POINTER_MOVE_INCREMENT = 2; // pixels

  private readonly el = new NodeReference<HTMLDivElement>();
  private readonly mapRef = FSComponent.createRef<PFDInsetNavMapComponent>();

  private readonly mapModel = NavMapModel.createModel(this.props.bus, this.props.tas);
  private readonly pointerModule = this.mapModel.getModule('pointer');

  private readonly mapRangeSettingManager = MapRangeSettings.getManager(this.props.bus);
  private readonly mapRangeSetting = this.mapRangeSettingManager.getSetting('pfdMapRangeIndex');

  private mapPointerController?: MapPointerController;

  /**
   * A callback called after the component renders.
   */
  public onAfterRender(): void {
    this.mapPointerController = new MapPointerController(this.mapModel, this.mapRef.instance.mapProjection);

    this.setVisible(false);

    PFDUserSettings.getManager(this.props.bus).whenSettingChanged('mapLayout').handle((mode) => {
      this.setVisible(mode === PfdMapLayoutSettingMode.Inset || mode === PfdMapLayoutSettingMode.TFC);
    });

    const hEvents = this.props.bus.getSubscriber<HEvent>();
    hEvents.on('hEvent').handle(this.onInteractionEvent.bind(this));

    this.props.bus.getSubscriber<InstrumentEvents>().on('vc_screen_state').handle(state => {
      if (state.current === ScreenState.REVERSIONARY) {
        setTimeout(() => {
          this.el.instance.classList.add('reversionary');
          this.mapRef.instance.setProjectedSize(312, 230);

          this.props.bus.on('mfd_power_on', this.onMfdPowerOn);
        }, 250);
      }
    });
  }

  /**
   * Sets whether or not the inset map is visible.
   * @param isVisible Whether or not the map is visible.
   */
  public setVisible(isVisible: boolean): void {
    if (isVisible) {
      this.el.instance.style.display = '';
      this.mapRef.instance.wake();
    } else {
      this.el.instance.style.display = 'none';
      this.mapPointerController?.setPointerActive(false);
      this.mapRef.instance.sleep();
    }
  }

  /**
   * Handles when the MFD has powered on.
   * @param isPowered Whether the MFD has finished powering up or not.
   */
  private onMfdPowerOn = (isPowered: boolean): void => {
    if (isPowered) {
      setTimeout(() => {
        this.el.instance.classList.remove('reversionary');
        this.mapRef.instance.setProjectedSize(242, 230);

        this.props.bus.off('mfd_power_on', this.onMfdPowerOn);
      }, 250);
    }
  }

  /**
   * A callback which is called when an interaction event occurs.
   * @param hEvent An interaction event.
   */
  private onInteractionEvent(hEvent: string): void {
    if (!this.mapRef.instance.isAwake) {
      return;
    }

    switch (hEvent) {
      case 'AS1000_PFD_RANGE_INC':
        this.changeMapRangeIndex(1);
        break;
      case 'AS1000_PFD_RANGE_DEC':
        this.changeMapRangeIndex(-1);
        break;
      case 'AS1000_PFD_JOYSTICK_PUSH':
        this.mapPointerController?.togglePointerActive();
        break;
      default:
        this.handleMapPointerMoveEvent(hEvent);
    }
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
   * @param hEvent An interaction event.
   */
  private handleMapPointerMoveEvent(hEvent: string): void {
    if (!this.pointerModule.isActive.get()) {
      return;
    }

    switch (hEvent) {
      case 'AS1000_PFD_JOYSTICK_LEFT':
        this.mapPointerController?.movePointer(-MapInset.POINTER_MOVE_INCREMENT, 0);
        break;
      case 'AS1000_PFD_JOYSTICK_UP':
        this.mapPointerController?.movePointer(0, -MapInset.POINTER_MOVE_INCREMENT);
        break;
      case 'AS1000_PFD_JOYSTICK_RIGHT':
        this.mapPointerController?.movePointer(MapInset.POINTER_MOVE_INCREMENT, 0);
        break;
      case 'AS1000_PFD_JOYSTICK_DOWN':
        this.mapPointerController?.movePointer(0, MapInset.POINTER_MOVE_INCREMENT);
        break;
    }
  }

  /**
   * Renders the component.
   * @returns The component VNode.
   */
  public render(): VNode {
    return (
      <div class="map-inset" ref={this.el}>
        <PFDInsetNavMapComponent
          ref={this.mapRef} model={this.mapModel} bus={this.props.bus}
          updateFreq={Subject.create(MapInset.UPDATE_FREQ)}
          dataUpdateFreq={Subject.create(MapInset.DATA_UPDATE_FREQ)}
          projectedWidth={242} projectedHeight={230}
          flightPlanner={this.props.flightPlanner}
          id='pfd_inset_map' bingId='pfd_map'
          ownAirplaneLayerProps={{
            imageFilePath: 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG1000/Assets/own_airplane_icon.svg',
            invalidHeadingImageFilePath: 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG1000/Assets/own_airplane_icon_nohdg.svg',
            iconSize: 30,
            iconAnchor: new Float64Array([0.5, 0]),
            invalidHeadingIconAnchor: new Float64Array([0.5, 0.5])
          }}
          trafficIntruderLayerProps={{
            fontSize: 16,
            iconSize: 30
          }}
          drawEntireFlightPlan={Subject.create(false)}
          class='pfd-insetmap'
          settingManager={MapUserSettings.getPfdManager(this.props.bus)}
        />
      </div>
    );
  }
}
