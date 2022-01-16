import { DepartureProcedure } from 'msfssdk/navigation';
import { MFDSelectDepArr, MFDSelectDepArrProps } from './MFDSelectDepArr';
import { MFDSelectDepartureController } from './MFDSelectDepartureController';
import { MFDSelectDepartureStore } from './MFDSelectDepartureStore';

/**
 * An MFD view for selecting departures.
 */
export class MFDSelectDeparture extends MFDSelectDepArr<DepartureProcedure, MFDSelectDepArrProps> {
  /** @inheritdoc */
  protected createStore(): MFDSelectDepartureStore {
    return new MFDSelectDepartureStore();
  }

  /** @inheritdoc */
  protected createController(store: MFDSelectDepartureStore): MFDSelectDepartureController {
    return new MFDSelectDepartureController(
      store,
      this.gotoNextSelect.bind(this),
      this.props.fms,
      this.props.calculator,
      this.props.procedurePlan,
      this.props.transitionPlan,
      this.props.focus
    );
  }

  /** @inheritdoc */
  protected getProcLabel(): string {
    return 'Departure';
  }
}