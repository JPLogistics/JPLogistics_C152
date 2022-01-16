import { VNode, FSComponent, Subject } from 'msfssdk';
import { Fms } from '../../../../Shared/FlightPlan/Fms';
import { FPLHeaderApproach } from '../../../../Shared/UI/FPL/FPLHeaderApproach';
import { FPLSection } from './FPLSection';
import { ApproachNameDisplay } from '../../../../Shared/UI/FPL/ApproachNameDisplay';
import { FmsUtils } from '../../../../Shared/FlightPlan/FmsUtils';
import { ControlList } from '../../../../Shared/UI/ControlList';

/**
 * Render the approach phase of a flight plan.
 */
export class FPLApproach extends FPLSection {
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
    const airport = this.props.facilities.destinationFacility;
    const approach = airport ? FmsUtils.getApproachFromPlan(plan, airport) : undefined;

    if (approach) {
      Fms.viewService.open('MessageDialog', true).setInput({
        renderContent: (): VNode => {
          return (
            <div style='display: inline-block;'>Remove <ApproachNameDisplay approach={Subject.create(approach)} /> from flight plan?</div>
          );
        },
        hasRejectButton: true
      })
        .onAccept.on((sender, accept) => {
          if (accept) {
            this.props.fms.removeApproach();
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
      <div id='fpln-approach'>
        <FPLHeaderApproach
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