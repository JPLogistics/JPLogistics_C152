import { VNode, FSComponent } from 'msfssdk';
import { AirportFacility, ICAO } from 'msfssdk/navigation';

import { FixInfo } from './FixInfo';
import { FPLEmptyRow } from '../../../../Shared/UI/FPL/FPLEmptyRow';
import { FPLHeaderDestination } from '../../../../Shared/UI/FPL/FPLHeaderDestination';
import { FPLSection } from './FPLSection';
import { SetRunway } from '../../../../Shared/UI/SetRunway/SetRunway';
import { G1000UiControl } from '../../../../Shared/UI/G1000UiControl';

/**
 * Render the destination info for a flight plan.
 */
export class FPLDestination extends FPLSection {
  /** @inheritdoc */
  protected getEmptyRowVisbility(): boolean {
    const plan = this.props.fms.getFlightPlan();
    const destination = plan.destinationAirport;
    const hasRunway = plan.procedureDetails.destinationRunway != undefined;
    const noAppArr = plan.procedureDetails.arrivalIndex < 0 && plan.procedureDetails.approachIndex < 0;
    return noAppArr && !hasRunway && (!destination || destination == '');
  }

  /** @inheritdoc */
  protected onUpperKnobLegBase = (source: G1000UiControl): boolean => {
    const legIndex = this.listRef.instance.indexOf(source);
    const plan = this.props.fms.getFlightPlan();
    const destination = plan.destinationAirport;
    if (destination && legIndex == 0) {
      this.props.viewService.open<SetRunway>('SetRunway', true).setInput(this.props.facilities.destinationFacility as AirportFacility)
        .onAccept.on((subSender, data) => {
          this.props.fms.setDestination(this.props.facilities.destinationFacility, data);
        });
    }

    return true;
  };

  /**
   * Callback firing when upper knob event on the header is fired.
   * @returns True if handled, false otherwise.
   */
  protected onUpperKnobEmptyRow = (): boolean => {
    const plan = this.props.fms.getFlightPlan();
    const destination = plan.destinationAirport;
    if (!destination || destination === undefined) {
      // EMPTY ROW
      this.props.viewService.open('WptInfo', true)
        .onAccept.on((sender, fac: AirportFacility) => {
          this.props.fms.setDestination(fac as AirportFacility);
          this.props.viewService.open<SetRunway>('SetRunway', true).setInput(fac as AirportFacility).onAccept.on((subSender, data) => {
            this.props.fms.setDestination(this.props.facilities.destinationFacility, data);
          });
        });
    }

    return true;
  };

  /** @inheritdoc */
  protected onClrLeg = (source: G1000UiControl): boolean => {
    const legIndex = this.listRef.instance.indexOf(source);
    const plan = this.props.fms.getFlightPlan();
    const destination = plan.destinationAirport;
    if (destination && legIndex == 0) {
      this.props.viewService.open('MessageDialog', true).setInput({ inputString: `Remove ${ICAO.getIdent(destination)}?`, hasRejectButton: true }).onAccept.on((sender, accept) => {
        if (accept) {
          this.props.fms.setDestination(undefined);
          return true;
        }
      });
    } else {
      return this.onClrLegBase(source as FixInfo);
    }
    return false;
  };

  /** @inheritdoc */
  protected onHeaderFocused(): void {
    super.onHeaderFocused();

    const destination = this.props.facilities.destinationFacility;
    const focus = destination ?? this.getFlightPlanFocusWhenEmpty();
    this.props.onFlightPlanFocusSelected && this.props.onFlightPlanFocusSelected(focus);
  }

  /** @inheritdoc */
  public collapseLegs(): void {
    //noop
  }

  /**
   * Render a destination line.
   * @returns a VNode
   */
  public render(): VNode {
    return (
      <div id='fpln-destination'>
        <FPLHeaderDestination
          ref={this.headerRef} fms={this.props.fms} facilities={this.props.facilities} segment={this.segment}
          onFocused={this.onHeaderFocused.bind(this)} scrollContainer={this.props.scrollContainer}
        />
        {this.renderLegList()}
        <FPLEmptyRow
          ref={this.emptyRowRef} onUpperKnobInc={this.onUpperKnobEmptyRow}
          onFocused={this.onEmptyRowFocused.bind(this)} scrollContainer={this.props.scrollContainer}
        />
      </div>
    );
  }
}