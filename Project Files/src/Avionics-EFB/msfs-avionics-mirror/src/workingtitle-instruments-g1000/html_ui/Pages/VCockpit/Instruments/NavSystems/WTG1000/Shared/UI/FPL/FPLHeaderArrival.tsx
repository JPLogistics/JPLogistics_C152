import { FmsUtils } from '../../FlightPlan/FmsUtils';
import { FPLStringHeader } from './FPLStringHeader';

/**
 * An FPL section header for arrivals.
 */
export class FPLHeaderArrival extends FPLStringHeader {
  /** @inheritdoc */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public setCollapsed(setCollapsed: boolean): void {
    //noop
  }

  /** @inheritdoc */
  protected updateName(): void {
    let name;

    const plan = this.props.fms.getPrimaryFlightPlan();
    const arrival = this.props.facilities.arrivalFacility?.arrivals[plan.procedureDetails.arrivalIndex];

    if (arrival) {
      name = FmsUtils.getArrivalNameAsString(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.props.facilities.arrivalFacility!, arrival, plan.procedureDetails.arrivalTransitionIndex, plan.procedureDetails.destinationRunway
      );
    } else {
      name = '';
    }

    this.textSub.set(name);
  }
}