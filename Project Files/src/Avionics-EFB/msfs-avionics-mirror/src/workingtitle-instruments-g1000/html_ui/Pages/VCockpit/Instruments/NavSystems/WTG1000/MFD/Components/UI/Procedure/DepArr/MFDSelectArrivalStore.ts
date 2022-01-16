import { Subject } from 'msfssdk';
import { FlightPlan } from 'msfssdk/flightplan';
import { SelectArrivalStore } from '../../../../../Shared/UI/Procedure/DepArr/SelectArrivalStore';

/**
 * A data store for the MFD departure selection component.
 */
export class MFDSelectArrivalStore extends SelectArrivalStore {
  public readonly transitionPreviewPlan = Subject.create<FlightPlan | null>(null);
}