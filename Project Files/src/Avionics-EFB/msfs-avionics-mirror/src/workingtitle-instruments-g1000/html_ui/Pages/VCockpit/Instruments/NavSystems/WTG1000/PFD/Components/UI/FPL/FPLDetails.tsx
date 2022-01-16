/// <reference types="msfstypes/JS/Avionics" />

import { FSComponent, Subject, VNode } from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import { FlightPlanSegment, FlightPlanSegmentType } from 'msfssdk/flightplan';

import { ViewService } from '../../../../Shared/UI/ViewService';
import { Fms } from '../../../../Shared/FlightPlan/Fms';
import { FplActiveLegArrow } from '../../../../Shared/UI/UIControls/FplActiveLegArrow';
import { ScrollBar } from '../../../../Shared/UI/ScrollBar';
import { FixInfo } from './FixInfo';
import { FPLDetailsController, ScrollMode } from '../../../../Shared/UI/FPL/FPLDetailsController';
import { FPLDetailsStore } from '../../../../Shared/UI/FPL/FPLDetailsStore';
import { FPLSection } from './FPLSection';
import { FPLApproach } from './FPLSectionApproach';
import { FPLArrival } from './FPLSectionArrival';
import { FPLDeparture } from './FPLSectionDeparture';
import { FPLDestination } from './FPLSectionDestination';
import { FPLEnroute } from './FPLSectionEnroute';
import { FPLOrigin } from './FPLSectionOrigin';
import { FlightPlanFocus, FlightPlanSelection } from '../../../../Shared/UI/FPL/FPLTypesAndProps';
import { PFDPageMenuDialog } from '../PFDPageMenuDialog';
import { ApproachNameDisplay } from '../../../../Shared/UI/FPL/ApproachNameDisplay';
import { FmsUtils } from '../../../../Shared/FlightPlan/FmsUtils';
import { FocusPosition, UiControl2, UiControl2Props } from '../../../../Shared/UI/UiControl2';
import { ControlList } from '../../../../Shared/UI/ControlList';

/** The properties of the FPL scrollable element.*/
export interface FPLDetailProps extends UiControl2Props {
  /** The event bus for flight plan events. */
  bus: EventBus;

  /** The view service. */
  viewService: ViewService;

  /** An FMS state manager. */
  fms: Fms;
}

/**
 * FPLDetails holds the core logic of the flight plan display and interacts with button events.
 */
export class FPLDetails<P extends FPLDetailProps = FPLDetailProps> extends UiControl2<P> {
  protected readonly store: FPLDetailsStore;
  protected readonly controller: FPLDetailsController;
  protected isExtendedView = false;

  /** The complete flight plan container, including origin and destination info. */
  public fplnContainer = FSComponent.createRef<HTMLElement>();

  /** The departure through arrival phases, all of the FPLSections. */
  protected fplDetailsContainer = FSComponent.createRef<HTMLElement>();

  protected sectionListRef = FSComponent.createRef<ControlList<FlightPlanSegment>>();

  /**
   * Constructor
   * @param props the props
   */
  constructor(props: P) {
    super(props);
    this.store = new FPLDetailsStore(props.bus);
    this.controller = new FPLDetailsController(this.store, props.fms, props.bus, this.resetAutoScroll.bind(this));
  }

