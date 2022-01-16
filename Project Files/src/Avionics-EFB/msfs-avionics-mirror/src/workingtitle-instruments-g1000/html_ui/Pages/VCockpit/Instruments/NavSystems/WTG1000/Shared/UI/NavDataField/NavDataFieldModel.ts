import { Subscribable } from 'msfssdk';

/**
 * A data model for a navigation data field.
 */
export interface NavDataFieldModel<T> {
  /** A subscribable which provides this model's value. */
  readonly value: Subscribable<T>;
}