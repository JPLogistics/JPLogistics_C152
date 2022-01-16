import { VNode, FSComponent } from 'msfssdk';
import { FlightPlanSegmentType } from 'msfssdk/flightplan';
import { Fms } from '../../../../Shared/FlightPlan/Fms';
import { FPLEmptyRow } from '../../../../Shared/UI/FPL/FPLEmptyRow';
import { FPLHeaderEnroute } from '../../../../Shared/UI/FPL/FPLHeaderEnroute';
import { FPLSection } from './FPLSection';
import { FixLegInfo } from '../../../../Shared/UI/FPL/FPLTypesAndProps';
import { ControlList } from '../../../../Shared/UI/ControlList';

/** Render the enroute phase of the flight plan. */
export class FPLEnroute extends FPLSection {
  public isCollapsed = false;

  /** @inheritdoc */
  protected getEmptyRowVisbility(): boolean {
    let showEmptyRow = true;
    const plan = this.props.fms.getFlightPlan();
    const segmentIndex = this.segmentIndex.get();
    if (this.segment?.airway !== undefined) {
      showEmptyRow = false;
    } else if (segmentIndex + 1 < plan.segmentCount && plan.getSegment(segmentIndex + 1).airway !== undefined) {
      showEmptyRow = false;
    }
    return showEmptyRow;
  }

  /**
   * Adds a leg to the flight plan display segment.
   * @param index The index to add at.
   * @param leg The leg to add.
   */
  public addLeg(index: number, leg: FixLegInfo): void {
    super.addLeg(index, leg);

    this.updateHeader();
    this.updateAirwayLegs();
  }

  /**
   * Removes a leg from the flight plan display segment.
   * @param index The index to remove at.
   */
  public removeLeg(index: number): void {
    super.removeLeg(index);

    this.updateHeader();
    this.updateAirwayLegs();
  }

  /**
   * Updates this section's airway legs.
   */
  protected updateAirwayLegs(): void {
    if (this.segment?.airway === undefined) {
      return;
    }

    for (let l = 0; l < this.legs.length; l++) {
      const leg = this.legs.tryGet(l);
      if (leg) {
        const info = { isAirwayFix: true } as any;
        leg.apply({ isAirwayFix: true });
        if (leg.get().legDefinition.name == this.segment?.airway.split('.')[1]) {
          info.isAirwayExitFix = true;
        }
        leg.apply(info);
      }
    }
  }

  /**
   * Method called to collapse or uncollapse this section.
   * @param setCollapsed is whether to set the legs hidden or not
   */
  public collapseLegs(setCollapsed: boolean): void {
    for (let i = 0; i < this.legs.getArray().length; i++) {
      const leg = this.legs.tryGet(i);
      if (leg !== undefined) {
        leg.apply({ isCollapsed: setCollapsed });
      }
    }
    this.isCollapsed = setCollapsed;
    this.headerRef.instance.setCollapsed(setCollapsed);
  }

  /**
   * Callback firing when CLR on the header is pressed.
   * @returns true if CLR is handeled, false if not.
   */
  protected onClrHeader = (): boolean => {
    if (this.segment !== undefined && this.segment.airway !== undefined) {
      Fms.viewService.open('MessageDialog', true).setInput({ inputString: `Remove ${this.segment.airway} from flight plan?`, hasRejectButton: true })
        .onAccept.on((sender, accept) => {
          if (accept) {
            this.props.fms.removeAirway(this.segmentIndex.get());
            return true;
          }
        });
    }
    return false;
  }

  /** @inheritdoc */
  protected onHeaderFocused(): void {
    super.onHeaderFocused();

    let focus = null;

    if (this.segment?.airway === undefined) {
      const plan = this.props.fms.getFlightPlan();
      for (const segment of plan.segmentsOfType(FlightPlanSegmentType.Enroute)) {
        if (segment.legs.length > 0) {
          (focus ??= []).push(...segment.legs);
        }
      }
    } else {
      focus = this.segment?.legs ?? null;
    }

    this.props.onFlightPlanFocusSelected && this.props.onFlightPlanFocusSelected(focus);
  }

  /**
   * Render an enroute container.
   * @returns a VNode
   */
  public render(): VNode {
    return (
      <div id='fpln-enroute'>
        <FPLHeaderEnroute
          ref={this.headerRef} facilities={this.props.facilities}
          fms={this.props.fms} onClr={this.onClrHeader} segmentIndex={this.segmentIndex}
          onFocused={this.onHeaderFocused.bind(this)} scrollContainer={this.props.scrollContainer}
        />
        <ControlList
          ref={this.listRef} data={this.legs}
          renderItem={this.renderItem}
          onItemSelected={this.onLegItemSelected.bind(this)}
          hideScrollbar scrollContainer={this.props.scrollContainer}
        />
        <FPLEmptyRow
          ref={this.emptyRowRef} onUpperKnobInc={this.onUpperKnobLegBase}
          onFocused={this.onEmptyRowFocused.bind(this)} scrollContainer={this.props.scrollContainer}
        />
      </div>
    );
  }
}