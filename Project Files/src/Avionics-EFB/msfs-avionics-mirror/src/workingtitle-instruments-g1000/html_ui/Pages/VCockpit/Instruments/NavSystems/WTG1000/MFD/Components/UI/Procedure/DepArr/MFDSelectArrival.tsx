import { ArrivalProcedure } from 'msfssdk/navigation';
import { MFDSelectArrivalController } from './MFDSelectArrivalController';
import { MFDSelectArrivalStore } from './MFDSelectArrivalStore';
import { MFDSelectDepArr, MFDSelectDepArrProps } from './MFDSelectDepArr';

/**
 * An MFD view for selecting arrivals.
 */
export class MFDSelectArrival extends MFDSelectDepArr<ArrivalProcedure, MFDSelectDepArrProps> {
  /** @inheritdoc */
  protected createStore(): MFDSelectArrivalStore {
    return new MFDSelectArrivalStore();
  }

  /** @inheritdoc */
  protected createController(store: MFDSelectArrivalStore): MFDSelectArrivalController {
    return new MFDSelectArrivalController(
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
    return 'Arrival';
  }
}