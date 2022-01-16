import { EventBus } from 'msfssdk/data';
import { BasicAvionicsSystem } from './BasicAvionicsSystem';
import { AvionicsSystemStateEvent } from './G1000AvionicsSystem';

/**
 * The GEA engine/airframe system.
 */
export class EngineAirframeSystem extends BasicAvionicsSystem<EngineAirframeSystemEvents> {
  protected initializationTime = 12000;

  /**
   * Creates an instance of the EngineAirframeSystem.
   * @param index The index of the system.
   * @param bus The instance of the event bus for the system to use.
   */
  constructor(public readonly index: number, protected readonly bus: EventBus) {
    super(index, bus, 'engineairframe_state');
    this.connectToPower('elec_av1_bus');
  }
}

/**
 * Events fired by the engine/airframe system.
 */
export interface EngineAirframeSystemEvents {
  /** An event fired when the AHRS system state changes. */
  'engineairframe_state': AvionicsSystemStateEvent;
}