  /** @inheritdoc */
  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.controller.initialize();
  }

  /** Called when the fpl view is resumed. */
  public fplViewResumed(): void {
    this.resetAutoScroll();
    this.controller.initDtoLeg();
  }

  /**
   * Called when the FPL view is openend.
   * @param focusActiveLeg Whether or not to focus the active leg.
   */
  public fplViewOpened(focusActiveLeg: boolean): void {
    this.resetAutoScroll();

    if (focusActiveLeg) {
      this.focus(FocusPosition.MostRecent);
    }
  }

  /** @inheritdoc */
  protected onFocused(): void {
    this.controller.scrollMode = ScrollMode.MANUAL;
  }

  /** @inheritdoc */
  protected onBlurred(): void {
    this.controller.scrollMode = ScrollMode.AUTO;
  }

  /** Scrolls to the active leg in the flight plan. */
  public resetAutoScroll(): void {
    const activeLegSectionIndex = this.controller.sectionRefs.findIndex(s => s.instance.getActiveLegIndex() > -1);

    if (activeLegSectionIndex > -1 && !this.isFocused) {
      for (let i = 0; i < this.controller.sectionRefs.length; i++) {
        const section = this.controller.sectionRefs[i];
        if (i < activeLegSectionIndex) {
          section.instance.resetAutoScrollIndexes('before');
        } else {
          section.instance.resetAutoScrollIndexes('after');
        }

        if (section.instance.getActiveLegIndex() > -1) {
          section.instance.ensureActiveLegInView();
          this.sectionListRef.instance.setFocusedIndex(i);
        }
      }
    }
  }

  /** @inheritdoc */
  protected onMenu(): boolean {
    return this.openDetailsMenu();
  }

  /**
   * Responds to menu button press events.
   * @returns Whether the event was handled.
   */
  public openDetailsMenu(): boolean {
    const dialog = this.props.viewService.open('PageMenuDialog', true) as PFDPageMenuDialog;
    const plan = this.props.fms.getFlightPlan();

    dialog.setMenuItems([
      { id: 'activate-leg', renderContent: (): VNode => <span>Activate Leg</span>, isEnabled: false },
      { id: 'load-airway', renderContent: (): VNode => <span>Load Airway</span>, isEnabled: false },
      {
        id: 'collapse-airways',
        renderContent: (): VNode => <span>{this.controller.airwaysCollapsed ? 'Expand Airways' : 'Collapse Airways'}</span>,
        isEnabled: true,
        action: (): void => {
          this.controller.collapseAirways();
        }
      },
      { id: 'hold-waypoint', renderContent: (): VNode => <span>Hold At Waypoint</span>, isEnabled: false },
      { id: 'hold-ppos', renderContent: (): VNode => <span>Hold At Present Position</span>, isEnabled: false },
      { id: 'create-atk', renderContent: (): VNode => <span>Create ATK Offset WPT</span>, isEnabled: false },
      {
        id: 'delete-fpln', renderContent: (): VNode => <span>Delete Flight Plan</span>, isEnabled: true, action: (): void => {
          this.props.fms.emptyPrimaryFlightPlan();
        }
      },
      { id: 'store-fpln', renderContent: (): VNode => <span>Store Flight Plan</span>, isEnabled: false },
      {
        id: 'invert-fpln', renderContent: (): VNode => <span>Invert Flight Plan</span>, isEnabled: true, action: (): void => {
          this.props.fms.invertFlightplan();
        }
      },
      { id: 'temp-comp', renderContent: (): VNode => <span>Temperature Compensation</span>, isEnabled: false },
      { id: 'usr-wpt', renderContent: (): VNode => <span>Create New User Waypoint</span>, isEnabled: false },
      {
        id: 'remove-dep', renderContent: (): VNode => <span>Remove Departure</span>, isEnabled: plan.procedureDetails.departureIndex > -1, action: (): void => {
          const departure = this.store.facilityInfo.originFacility?.departures[plan.procedureDetails.departureIndex];
          if (departure) {
            this.props.viewService.open('MessageDialog', true).setInput({
              renderContent: (): VNode => {
                return (
                  <span>
                    Remove<br />{FmsUtils.getDepartureNameAsString(
                      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                      this.store.facilityInfo.originFacility!,
                      departure,
                      plan.procedureDetails.departureTransitionIndex,
                      plan.procedureDetails.originRunway
                    )}<br />from flight plan?
                  </span>
                );
              },
              hasRejectButton: true
            }).onAccept.on((sender, accept) => {
              if (accept) {
                this.props.fms.removeDeparture();
              }
            });
          }
        }
      },
      {
        id: 'remove-arr', renderContent: (): VNode => <span>Remove Arrival</span>, isEnabled: plan.procedureDetails.arrivalIndex > -1, action: (): void => {
          const arrival = this.store.facilityInfo.arrivalFacility?.arrivals[plan.procedureDetails.arrivalIndex];
          if (arrival) {
            this.props.viewService.open('MessageDialog', true).setInput({
              renderContent: (): VNode => {
                return (
                  <span>
                    Remove<br />{FmsUtils.getArrivalNameAsString(
                      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                      this.store.facilityInfo.originFacility!,
                      arrival,
                      plan.procedureDetails.arrivalTransitionIndex,
                      plan.procedureDetails.destinationRunway
                    )}<br />from flight plan?
                  </span>
                );
              },
              hasRejectButton: true
            }).onAccept.on((sender, accept) => {
              if (accept) {
                this.props.fms.removeArrival();
              }
            });
          }
        }
      },
      {
        id: 'remove-app', renderContent: (): VNode => <span>Remove Approach</span>, isEnabled: FmsUtils.isApproachLoaded(plan), action: (): void => {
          this.props.viewService.open('MessageDialog', true).setInput({
            renderContent: (): VNode => {
              const approach = this.store.facilityInfo.destinationFacility ? FmsUtils.getApproachFromPlan(plan, this.store.facilityInfo.destinationFacility) : undefined;
              return (
                <div style='display: inline-block;'>Remove {<ApproachNameDisplay approach={Subject.create(approach ?? null)} />} from flight plan?</div>
              );
            },
            hasRejectButton: true
          }).onAccept.on((sender, accept) => {
            if (accept) {
              this.props.fms.removeApproach();
            }
          });
        }
      },
      { id: 'parallel-track', renderContent: (): VNode => <span>Parallel Track</span>, isEnabled: false },
      { id: 'closest-point', renderContent: (): VNode => <span>Closest Point Of FPL</span>, isEnabled: false }
    ]);

    return true;
  }

  /**
   * Gets the top location of the list element for the specified segment and leg.
   * @param segmentIndex The segment index.
   * @param legIndex The leg index.
   * @returns list element y coordinate
   */
  protected getListElementTopLocation = (segmentIndex: number, legIndex: number): number => {
    const section = this.controller.sectionRefs[segmentIndex];
    if (section) {
      if (section.instance.getLegsLength() > 0) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return section.instance.getListRef().instance.getChildInstance<FixInfo>(legIndex)!.getContainerElementLocation()[1] + 8;
      } else {
        console.warn('getListElementTopLocation: Section exists, but there are no legs in this segment');
        return -1;
      }
    } else {
      console.error('getListElementTopLocation: Section Ref could not be found');
      return -1;
    }
  }

  /**
   * Responds to a flight plan element selections.
   * @param selection The selection that was made.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onFlightPlanElementSelected(selection: FlightPlanSelection): void {
    // noop
  }

  /**
   * Responds to flight plan focus selections.
   * @param focus The focus selection that was made.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onFlightPlanFocusSelected(focus: FlightPlanFocus): void {
    // noop
  }

  /**
   * Renders a section in the flight plan.
   * @param data The data object for this section.
   * @param index The index.
   * @returns The rendered VNode.
   */
  protected renderItem(data: FlightPlanSegment, index: number): VNode {
    let section;
    const ref = FSComponent.createRef<FPLSection>();
    // select datatemplate
    switch (data.segmentType) {
      case FlightPlanSegmentType.Departure:
        section = (
          <FPLDeparture
            ref={ref} viewService={this.props.viewService} fms={this.props.fms} detailsController={this.controller}
            facilities={this.store.facilityInfo} segmentIndex={data.segmentIndex} isExtendedView={this.isExtendedView}
            onFlightPlanElementSelected={this.onFlightPlanElementSelected.bind(this)} scrollContainer={this.fplnContainer}
            onFlightPlanFocusSelected={this.onFlightPlanFocusSelected.bind(this)}
          />
        );
        break;
      case FlightPlanSegmentType.Arrival:
        section = (
          <FPLArrival
            ref={ref} viewService={this.props.viewService} fms={this.props.fms} detailsController={this.controller}
            facilities={this.store.facilityInfo} segmentIndex={data.segmentIndex} isExtendedView={this.isExtendedView}
            onFlightPlanElementSelected={this.onFlightPlanElementSelected.bind(this)} scrollContainer={this.fplnContainer}
            onFlightPlanFocusSelected={this.onFlightPlanFocusSelected.bind(this)}
          />
        );
        break;
      case FlightPlanSegmentType.Approach:
        section = (
          <FPLApproach
            ref={ref} viewService={this.props.viewService} fms={this.props.fms} detailsController={this.controller}
            facilities={this.store.facilityInfo} segmentIndex={data.segmentIndex} isExtendedView={this.isExtendedView}
            onFlightPlanElementSelected={this.onFlightPlanElementSelected.bind(this)} scrollContainer={this.fplnContainer}
            onFlightPlanFocusSelected={this.onFlightPlanFocusSelected.bind(this)}
          />
        );
        break;
      case FlightPlanSegmentType.Destination:
        section = (
          <FPLDestination
            ref={ref} viewService={this.props.viewService} fms={this.props.fms} detailsController={this.controller}
            facilities={this.store.facilityInfo} segmentIndex={data.segmentIndex} isExtendedView={this.isExtendedView}
            onFlightPlanElementSelected={this.onFlightPlanElementSelected.bind(this)} scrollContainer={this.fplnContainer}
            onFlightPlanFocusSelected={this.onFlightPlanFocusSelected.bind(this)}
          />
        );
        break;
      default:
        section = (
          <FPLEnroute
            ref={ref} viewService={this.props.viewService} fms={this.props.fms} detailsController={this.controller}
            facilities={this.store.facilityInfo} segmentIndex={data.segmentIndex} isExtendedView={this.isExtendedView}
            onFlightPlanElementSelected={this.onFlightPlanElementSelected.bind(this)} scrollContainer={this.fplnContainer}
            onFlightPlanFocusSelected={this.onFlightPlanFocusSelected.bind(this)}
          />
        );
    }

    this.controller.sectionRefs.splice(index, 0, section);
    return section;
  }

  /**
   * Render the component.
   * @returns The component VNode.
   */
  public render(): VNode {
    return (
      <div id='fpl-details-container' ref={this.fplDetailsContainer}>
        <FPLOrigin
          ref={this.controller.originRef}
          viewService={this.props.viewService} fms={this.props.fms}
          facilities={this.store.facilityInfo} segmentIndex={-1}
        />
        <hr />
        <div>
          <span id="dtk" class="smallText white">DTK</span>
          <span id="dis" class="smallText white">DIS</span>
        </div>
        <div class='fpln-container' ref={this.fplnContainer}>
          <ControlList
            ref={this.sectionListRef} data={this.store.segments}
            renderItem={this.renderItem.bind(this)}
            hideScrollbar scrollContainer={this.fplnContainer}
          />
          <FplActiveLegArrow ref={this.controller.legArrowRef} getLegDomLocation={this.getListElementTopLocation} />
        </div>
        <ScrollBar />
      </div>
    );
  }
}