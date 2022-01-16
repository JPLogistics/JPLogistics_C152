import { ICAO } from 'msfssdk/navigation';
import { FmsUtils } from '../../FlightPlan/FmsUtils';
import { FPLStringHeader } from './FPLStringHeader';

/**
 * An FPL section header for departures.
 */
export class FPLHeaderDeparture extends FPLStringHeader {
  /** @inheritdoc */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public setCollapsed(setCollapsed: boolean): void {
    //noop
  }

  /** @inheritdoc */
  protected updateName(): void {
    let name;

    const plan = this.props.fms.getPrimaryFlightPlan();
    const origin = plan.originAirport;
    const hasRunway = plan.procedureDetails.originRunway != undefined;

    const departure = this.props.facilities.originFacility?.departures[plan.procedureDetails.departureIndex];
    if (departure && origin !== undefined) {
      name = FmsUtils.getDepartureNameAsString(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.props.facilities.originFacility!, departure, plan.procedureDetails.departureTransitionIndex, plan.procedureDetails.originRunway
      );
    } else if (origin !== undefined && origin != '' && !hasRunway) {
      name = 'Origin – RW _ _';
    } else if (origin && origin !== undefined && hasRunway) {
      name = 'Origin – ' + ICAO.getIdent(origin);
    } else {
      name = 'Origin – _ _ _ _';
    }

    this.textSub.set(name);
  }
}