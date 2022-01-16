import { EventBus } from 'msfssdk/data';
import { BasicAvionicsSystem } from './BasicAvionicsSystem';
import { AvionicsSystemStateEvent } from './G1000AvionicsSystem';

/**
 * The GTX transponder system.
 */
export class TransponderSystem extends BasicAvionicsSystem<TransponderSystemEvents> {
  protected initializationTime = 12000;

  /**
   * Creates an instance of the TransponderSystem.
   * @param index The index of the system.
   * @param bus The instance of the event bus for the system to use.
   */
  constructor(public readonly index: number, protected readonly bus: EventBus) {
    super(index, bus, 'transponder_state');
    this.connectToPower('elec_av1_bus');
  }
}

/**
 * Events fired by the transponder system.
 */
export interface TransponderSystemEvents {
  /** An event fired when the AHRS system state changes. */
  'transponder_state': AvionicsSystemStateEvent;
}