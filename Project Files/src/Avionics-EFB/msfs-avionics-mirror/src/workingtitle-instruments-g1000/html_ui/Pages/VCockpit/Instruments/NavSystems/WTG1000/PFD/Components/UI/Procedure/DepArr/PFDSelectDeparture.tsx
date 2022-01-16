import { DepartureProcedure } from 'msfssdk/navigation';
import { SelectDepartureController } from '../../../../../Shared/UI/Procedure/DepArr/SelectDepartureController';
import { SelectDepartureStore } from '../../../../../Shared/UI/Procedure/DepArr/SelectDepartureStore';
import { PFDSelectDepArr } from './PFDSelectDepArr';

/**
 * A PFD component for selecting departures.
 */
export class PFDSelectDeparture extends PFDSelectDepArr<DepartureProcedure> {
  /** @inheritdoc */
  protected createStore(): SelectDepartureStore {
    return new SelectDepartureStore();
  }

  /** @inheritdoc */
  protected createController(store: SelectDepartureStore): SelectDepartureController {
    return new SelectDepartureController(store, this.gotoNextSelect.bind(this), this.props.fms, this.props.calculator);
  }

  /** @inheritdoc */
  protected getProcLabel(): string {
    return 'Departure';
  }
}