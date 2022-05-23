import { VNode, FSComponent } from 'msfssdk';
import { AirportFacility, ICAO } from 'msfssdk/navigation';
import { FlightPlanSegmentType } from 'msfssdk/flightplan';

import { FmsUtils } from 'garminsdk/flightplan';
import { SetRunway } from '../../../../Shared/UI/SetRunway/SetRunway';
import { FixInfo } from './FixInfo';
import { FPLEmptyRow } from '../../../../Shared/UI/FPL/FPLEmptyRow';
import { FPLHeaderDeparture } from '../../../../Shared/UI/FPL/FPLHeaderDeparture';
import { FPLSection } from './FPLSection';
import { FlightPlanFocus } from '../../../../Shared/UI/FPL/FPLTypesAndProps';
import { G1000UiControl } from '../../../../Shared/UI/G1000UiControl';
import { WptInfo } from '../../../../Shared/UI/WptInfo/WptInfo';

/**
 * Render the departure phase of the flight plan.
 */
export class FPLDeparture extends FPLSection {
  /** @inheritdoc */
  protected getEmptyRowVisbility(): boolean {
    const plan = this.props.fms.getFlightPlan(0);
    const origin = plan.originAirport;
    const hasRunway = plan.procedureDetails.originRunway != undefined;
    return !hasRunway && (!origin || origin == '');
  }

  /** @inheritdoc */
  protected onUpperKnobLeg = (source: G1000UiControl): boolean => {
    const legIndex = this.listRef.instance.indexOf(source);
    const plan = this.props.fms.getFlightPlan();
    const origin = plan.originAirport;
    if (origin && legIndex === 0) {
      (this.props.viewService.open('SetRunway', true) as SetRunway).setInput(this.props.facilities.originFacility as AirportFacility)
        .onAccept.on((sender, data) => {
          this.props.fms.setOrigin(this.props.facilities.originFacility, data);
        });

      return true;
    } else {
      return this.onUpperKnobLegBase(source);
    }
  };

  /** @inheritdoc */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public collapseLegs(setHidden: boolean): void {
    //noop
  }

  /**
   * Callback firing when upper knob event on the header is fired.
   * @returns Whether or not the event was handled.
   */
  protected onUpperKnobEmptyRow = (): boolean => {
    const plan = this.props.fms.getFlightPlan();
    const origin = plan.originAirport;
    if (!origin || origin === undefined) {
      this.props.viewService.open<WptInfo>('WptInfo', true)
        .onAccept.on((sender, fac) => {
          if (fac === undefined) {
            return;
          }

          // check if its airportfacility interface
          if ('bestApproach' in fac) {
            this.props.fms.setOrigin(fac as AirportFacility);
            this.props.viewService.open<SetRunway>('SetRunway', true).setInput(fac as AirportFacility)
              .onAccept.on((subSender, data) => {
                this.props.fms.setOrigin(this.props.facilities.originFacility, data);
              });
          } else {
            const firstEnrSegment = this.props.fms.getFlightPlan().segmentsOfType(FlightPlanSegmentType.Enroute).next().value;
            if (firstEnrSegment) {
              const success = this.props.fms.insertWaypoint(firstEnrSegment.segmentIndex, fac, 0);
              if (!success) {
                this.props.viewService.open('MessageDialog', true).setInput({ inputString: 'Invalid flight plan modification.' });
              }
            }
          }
        });

      return true;
    }

    return false;
  };

  /**
   * Callback firing when CLR on the header is pressed.
   * @returns true if CLR is handeled, false if not.
   */
  protected onClrHeader = (): boolean => {
    const plan = this.props.fms.getPrimaryFlightPlan();
    const airport = this.props.facilities.originFacility;
    const departure = airport?.departures[plan.procedureDetails.departureIndex];

    if (departure) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const name = FmsUtils.getDepartureNameAsString(airport!, departure, plan.procedureDetails.departureTransitionIndex, plan.procedureDetails.originRunway);
      this.props.viewService.open('MessageDialog', true).setInput({ inputString: `Remove ${name} from flight plan?`, hasRejectButton: true })
        .onAccept.on((sender, accept) => {
          if (accept) {
            this.props.fms.removeDeparture();
            return true;
          }
        });
    }

    return false;
  };

  /** @inheritdoc */
  protected onClrLeg = (source: G1000UiControl): boolean => {
    const legIndex = this.listRef.instance.indexOf(source);
    const plan = this.props.fms.getFlightPlan();
    const origin = plan.originAirport;
    if (origin && legIndex == 0) {
      this.props.viewService.open('MessageDialog', true).setInput({ inputString: `Remove ${ICAO.getIdent(origin)}?`, hasRejectButton: true })
        .onAccept.on((sender, accept) => {
          if (accept) {
            this.props.fms.setOrigin(undefined);
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

    let focus: FlightPlanFocus;
    if (this.segment && this.segment.segmentType === FlightPlanSegmentType.Departure) {
      focus = this.segment?.legs.length ? this.segment.legs : this.getFlightPlanFocusWhenEmpty();
    } else {
      // Only an origin airport exists.
      const origin = this.props.facilities.originFacility;
      focus = origin ?? this.getFlightPlanFocusWhenEmpty();
    }

    this.props.onFlightPlanFocusSelected && this.props.onFlightPlanFocusSelected(focus);
  }

  /**
   * Render the departure section.
   * @returns A VNode.
   */
  public render(): VNode {
    return (
      <div id='fpln-departure'>
        <FPLHeaderDeparture
          ref={this.headerRef} facilities={this.props.facilities}
          fms={this.props.fms} segment={this.segment} onClr={this.onClrHeader}
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