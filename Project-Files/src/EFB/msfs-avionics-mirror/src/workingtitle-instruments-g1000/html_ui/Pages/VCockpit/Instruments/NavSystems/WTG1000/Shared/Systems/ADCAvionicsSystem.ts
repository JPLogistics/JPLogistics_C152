import { EventBus } from 'msfssdk/data';
import { BasicAvionicsSystem } from './BasicAvionicsSystem';
import { AvionicsSystemStateEvent } from './G1000AvionicsSystem';

/**
 * The air data computer system.
 */
export class ADCAvionicsSystem extends BasicAvionicsSystem<ADCSystemEvents> {
  protected initializationTime = 15000;

  /**
   * Creates an instance of the ADCAvionicsSystem.
   * @param index The index of the system.
   * @param bus The instance of the event bus for the system to use.
   */
  constructor(public readonly index: number, protected readonly bus: EventBus) {
    super(index, bus, 'adc_state');
    this.connectToPower('elec_av1_bus');
  }
}

/**
 * Events fired by the ADC system.
 */
export interface ADCSystemEvents {
  /** An event fired when the AHRS system state changes. */
  'adc_state': AvionicsSystemStateEvent;
}