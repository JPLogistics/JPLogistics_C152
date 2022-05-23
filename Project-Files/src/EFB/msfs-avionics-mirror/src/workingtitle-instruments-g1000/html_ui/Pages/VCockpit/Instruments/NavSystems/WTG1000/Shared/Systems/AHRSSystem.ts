import { EventBus } from 'msfssdk/data';
import { ElectricalEvents } from 'msfssdk/instruments';
import { BasicAvionicsSystem } from './BasicAvionicsSystem';
import { AvionicsSystemState, AvionicsSystemStateEvent } from './G1000AvionicsSystem';
import { MagnetometerSystemEvents } from './MagnetometerSystem';

/**
 * The AHRS system.
 */
export class AHRSSystem extends BasicAvionicsSystem<AHRSSystemEvents> {

  protected initializationTime = 45000;
  private magState: AvionicsSystemState | undefined;

  /**
   * Creates an instance of an AHRS system.
   * @param index The index of the AHRS (1 or 2)
   * @param bus An instance of the event bus.
   */
  constructor(public readonly index: number, protected readonly bus: EventBus) {
    super(index, bus, 'ahrs_state');

    this.bus.getSubscriber<ElectricalEvents>()
      .on('elec_av1_bus')
      .whenChanged()
      .handle(isPowered => this.onStatesChanged(isPowered, this.magState));

    this.bus.getSubscriber<MagnetometerSystemEvents>()
      .on('magnetometer_state')
      .handle(evt => {
        if (evt.index === this.index) {
          this.onStatesChanged(this.isPowered, evt.current);
        }
      });
  }

  /** @inheritdoc */
  public onUpdate(): void {
    /* Nothing to do here */
  }

  /**
   * A callback called when the source states change that are upstream of this system.
   * @param isPowered Whether or not the AHRS is powered.
   * @param magState The current state of the magnetometer.
   */
  private onStatesChanged(isPowered: boolean | undefined, magState: AvionicsSystemState | undefined): void {
    if (this.isPowered === undefined || this.magState === undefined) {
      if (isPowered && magState === AvionicsSystemState.On) {
        this.setState(AvionicsSystemState.On);
      }
    } else {
      if (isPowered) {
        if (magState === AvionicsSystemState.On) {
          this.setState(AvionicsSystemState.Initailizing);
          this.bus.on('roll_deg', this.onRollChanged);

          this.initializationTimeout = setTimeout(() => {
            this.bus.off('roll_deg', this.onRollChanged);
            this.setState(AvionicsSystemState.On);
          }, 45000) as unknown as number;
        } else {
          this.bus.off('roll_deg', this.onRollChanged);
          clearTimeout(this.initializationTimeout);
          this.setState(AvionicsSystemState.Failed);
        }
      } else {
        this.bus.off('roll_deg', this.onRollChanged);
        clearTimeout(this.initializationTimeout);
        this.setState(AvionicsSystemState.Off);
      }
    }

    this.isPowered = isPowered;
    this.magState = magState;
  }

  /**
   * Handles when the bank angle changes while AHRS is initializing.
   * @param bankAngle The bank angle of the aircraft.
   */
  private onRollChanged = (bankAngle: number): void => {
    if (Math.abs(bankAngle) >= 20) {
      clearTimeout(this.initializationTimeout);

      this.initializationTimeout = setTimeout(() => {
        this.bus.off('roll_deg', this.onRollChanged);
        this.setState(AvionicsSystemState.On);
      }, 45000) as unknown as number;
    }
  };
}

/**
 * Events fired by the AHRS system.
 */
export interface AHRSSystemEvents {
  /** An event fired when the AHRS system state changes. */
  'ahrs_state': AvionicsSystemStateEvent;
}