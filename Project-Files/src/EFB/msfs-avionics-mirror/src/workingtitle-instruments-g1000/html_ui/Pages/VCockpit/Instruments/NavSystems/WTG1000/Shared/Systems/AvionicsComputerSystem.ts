import { ControlEvents, EventBus } from 'msfssdk/data';
import { AlertMessageEvents } from '../../PFD/Components/UI/Alerts/AlertsSubject';
import { NavComUserSettings } from '../NavCom/NavComUserSettings';
import { BasicAvionicsSystem } from './BasicAvionicsSystem';
import { AvionicsSystemStateEvent, AvionicsSystemState } from './G1000AvionicsSystem';

/**
 * The GIA main integrated computer system.
 */
export class AvionicsComputerSystem extends BasicAvionicsSystem<AvionicsComputerSystemEvents> {
  protected initializationTime = 10000;

  /**
   * Creates an instance of the AvionicsComputerSystem.
   * @param index The index of the system.
   * @param bus The instance of the event bus for the system to use.
   */
  constructor(public readonly index: number, protected readonly bus: EventBus) {
    super(index, bus, `avionicscomputer_state_${index}`);
    if (index === 1) {
      this.connectToPower('elec_circuit_navcom1_on');
    } else {
      this.connectToPower('elec_circuit_navcom2_on');
    }
  }

  /** @inheritdoc */
  protected setState(state: AvionicsSystemState): void {
    super.setState(state);

    if (this.index === 1) {
      switch (state) {
        case AvionicsSystemState.On:
          this.bus.getPublisher<AlertMessageEvents>().pub('alerts_remove', 'gps-nav-lost-pos');
          break;
        default:
          this.bus.getPublisher<AlertMessageEvents>().pub('alerts_push', {
            key: 'gps-nav-lost-pos',
            title: 'GPS NAV LOST',
            message: 'Loss of GPS navigation. Position error.'
          });
          break;
      }
    }

    if (state === AvionicsSystemState.On) {
      const comSpacing = NavComUserSettings.getManager(this.bus).getSetting('comSpacing').value;
      this.bus.getPublisher<ControlEvents>().pub('com_spacing_set', { index: this.index, spacing: comSpacing });
    }
  }
}

/**
 * Events fired by the avionics computer system.
 */
export interface AvionicsComputerSystemEvents {
  /** An event fired when the AHRS system state changes. */
  [evt: `avionicscomputer_state_${number}`]: AvionicsSystemStateEvent;
}