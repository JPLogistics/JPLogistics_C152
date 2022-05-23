import { Subject } from 'msfssdk';
import { FlightPlanFocus } from '../../UI/FPL/FPLTypesAndProps';

/**
 *
 */
export class MapFlightPlanFocusModule {
  /**
   * Whether focus is active.
   */
  public readonly isActive = Subject.create(false);

  /**
   * Whether the flight plan has focus.
   */
  public readonly isFocused = Subject.create(false);

  /**
   * The flight plan focus.
   */
  public readonly focus = Subject.create<FlightPlanFocus>(null);
}