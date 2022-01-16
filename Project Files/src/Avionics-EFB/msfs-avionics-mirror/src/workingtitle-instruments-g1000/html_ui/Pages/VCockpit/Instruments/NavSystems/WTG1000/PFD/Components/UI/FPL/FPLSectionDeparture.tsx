import { VNode, FSComponent } from 'msfssdk';
import { AirportFacility, Facility, ICAO, OneWayRunway } from 'msfssdk/navigation';
import { FlightPlanSegmentType } from 'msfssdk/flightplan';

import { Fms } from '../../../../Shared/FlightPlan/Fms';
import { SetRunway } from '../../../../Shared/UI/SetRunway/SetRunway';
import { FixInfo } from './FixInfo';
import { FPLEmptyRow } from '../../../../Shared/UI/FPL/FPLEmptyRow';
import { FPLHeaderDeparture } from '../../../../Shared/UI/FPL/FPLHeaderDeparture';
import { FPLSection } from './FPLSection';
import { FmsUtils } from '../../../../Shared/FlightPlan/FmsUtils';
import { FlightPlanFocus } from '../../../../Shared/UI/FPL/FPLTypesAndProps';
import { UiControl2 } from '../../../../Shared/UI/UiControl2';
import { ControlList } from '../../../../Shared/UI/ControlList';

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
  protected onUpperKnobLeg = (source: UiControl2): boolean => {
    const legIndex = this.listRef.instance.indexOf(source);
    const plan = this.props.fms.getFlightPlan();
    const origin = plan.originAirport;
    if (origin && legIndex === 0) {
      Fms.viewService.open('SetRunway', true).setInput(this.props.facilities.originFacility as AirportFacility)
        .onAccept.on((sender: SetRunway, data: OneWayRunway | undefined) => {
          this.props.fms.setOrigin(this.props.facilities.originFacility, data);
        });

      return true;
    } else {
      return this.onUpperKnobLegBase(source);
    }
  }

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
      Fms.viewService.open('WptInfo', true)
        .onAccept.on((sender, fac: Facility) => {
          // check if its airportfacility interface
          if ('bestApproach' in fac) {
            this.props.fms.setOrigin(fac as AirportFacility);
            Fms.viewService.open('SetRunway', true).setInput(fac as AirportFacility)
              .onAccept.on((subSender: SetRunway, data: OneWayRunway | undefined) => {
                this.props.fms.setOrigin(this.props.facilities.originFacility, data);
              });
          } else {
            const firstEnrSegment = this.props.fms.getFlightPlan().segmentsOfType(FlightPlanSegmentType.Enroute).next().value;
            if (firstEnrSegment) {
              const success = this.props.fms.insertWaypoint(firstEnrSegment.segmentIndex, fac, 0);
              if (!success) {
                Fms.viewService.open('MessageDialog', true).setInput({ inputString: 'Invalid flight plan modification.' });
              }
            }
          }
        });

      return true;
    }

    return false;
  }

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
      Fms.viewService.open('MessageDialog', true).setInput({ inputString: `Remove ${name} from flight plan?`, hasRejectButton: true })
        .onAccept.on((sender, accept) => {
          if (accept) {
            this.props.fms.removeDeparture();
            return true;
          }
        });
    }

    return false;
  }

  /** @inheritdoc */
  protected onClrLeg = (source: UiControl2): boolean => {
    const legIndex = this.listRef.instance.indexOf(source);
    const plan = this.props.fms.getFlightPlan();
    const origin = plan.originAirport;
    if (origin && legIndex == 0) {
      Fms.viewService.open('MessageDialog', true).setInput({ inputString: `Remove ${ICAO.getIdent(origin)}?`, hasRejectButton: true })
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
  }

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
          fms={this.props.fms} onClr={this.onClrHeader}
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