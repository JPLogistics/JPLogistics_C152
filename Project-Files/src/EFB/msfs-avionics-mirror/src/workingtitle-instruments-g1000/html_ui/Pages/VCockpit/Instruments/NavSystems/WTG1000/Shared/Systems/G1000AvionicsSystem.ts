/**
 * An interface that describes a basic G1000 avionics system.
 */
export interface G1000AvionicsSystem {
  /** The state of the avionics system. */
  state: AvionicsSystemState | undefined;

  /** A callback to call to update the state of the avionics system. */
  onUpdate(): void;

  /** The index of the system, for multiply redundant systems. */
  readonly index: number
}

/**
 * The state of an avionics system
 */
export enum AvionicsSystemState {
  Off = 'Off',
  Initailizing = 'Initializing',
  On = 'On',
  Failed = 'Failed'
}

/**
 * An event that contains an avionics system state change.
 */
export interface AvionicsSystemStateEvent {
  /** The index of the avionics system. */
  index: number;

  /** The previous system state. */
  previous: AvionicsSystemState | undefined;

  /** The state that the system was changed to. */
  current: AvionicsSystemState;
}