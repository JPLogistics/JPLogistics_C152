import { ICAO } from 'msfssdk/navigation';
import { FPLStringHeader } from './FPLStringHeader';

/**
 * An FPL section header for destination segments.
 */
export class FPLHeaderDestination extends FPLStringHeader {
  /** @inheritdoc */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public setCollapsed(setCollapsed: boolean): void {
    //noop
  }

  /** @inheritdoc */
  protected updateName(): void {
    let name;
    const plan = this.props.fms.getFlightPlan();
    const destination = plan.destinationAirport;
    const hasRunway = plan.procedureDetails.destinationRunway != undefined;

    if (destination && destination !== undefined && (plan.procedureDetails.arrivalIndex > -1 || plan.procedureDetails.approachIndex > -1)) {
      name = 'Destination – ' + ICAO.getIdent(destination);
    } else if (destination && destination !== undefined && !hasRunway) {
      name = 'Destination – RW _ _';
    } else if (destination && destination !== undefined && hasRunway) {
      name = 'Destination – ' + ICAO.getIdent(destination);
    } else {
      name = 'Destination – _ _ _ _';
    }

    this.textSub.set(name);
  }
}