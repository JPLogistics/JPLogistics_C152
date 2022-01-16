import { VNode, FSComponent } from 'msfssdk';
import { AirportFacility, ICAO, OneWayRunway } from 'msfssdk/navigation';

import { Fms } from '../../../../Shared/FlightPlan/Fms';
import { FixInfo } from './FixInfo';
import { FPLEmptyRow } from '../../../../Shared/UI/FPL/FPLEmptyRow';
import { FPLHeaderDestination } from '../../../../Shared/UI/FPL/FPLHeaderDestination';
import { FPLSection } from './FPLSection';
import { SetRunway } from '../../../../Shared/UI/SetRunway/SetRunway';
import { UiControl2 } from '../../../../Shared/UI/UiControl2';
import { ControlList } from '../../../../Shared/UI/ControlList';

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
  protected onUpperKnobLegBase = (source: UiControl2): boolean => {
    const legIndex = this.listRef.instance.indexOf(source);
    const plan = this.props.fms.getFlightPlan();
    const destination = plan.destinationAirport;
    if (destination && legIndex == 0) {
      Fms.viewService.open('SetRunway', true).setInput(this.props.facilities.destinationFacility as AirportFacility)
        .onAccept.on((subSender: SetRunway, data: OneWayRunway | undefined) => {
          this.props.fms.setDestination(this.props.facilities.destinationFacility, data);
        });
    }

    return true;
  }

  /** 
   * Callback firing when upper knob event on the header is fired. 
   * @returns True if handled, false otherwise.
   */
  protected onUpperKnobEmptyRow = (): boolean => {
    const plan = this.props.fms.getFlightPlan();
    const destination = plan.destinationAirport;
    if (!destination || destination === undefined) {
      // EMPTY ROW
      Fms.viewService.open('WptInfo', true)
        .onAccept.on((sender, fac: AirportFacility) => {
          this.props.fms.setDestination(fac as AirportFacility);
          Fms.viewService.open('SetRunway', true).setInput(fac as AirportFacility).onAccept.on((subSender: SetRunway, data: OneWayRunway | undefined) => {
            this.props.fms.setDestination(this.props.facilities.destinationFacility, data);
          });
        });
    }

    return true;
  }

  /** @inheritdoc */
  protected onClrLeg = (source: UiControl2): boolean => {
    const legIndex = this.listRef.instance.indexOf(source);
    const plan = this.props.fms.getFlightPlan();
    const destination = plan.destinationAirport;
    if (destination && legIndex == 0) {
      Fms.viewService.open('MessageDialog', true).setInput({ inputString: `Remove ${ICAO.getIdent(destination)}?`, hasRejectButton: true }).onAccept.on((sender, accept) => {
        if (accept) {
          this.props.fms.setDestination(undefined);
          return true;
        }
      });
    } else {
      return this.onClrLegBase(source as FixInfo);
    }
    return false;
  }

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
          ref={this.headerRef} fms={this.props.fms} facilities={this.props.facilities}
          onFocused={this.onHeaderFocused.bind(this)} scrollContainer={this.props.scrollContainer}
        />
        <ControlList
          ref={this.listRef} data={this.legs}
          renderItem={this.renderItem}
          onItemSelected={this.onLegItemSelected.bind(this)}
          hideScrollbar scrollContainer={this.props.scrollContainer}
        />
        <FPLEmptyRow
          ref={this.emptyRowRef} onUpperKnobInc={this.onUpperKnobEmptyRow}
          onFocused={this.onEmptyRowFocused.bind(this)} scrollContainer={this.props.scrollContainer}
        />
      </div>
    );
  }
}