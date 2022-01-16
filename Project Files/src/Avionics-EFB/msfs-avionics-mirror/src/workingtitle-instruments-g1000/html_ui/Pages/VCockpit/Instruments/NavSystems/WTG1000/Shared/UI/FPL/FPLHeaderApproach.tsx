import { FSComponent, Subject, VNode } from 'msfssdk';
import { AirportFacility, ApproachProcedure, ICAO } from 'msfssdk/navigation';
import { FmsUtils } from '../../FlightPlan/FmsUtils';
import { ApproachNameDisplay } from './ApproachNameDisplay';
import { FPLHeader } from './FPLHeader';

/**
 * An FPL section header for approaches.
 */
export class FPLHeaderApproach extends FPLHeader {
  private static readonly ESTIMATED_CHAR_WIDTH = 13.2;

  private readonly vtfRef = FSComponent.createRef<HTMLSpanElement>();

  private readonly airportSub = Subject.create<AirportFacility | null>(null);
  private readonly approachSub = Subject.create<ApproachProcedure | null>(null);

  /** @inheritdoc */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public setCollapsed(setCollapsed: boolean): void {
    //noop
  }

  /** @inheritdoc */
  protected updateName(): void {
    const plan = this.props.fms.getPrimaryFlightPlan();
    const airport = this.props.facilities.destinationFacility;
    const approach = airport ? FmsUtils.getApproachFromPlan(plan, airport) : undefined;

    this.airportSub.set(airport ?? null);
    this.approachSub.set(approach ?? null);

    const isVtf = !!approach && FmsUtils.isVtfApproachLoaded(plan);

    this.vtfRef.instance.style.display = isVtf ? '' : 'none';

    const nameLength = approach
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      ? FmsUtils.getApproachNameAsString(approach).length + ICAO.getIdent(airport!.icao).length + 1 + (isVtf ? 6 : 0)
      : 0;
    this.setEstimatedNameWidth(nameLength * FPLHeaderApproach.ESTIMATED_CHAR_WIDTH);
  }

  /** @inheritdoc */
  protected renderName(): VNode {
    return (
      <div><span ref={this.vtfRef} style='display: none;'>VTF – </span><ApproachNameDisplay approach={this.approachSub} airport={this.airportSub} /></div>
    );
  }
}