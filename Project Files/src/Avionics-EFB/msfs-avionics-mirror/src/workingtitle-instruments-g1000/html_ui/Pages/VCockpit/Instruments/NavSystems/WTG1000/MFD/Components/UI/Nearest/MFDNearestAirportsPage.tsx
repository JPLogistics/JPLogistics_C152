import { VNode, FSComponent, BitFlags } from 'msfssdk';
import { AirportClass, AirportFacility, ApproachProcedure, Facility, NearestAirportSubscription, NearestSubscription } from 'msfssdk/navigation';
import { FocusPosition, UiControl2, UiControl2Props } from '../../../../Shared/UI/UiControl2';
import { G1000ControlEvents } from '../../../../Shared/G1000Events';
import { ApproachesGroup, FrequenciesGroup, InformationGroup, RunwaysGroup } from './Airports';
import { MFDNearestPage, MFDNearestPageProps } from './MFDNearestPage';
import { WaypointIconImageCache } from '../../../../Shared/WaypointIconImageCache';
import { MFDSelectProcedurePage } from '../Procedure/MFDSelectProcedurePage';
import { ProcedureType } from '../../../../Shared/FlightPlan/Fms';

export enum NearestAirportSoftKey {
  APT,
  RNWY,
  FREQ,
  APR,
  LD_APR
}

/**
 * A component that display a list of the nearest airports with accompanying information
 * and a map indicating the airport location.
 */
export class MFDNearestAirportsPage extends MFDNearestPage<AirportFacility> {

  private readonly informationGroup = FSComponent.createRef<InformationGroup>();
  private readonly runwaysGroup = FSComponent.createRef<RunwaysGroup>();
  private readonly frequenciesGroup = FSComponent.createRef<FrequenciesGroup>();
  private readonly approachesGroup = FSComponent.createRef<ApproachesGroup>();

  private facility: AirportFacility | undefined;
  private approach: ApproachProcedure | undefined;

  /**
   * Creates an instance of a nearest airport box.
   * @param props The props.
   */
  constructor(props: MFDNearestPageProps) {
    super(props);

    this.props.bus.on('nearest_airports_key', (group: number) => {
      switch (group) {
        case NearestAirportSoftKey.APT:
          this.facilitiesGroup.instance.focus(FocusPosition.MostRecent);
          this.setScrollEnabled(true);
          break;
        case NearestAirportSoftKey.RNWY:
          this.runwaysGroup.instance.focus(FocusPosition.MostRecent);
          this.setScrollEnabled(true);
          break;
        case NearestAirportSoftKey.FREQ:
          this.frequenciesGroup.instance.focus(FocusPosition.MostRecent);
          this.setScrollEnabled(true);
          break;
        case NearestAirportSoftKey.APR:
          this.approachesGroup.instance.focus(FocusPosition.MostRecent);
          this.setScrollEnabled(true);
          break;
        case NearestAirportSoftKey.LD_APR:
          this.onLoadApproach();
          break;
      }
    });
  }

  /** @inheritdoc */
  public onViewOpened(): void {
    super.onViewOpened();

    this.props.menuSystem.clear();
    this.props.menuSystem.pushMenu('nearest-airports-menu');
  }

  /** @inheritdoc */
  protected getFacilityGroupTitle(): string {
    return 'Nearest Airports';
  }

  /** @inheritdoc */
  protected getPageClass(): string {
    return 'mfd-nearest-airports';
  }

  /** @inheritdoc */
  protected getSelectedGroup(): UiControl2<UiControl2Props> {
    return this.uiRoot.instance;
  }

  /** @inheritdoc */
  protected buildNearestSubscription(): NearestSubscription<AirportFacility, any, any> {
    return new NearestAirportSubscription(this.props.loader);
  }

  /** @inheritdoc */
  protected getIconSource(facility: Facility): string {
    return WaypointIconImageCache.getAirportIcon(facility as AirportFacility).src;
  }

  /** @inheritdoc */
  protected onFacilitySelected(airport: AirportFacility | null): void {
    super.onFacilitySelected(airport);

    this.informationGroup.instance.set(airport);
    this.runwaysGroup.instance.set(airport);
    this.frequenciesGroup.instance.set(airport);
    this.approachesGroup.instance.set(airport);

    this.facility = airport ?? undefined;
  }

  /**
   * A callback called when the LD APR softkey menu item is pressed to load an
   * approach into the PROC approach pane.
   */
  private onLoadApproach(): void {
    if (this.facility !== undefined && this.approach !== undefined) {
      // save the approach because it will be cleared when the select approach page is opened.
      const approach = this.approach;
      const procApproach = this.props.viewService.open('SelectProcedurePage', true) as MFDSelectProcedurePage;
      procApproach.setActiveProcedureType(ProcedureType.APPROACH)?.setFacilityAndApproach(this.facility, approach);
    }
  }

  /**
   * A callback called when an approach is selected in the approach group.
   * @param approach The approach that was selected.
   */
  private onApproachSelected(approach: ApproachProcedure | undefined): void {
    this.approach = approach;
    const publisher = this.props.bus.getPublisher<G1000ControlEvents>();

    if (this.approach !== undefined) {
      publisher.pub('ld_apr_enabled', true, false, false);
    } else {
      publisher.pub('ld_apr_enabled', false, false, false);
    }
  }

  /** @inheritdoc */
  protected setFilter(): void {
    (this.data as NearestAirportSubscription).setFilter(false, BitFlags.createFlag(AirportClass.HardSurface));
  }

  /**
   * Render the component.
   * @returns a VNode
   */
  protected renderGroups(): VNode {
    return (
      <>
        <InformationGroup ref={this.informationGroup} />
        <RunwaysGroup ref={this.runwaysGroup} isolateScroll />
        <FrequenciesGroup ref={this.frequenciesGroup} controlPublisher={this.props.publisher} isolateScroll />
        <ApproachesGroup ref={this.approachesGroup} onSelected={this.onApproachSelected.bind(this)} isolateScroll />
      </>
    );
  }
}
