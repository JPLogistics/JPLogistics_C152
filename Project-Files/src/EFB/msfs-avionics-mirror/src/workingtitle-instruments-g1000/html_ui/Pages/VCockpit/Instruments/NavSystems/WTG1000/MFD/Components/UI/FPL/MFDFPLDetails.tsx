import { FSComponent, Subject, VNode } from 'msfssdk';
import { BlurReconciliation } from 'msfssdk/components/controls';

import { FPLDetailProps, FPLDetails } from '../../../../PFD/Components/UI/FPL/FPLDetails';
import { FPLOrigin } from '../../../../PFD/Components/UI/FPL/FPLSectionOrigin';
import { ScrollBar } from '../../../../Shared/UI/ScrollBar';
import { FplActiveLegArrow } from '../../../../Shared/UI/UIControls/FplActiveLegArrow';
import { GroupBox } from '../GroupBox';
import { FlightPlanFocus, FlightPlanSelection } from '../../../../Shared/UI/FPL/FPLTypesAndProps';
import { G1000ControlList } from '../../../../Shared/UI/G1000UiControl';

/** Component props for MFDFPLDetails */
export interface MFDFPLDetailProps extends FPLDetailProps {
  /** A subject to provide the selected flight plan element. */
  selection: Subject<FlightPlanSelection>;

  /** A subject to provide the flight plan focus. */
  focus: Subject<FlightPlanFocus>;
}

/**
 * FPLDetails holds the core logic of the flight plan display and interacts with button events.
 */
export class MFDFPLDetails extends FPLDetails<MFDFPLDetailProps> {
  public isExtendedView = true;

  /** Called when the fpl view is opened. */
  public fplViewOpened(): void {
    super.fplViewOpened(false);

    this.controller.legArrowRef.instance.updateArrows(this.store.activeLegState.get(), this.store.activeLeg.get(), this.props.fms.getFlightPlan());
  }

  /** @inheritdoc */
  protected onFlightPlanElementSelected(selection: FlightPlanSelection): void {
    this.props.selection.set(selection);
  }

  /** @inheritdoc */
  protected onFlightPlanFocusSelected(focus: FlightPlanFocus): void {
    this.props.focus.set(focus);
  }

  /**
   * Render the component.
   * @returns The component VNode.
   */
  public render(): VNode {
    return (
      <div ref={this.fplDetailsContainer}>
        <GroupBox title="Active Flight Plan" class='mfd-fpl-plan-box'>
          <FPLOrigin ref={this.controller.originRef} />
          <br />
          <div>
            <span id="dtk" class="smallText white">DTK</span>
            <span id="dis" class="smallText white">DIS</span>
            <span id="alt" class="smallText white">ALT</span>
          </div>
          <hr class="mfd-flightplan-hr" />
          <div class='mfd-fpln-container' style="height:320px;" ref={this.fplnContainer}>
            <G1000ControlList
              ref={this.sectionListRef} data={this.store.segments}
              renderItem={this.renderItem.bind(this)}
              reconcileChildBlur={(): BlurReconciliation => BlurReconciliation.Next}
              requireChildFocus
            />
            <FplActiveLegArrow ref={this.controller.legArrowRef} getLegDomLocation={this.getListElementTopLocation} />
          </div>
          <ScrollBar />
        </GroupBox>
      </div>
    );
  }
}