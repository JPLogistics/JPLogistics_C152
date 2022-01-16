import { Subject } from 'msfssdk';
import { FlightPlan } from 'msfssdk/flightplan';
import { SelectDepartureStore } from '../../../../../Shared/UI/Procedure/DepArr/SelectDepartureStore';

/**
 * A data store for the MFD departure selection component.
 */
export class MFDSelectDepartureStore extends SelectDepartureStore {
  public readonly transitionPreviewPlan = Subject.create<FlightPlan | null>(null);
}