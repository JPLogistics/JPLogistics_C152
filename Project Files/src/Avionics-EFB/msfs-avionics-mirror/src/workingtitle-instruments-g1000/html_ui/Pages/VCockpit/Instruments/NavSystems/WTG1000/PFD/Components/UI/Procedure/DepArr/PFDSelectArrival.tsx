import { ArrivalProcedure } from 'msfssdk/navigation';
import { SelectArrivalController } from '../../../../../Shared/UI/Procedure/DepArr/SelectArrivalController';
import { SelectArrivalStore } from '../../../../../Shared/UI/Procedure/DepArr/SelectArrivalStore';
import { PFDSelectDepArr } from './PFDSelectDepArr';

/**
 * A PFD component for selecting arrivals.
 */
export class PFDSelectArrival extends PFDSelectDepArr<ArrivalProcedure> {
  /** @inheritdoc */
  protected createStore(): SelectArrivalStore {
    return new SelectArrivalStore();
  }

  /** @inheritdoc */
  protected createController(store: SelectArrivalStore): SelectArrivalController {
    return new SelectArrivalController(store, this.gotoNextSelect.bind(this), this.props.fms, this.props.calculator);
  }

  /** @inheritdoc */
  protected getProcLabel(): string {
    return 'Departure';
  }
}