import { VNode, FSComponent } from 'msfssdk';
import { Fms } from '../../../../Shared/FlightPlan/Fms';
import { FPLHeaderArrival } from '../../../../Shared/UI/FPL/FPLHeaderArrival';
import { FPLSection } from './FPLSection';
import { FmsUtils } from '../../../../Shared/FlightPlan/FmsUtils';
import { ControlList } from '../../../../Shared/UI/ControlList';

/**
 * Render the arrival phase of a flight plan.
 */
export class FPLArrival extends FPLSection {
  /** @inheritdoc */
  protected getEmptyRowVisbility(): boolean {
    return false;
  }

  /**
   * Callback for when CLR is pressed on the header.
   * @returns true if event was handled, false otherwise.
   */
  public onClrHeader = (): boolean => {
    const plan = this.props.fms.getPrimaryFlightPlan();
    const airport = this.props.facilities.arrivalFacility;
    const arrival = airport?.arrivals[plan.procedureDetails.arrivalIndex];

    if (arrival) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const name = FmsUtils.getArrivalNameAsString(airport!, arrival, plan.procedureDetails.arrivalTransitionIndex, plan.procedureDetails.destinationRunway);
      Fms.viewService.open('MessageDialog', true).setInput({ inputString: `Remove ${name} from flight plan?`, hasRejectButton: true })
        .onAccept.on((sender, accept) => {
          if (accept) {
            this.props.fms.removeArrival();
            return true;
          }
        });
    }
    return false;
  }

  /** @inheritdoc */
  protected onHeaderFocused(): void {
    super.onHeaderFocused();

    const focus = this.segment?.legs.length ? this.segment.legs : this.getFlightPlanFocusWhenEmpty();
    this.props.onFlightPlanFocusSelected && this.props.onFlightPlanFocusSelected(focus);
  }

  /** @inheritdoc */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public collapseLegs(setHidden: boolean): void {
    //noop
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div id='fpln-arrival'>
        <FPLHeaderArrival
          ref={this.headerRef} onClr={this.onClrHeader}
          fms={this.props.fms} facilities={this.props.facilities}
          onFocused={this.onHeaderFocused.bind(this)} scrollContainer={this.props.scrollContainer}
        />
        <ControlList
          ref={this.listRef} data={this.legs}
          renderItem={this.renderItem}
          onItemSelected={this.onLegItemSelected.bind(this)}
          hideScrollbar scrollContainer={this.props.scrollContainer}
        />
      </div>
    );
  }
}