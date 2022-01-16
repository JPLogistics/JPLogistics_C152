import { EventBus } from 'msfssdk/data';
import { ElectricalEvents } from 'msfssdk/instruments';
import { AvionicsSystemState, AvionicsSystemStateEvent, G1000AvionicsSystem } from './G1000AvionicsSystem';

/** A type that pulls keys that have avionics state events from a supplied generic type. */
type StateEventsOnly<T> = {
  [K in keyof T as T[K] extends AvionicsSystemStateEvent ? K : never]: T[K]
}

/**
 * A basic avionics system with a fixed initialization time and logic.
 */
export abstract class BasicAvionicsSystem<T extends Record<string, any>> implements G1000AvionicsSystem {

  /** @inheritdoc */
  public state: AvionicsSystemState | undefined;

  /** The time it takes in milliseconds for the system to initialize. */
  protected initializationTime = 0;

  /** A timeout after which initialization will be complete. */
  protected initializationTimeout: number | undefined;

  /** Whether or not the system is powered. */
  protected isPowered: boolean | undefined;

  /**
   * Creates an instance of a BasicAvionicsSystem.
   * @param index The index of the system.
   * @param bus The instance of the event bus for the system to use.
   * @param stateEvent The key of the state update event to send on state update.
   */
  constructor(public readonly index: number, protected readonly bus: EventBus, protected readonly stateEvent: keyof StateEventsOnly<T>) { }

  /** @inheritdoc */
  public onUpdate(): void { /* Noop */ }

  /**
   * Connects the system to the first avionics power bus.
   * @param key The electrical event key to connect to.
   */
  protected connectToPower(key: keyof ElectricalEvents): void {
    this.bus.getSubscriber<ElectricalEvents>()
      .on(key)
      .whenChanged()
      .handle(this.onPowerChanged.bind(this));
  }

  /**
   * Sets the state of the avionics system and publishes the change.
   * @param state The new state to change to.
   */
  protected setState(state: AvionicsSystemState): void {
    if (this.state !== state) {
      this.bus.pub(this.stateEvent as string, { index: this.index, previous: this.state, current: state });
      this.state = state;
    }
  }

  /**
   * A callback called when the connected power state of the avionics system changes.
   * @param isPowered Whether or not the system is powered.
   */
  protected onPowerChanged(isPowered: boolean): void {
    if (this.isPowered === undefined) {
      clearTimeout(this.initializationTimeout);
      if (isPowered) {
        this.setState(AvionicsSystemState.On);
      } else {
        this.setState(AvionicsSystemState.Off);
      }
    } else {
      if (isPowered) {
        this.setState(AvionicsSystemState.Initailizing);
        this.initializationTimeout = setTimeout(() => this.setState(AvionicsSystemState.On), this.initializationTime) as unknown as number;
      } else {
        clearTimeout(this.initializationTimeout);
        this.setState(AvionicsSystemState.Off);
      }
    }

    this.isPowered = isPowered;
  }
}