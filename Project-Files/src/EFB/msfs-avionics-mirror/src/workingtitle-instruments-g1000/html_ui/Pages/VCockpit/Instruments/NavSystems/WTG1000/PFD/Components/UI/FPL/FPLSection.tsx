import { NodeReference, FSComponent, ArraySubject, Subject, VNode, UnitType, BitFlags, NumberUnitSubject } from 'msfssdk';
import { Facility, LegType } from 'msfssdk/navigation';
import { FlightPlan, FlightPlanSegment, FlightPlanSegmentType, LegDefinition, LegDefinitionFlags } from 'msfssdk/flightplan';
import { VNavConstraint, VNavLeg, VNavUtils } from 'msfssdk/autopilot';
import { BlurReconciliation, FocusPosition } from 'msfssdk/components/controls';

import { Fms, FmsUtils } from 'garminsdk/flightplan';

import { ViewService } from '../../../../Shared/UI/ViewService';
import { PFDPageMenuDialog } from '../PFDPageMenuDialog';
import { FixInfo } from './FixInfo';
import { FacilityInfo, FixLegInfo, FlightPlanFocus, FlightPlanSelection } from '../../../../Shared/UI/FPL/FPLTypesAndProps';
import { FPLEmptyRow } from '../../../../Shared/UI/FPL/FPLEmptyRow';
import { FPLHeader } from '../../../../Shared/UI/FPL/FPLHeader';
import { SelectAirwayInputData } from '../../../../Shared/UI/Controllers/SelectAirwayController';
import { FPLDetailsController } from '../../../../Shared/UI/FPL/FPLDetailsController';
import { DirectToInputData } from '../../../../Shared/UI/DirectTo/DirectTo';
import { ApproachNameDisplay } from '../../../../Shared/UI/FPL/ApproachNameDisplay';
import type { MenuItemDefinition } from '../../../../Shared/UI/Dialogs/PopoutMenuItem';
import { FPLUtils } from '../../../../Shared/UI/FPL/FPLUtils';
import { G1000UiControl, G1000UiControlProps, G1000ControlList } from '../../../../Shared/UI/G1000UiControl';
import { MessageDialogDefinition } from '../../../../Shared/UI/Dialogs/MessageDialog';
import { NumberUnitDisplay } from '../../../../Shared/UI/Common/NumberUnitDisplay';

/** The properties of an FPL detail section item. */
export interface FPLSectionProps extends G1000UiControlProps {
  /** The view service. */
  viewService: ViewService;
  /** Info about origin and destination facilities */
  facilities: FacilityInfo;
  /** The flight plan segment associated with this section. */
  segment: FlightPlanSegment;
  /** The flight management system. */
  fms: Fms;
  /** The container to scroll when elements are highlighted. */
  scrollContainer?: NodeReference<HTMLElement>;
  /** If the fpl waypoint list is an extended view or not */
  isExtendedView?: boolean;
  /** Instance of the details controller */
  detailsController?: FPLDetailsController;

  /**
   * A function to call when a flight plan element was selected in this section.
   * @param selection The selection that was made.
   */
  onFlightPlanElementSelected?(selection: FlightPlanSelection): void;

  /**
   * A function to call when a flight plan focus was selected in this section.
   * @param focus The focus selection that was made.
   */
  onFlightPlanFocusSelected?(focus: FlightPlanFocus): void;
}

/**
 * An interface to define interaction event handling on FPL sections
 */
export interface FPLInteractive {
  /**
   * Event that is called when the MENU button is pressed.
   * @returns A booleans indicating that the event was handled.
   */
  onMenu(): boolean;

  /**
   * Event that is called when the DTO button is pressed.
   * @returns A booleans indicating that the event was handled.
   */
  onDirectTo(): boolean;
}

/**
 * A flight plan detail section, representing a single phase of flight.
 *
 * Individual sections that need to render a dynamic list of fixes can extend
 * this for useful functionality.  They will need to, at the minimum, define
 * the type of segment they are by storing a FlightPlanSegmentType in the
 * segmentType variable.
 *
 * An additional hook is provided for a callback that can be used to render
 * the header for the section dynamically based on the section's needs, since
 * that is something that varies by section type.
 *
 * Descendents must remember to call super.onAfterRender() in their own
 * onAfterRender if they want the magic to happen.
 */
export abstract class FPLSection extends G1000UiControl<FPLSectionProps> implements FPLInteractive {

  /** A reference to the header line for the section. */
  protected headerRef = FSComponent.createRef<FPLHeader>();
  protected emptyRowRef = FSComponent.createRef<FPLEmptyRow>();
  public readonly segment: FlightPlanSegment = this.props.segment;
  protected legs = ArraySubject.create<Subject<FixLegInfo>>();
  protected listRef = FSComponent.createRef<G1000ControlList<Subject<FixLegInfo>>>();

  /** @inheritdoc */
  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    if (this.legs.length === 0) {
      this.listRef.instance.setDisabled(true);
    }
  }

  /**
   * Gets the ref to the list component for the section.
   * @returns list ref
   */
  public getListRef(): NodeReference<G1000ControlList<Subject<FixLegInfo>>> {
    return this.listRef;
  }

  /**
   * Gets the empty row visbility
   * @returns true if empty row should be visible, false otherwise
   */
  protected abstract getEmptyRowVisbility(): boolean;

  /**
   * Focuses the active leg.
   */
  public focusActiveLeg(): void {
    const activeLegIndex = this.getActiveLegIndex();
    if (activeLegIndex > -1) {
      this.listRef.instance.getChildInstance(activeLegIndex)?.focus(FocusPosition.First);
    }
  }

  /**
   * An event called when the dto button is pressed.
   * @returns True if the event was handled in this section.
   */
  public onDirectTo(): boolean {
    try {
      if (this.hasSelection() && !this.isHeaderSelected() && this.segment !== undefined) {
        // First try to load direct to existing

        const segmentIndex = this.segment.segmentIndex;
        const segmentLegIndex = this.listRef.instance.getSelectedIndex();
        const directToInputData: DirectToInputData = {
          segmentIndex,
          legIndex: segmentLegIndex,
          icao: this.legs.get(segmentLegIndex).get().legDefinition.leg.fixIcao,
        };
        if (this.props.fms.canDirectTo(segmentIndex, segmentLegIndex)) {
          this.props.viewService.open('DirectTo', false).setInput(directToInputData);
        } else if (this.props.fms.canActivateLeg(segmentIndex, segmentLegIndex)) {
          // Try to activate leg
          FPLUtils.openActivateLegDialog(this.props.fms, this.segment.segmentIndex, this.listRef.instance.getSelectedIndex(), this.props.viewService);
        } else {
          // Finally just open direct to menu with original input data (the direct to menu controller will attempt to
          // select a valid alternative DTO existing target)

          this.props.viewService.open('DirectTo', false).setInput(directToInputData);
        }

        return true;
      }
    } catch {
      // noop
    }

    return false;
  }

  /**
   * An event called when the VNav Direct Softkey is pressed.
   * @returns True if the event was handled in this section.
   */
  public onVnavDirect(): boolean {
    if (this.props.fms.verticalPathCalculator !== undefined) {

      const verticalPlan = this.props.fms.verticalPathCalculator.getVerticalFlightPlan(Fms.PRIMARY_PLAN_INDEX);
      const lateralPlan = this.props.fms.getPrimaryFlightPlan();

      try {
        if (verticalPlan !== undefined && lateralPlan !== undefined && this.isFocused && this.hasSelection() && !this.isHeaderSelected() && this.segment !== undefined) {

          const segmentLegIndex = this.listRef.instance.getSelectedIndex();
          const selectedGlobalLegIndex = this.segment.offset + segmentLegIndex;
          const vnavDirectConstraint = VNavUtils.getConstraintForVerticalDirect(verticalPlan, lateralPlan.activeLateralLeg, selectedGlobalLegIndex);

          if (vnavDirectConstraint !== undefined) {
            this.props.viewService.open('MessageDialog', true).setInput({
              renderContent: (): VNode => this.renderVerticalDirectDialogContent(vnavDirectConstraint),
              hasRejectButton: true,
              confirmButtonText: 'ACTIVATE'
            }).onAccept.on((sender, accept) => {
              if (accept) {
                return this.props.fms.activateVerticalDirect(vnavDirectConstraint.index);
              }
            });
            return true;
          }
        }
      } catch {
        // noop
      }
    }
    return false;
  }

  /**
   * Responds to menu button press events.
   * @returns Whether the event was handled.
   */
  public onMenu(): boolean {
    const hasSelection = this.hasSelection();

    if (this.segment && hasSelection) {
      const dialog = this.props.viewService.open('PageMenuDialog', true) as PFDPageMenuDialog;
      const plan = this.props.fms.getFlightPlan();

      const isHeaderSelected = this.isHeaderSelected();
      const isEmptyRowSelected = this.isEmptyRowSelected();
      const isLegSelected = hasSelection && !isHeaderSelected && !isEmptyRowSelected;

      dialog.setMenuItems([
        {
          id: 'activate-leg',
          renderContent: (): VNode => <span>Activate Leg</span>,
          isEnabled: isLegSelected && this.props.fms.canActivateLeg(this.segment.segmentIndex, this.listRef.instance.getSelectedIndex()),
          action: (): void => {
            if (this.segment) {
              FPLUtils.openActivateLegDialog(this.props.fms, this.segment.segmentIndex, this.listRef.instance.getSelectedIndex(), this.props.viewService);
            }
          }
        },
        {
          id: 'load-airway',
          renderContent: (): VNode => <span>Load Airway</span>,
          isEnabled: this.canAirwayInsert(this.segment.segmentIndex, isEmptyRowSelected),
          action: (): void => {
            const airwayInsertData = this.getAirwayInsertData(this.segment.segmentIndex, this.listRef.instance.getSelectedIndex(), this.isEmptyRowSelected());
            this.props.viewService.open('SelectAirway', true).setInput(airwayInsertData);
          }
        },
        {
          id: 'collapse-airways',
          renderContent: (): VNode => <span>{this.props.detailsController?.airwaysCollapsed ? 'Expand Airways' : 'Collapse Airways'}</span>,
          isEnabled: true,
          action: (): void => {
            this.props.detailsController?.collapseAirways();
          }
        },
        this.createHoldAtWaypointMenuItem(plan, isLegSelected),
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
            const departure = this.props.facilities.originFacility?.departures[plan.procedureDetails.departureIndex];
            if (departure) {
              this.props.viewService.open('MessageDialog', true).setInput({
                renderContent: (): VNode => {
                  return (
                    <span>
                      Remove<br />{FmsUtils.getDepartureNameAsString(
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        this.props.facilities.originFacility!,
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
            const arrival = this.props.facilities.arrivalFacility?.arrivals[plan.procedureDetails.arrivalIndex];
            if (arrival) {
              this.props.viewService.open('MessageDialog', true).setInput({
                renderContent: (): VNode => {
                  return (
                    <span>
                      Remove<br />{FmsUtils.getArrivalNameAsString(
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        this.props.facilities.arrivalFacility!,
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
                return (
                  <div style='display: inline-block;'>Remove {this.renderApproachName(plan)} from flight plan?</div>
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

    return false;
  }

  /**
   * Creates a Hold At Waypoint page menu item.
   * @param plan The selected flight plan.
   * @param isLegSelected Whether a flight plan leg is selected.
   * @returns A Hold At Waypoint page menu item.
   */
  protected createHoldAtWaypointMenuItem(plan: FlightPlan, isLegSelected: boolean): MenuItemDefinition {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const segment = this.segment!;
    const selectedLegIndex = this.listRef.instance.getSelectedIndex();
    const selectedLeg = isLegSelected ? segment.legs[selectedLegIndex] : undefined;
    const prevLeg = plan.getPrevLeg(segment.segmentIndex, selectedLegIndex);
    const nextLeg = plan.getNextLeg(segment.segmentIndex, selectedLegIndex);
    const isSelectedLegEditableHold = !!(selectedLeg && prevLeg && selectedLeg.leg.type === LegType.HM && selectedLeg.leg.fixIcao === prevLeg.leg.fixIcao);
    const isNextLegEditableHold = !!(selectedLeg && nextLeg && nextLeg.leg.type === LegType.HM && nextLeg.leg.fixIcao === selectedLeg.leg.fixIcao);
    const isEdit = isSelectedLegEditableHold || isNextLegEditableHold;
    const isEnabled = !!(selectedLeg && prevLeg && (isSelectedLegEditableHold || this.canHoldAtWaypoint(selectedLeg)));

    return {
      id: 'hold-waypoint',
      renderContent: isEdit ? (): VNode => <span>Edit Hold</span> : (): VNode => <span>Hold At Waypoint</span>,
      isEnabled,
      action: (): void => {
        const segmentIndex = segment.segmentIndex;
        let legIndex = selectedLegIndex - (isSelectedLegEditableHold ? 1 : 0);

        // If the selected leg is the target of a DTO existing sequence, shift the leg index so the hold is inserted after the DTO legs
        if (plan.directToData.segmentIndex === segmentIndex && plan.directToData.segmentLegIndex === legIndex) {
          legIndex += 3;
        }

        this.props.viewService.open('HoldAt', true).setInput({ planIndex: plan.planIndex, segmentIndex, legIndex });
      }
    };
  }

  /**
   * Checks if a hold-at-waypoint can be inserted after a flight plan leg.
   * @param leg A flight plan leg.
   * @returns Whether a hold-at-waypoint can be inserted after the flight plan leg.
   */
  protected canHoldAtWaypoint(leg: LegDefinition): boolean {
    switch (leg.leg.type) {
      case LegType.IF:
      case LegType.TF:
      case LegType.DF:
      case LegType.CF:
      case LegType.AF:
      case LegType.RF:
        return true;
    }

    return false;
  }

  // TODO Remove when all events converted
  /**
   * Checks if there is a highlighted element in this section
   * @protected
   * @returns A boolean indicating if an element is highlighted in this section.
   */
  public hasSelection(): boolean {
    return this.isHeaderSelected() || this.listRef.instance.getSelectedIndex() > -1 || this.isEmptyRowSelected();
  }

  /**
   * Adds a leg to the flight plan display segment.
   * @param index The index to add at.
   * @param leg The leg to add.
   */
  public addLeg(index: number, leg: FixLegInfo): void {
    const currentLeg = this.legs.tryGet(index);

    if (currentLeg !== undefined && currentLeg.get().isActive) {
      currentLeg.apply({ isActive: false });
      leg.isActive = true;
    }

    this.legs.insert(Subject.create(leg), index);
    if (this.listRef.instance.length === 1) {
      this.listRef.instance.setDisabled(false);
    }

    this.updateEmptyRowVisibility();
  }

  /**
   * Removes a leg from the flight plan display segment.
   * @param index The index to remove at.
   */
  public removeLeg(index: number): void {
    let currentLeg = this.legs.tryGet(index);
    const isActive = currentLeg !== undefined && currentLeg.get().isActive;

    this.legs.removeAt(index);
    currentLeg = this.legs.tryGet(index);

    if (currentLeg !== undefined && isActive) {
      currentLeg.apply({ isActive });
    }

    if (this.listRef.instance.length === 0) {
      this.listRef.instance.setDisabled(true);
    }

    this.updateEmptyRowVisibility();
  }

  /**
   * Refreshes this section's header.
   */
  public updateHeader(): void {
    this.headerRef.instance.update();
  }

  /**
   * Updates the visibility of this section's empty row.
   */
  public updateEmptyRowVisibility(): void {
    const emptyRow = this.emptyRowRef.getOrDefault();
    if (emptyRow !== null) {
      const emptyRowActive = this.getEmptyRowVisbility();

      emptyRow.setIsVisible(emptyRowActive);
      emptyRow.setDisabled(!emptyRowActive);
    }
  }

  /**
   * A callback which responds to changes in the active flight plan leg.
   * @param activeSegmentIndex The index of the active leg segment.
   * @param activeLegIndex The index of the active leg in its segment.
   */
  public onActiveLegChanged(activeSegmentIndex: number, activeLegIndex: number): void {
    this.updateLegInfoVisibility(activeSegmentIndex, activeLegIndex);

    // Refresh flight plan focus if the header or empty row is focused
    if (this.headerRef.instance.isFocused) {
      this.onHeaderFocused();
    } else if (this.emptyRowRef.getOrDefault()?.isFocused) {
      this.onEmptyRowFocused();
    }
  }

  /**
   * Updates this section's leg information visibility based on the current active flight plan leg.
   * @param activeSegmentIndex The index of the active leg segment.
   * @param activeLegIndex The index of the active leg in its segment.
   */
  private updateLegInfoVisibility(activeSegmentIndex: number, activeLegIndex: number): void {
    const isVtf = this.segment?.segmentType === FlightPlanSegmentType.Approach && this.props.fms.isApproachVtf();
    let vtfOffset = 0;
    if (isVtf) {
      const activeLeg = this.legs.tryGet(activeLegIndex)?.get();
      if (activeLeg) {
        vtfOffset = this.segment.segmentIndex === activeSegmentIndex
          && BitFlags.isAny(activeLeg.legDefinition.flags, LegDefinitionFlags.VectorsToFinal) ? 2 : 0;
      }
    }
    for (let l = 0; l < this.legs.length; l++) {
      const leg = this.legs.tryGet(l);
      if (leg) {
        if (this.segment.segmentIndex < activeSegmentIndex || (this.segment.segmentIndex === activeSegmentIndex && l < activeLegIndex - vtfOffset)) {
          leg.apply({ legIsBehind: true });
        } else if (leg.get().legIsBehind) {
          leg.apply({ legIsBehind: false });
        }
        leg.notify();
      }
    }
  }

  /**
   * Sets the active leg in the flight plan display segment.
   * @param index The index of the leg to set as active.
   */
  public setActiveLeg(index: number): void {
    const legInfo = this.legs.tryGet(index);
    if (legInfo !== undefined) {
      legInfo.apply({ isActive: true });
    }

    // Set flight plan focus
    if (legInfo && this.listRef.instance.getData(index) === legInfo && this.props.onFlightPlanFocusSelected) {
      this.props.onFlightPlanFocusSelected(this.getFlightPlanFocusFromLeg(legInfo.get().legDefinition));
    }
  }

  /**
   * Cancels an active leg display in the flight plan display segment.
   * @param index The index of the leg to set as inactive.
   */
  public cancelActiveLeg(index: number): void {
    const leg = this.legs.tryGet(index);
    if (leg !== undefined && leg.get().isActive) {
      leg.apply({ isActive: false });
    }
  }

  /**
   * Cancels all active leg displays in section.
   */
  public cancelAllActiveLegs(): void {
    for (let i = 0; i < this.legs.length; i++) {
      const leg = this.legs.tryGet(i);
      if (leg !== undefined && leg.get().isActive) {
        leg.apply({ isActive: false });
      }
    }
  }

  /**
   * Returns the index of the active leg in this section.
   * @returns the index of the active lege, otherwise -1
   */
  public getActiveLegIndex(): number {
    return this.legs.getArray().findIndex(leg => leg.get().isActive);
  }

  /**
   * Scrolls to the active leg.
   */
  public resetActiveLegFocusPath(): void {
    this.listRef.instance.setFocusedIndex(this.getActiveLegIndex());
    this.setFocusedIndex(this.indexOf(this.listRef.instance));
  }

  /**
   * Ensures the active leg is in view.
   */
  public ensureActiveLegInView(): void {
    this.listRef.instance.ensureIndexInView(this.getActiveLegIndex());
  }

  /**
   * Updates a given leg's row from the leg's current calculations.
   * @param index The index of the leg.
   */
  public updateFromLegCalculations(index: number): void {
    const leg = this.legs.tryGet(index);
    if (leg !== undefined) {
      if (this.segment?.airway && index === this.legs.length - 1) {
        leg.apply({ airwayDistance: this.props.fms.getAirwayDistance(this.segment.segmentIndex) });
      } else {
        leg.notify();
      }
    }
  }

  /**
   * Sets the leg altitude for a given leg.
   * @param index The index of the leg.
   * @param vnavLeg The vnav leg data.
   * @param revisedAltitude The optional replacement display altitude.
   */
  public setLegAltitude(index: number, vnavLeg: VNavLeg, revisedAltitude?: number): void {
    const leg = this.legs.tryGet(index);
    if (leg !== undefined) {
      leg.apply({
        targetAltitude: revisedAltitude ? revisedAltitude : vnavLeg.altitude,
        isAdvisory: vnavLeg.isAdvisory,
        invalidConstraintAltitude: vnavLeg.invalidConstraintAltitude
      });
    }
  }

  /**
   * Sets whether or not this constraint is a user defined constraint.
   * @param index The index of the leg.
   * @param isUserConstraint Whether or not this is a user defined constraint.
   */
  public setIsUserConstraint(index: number, isUserConstraint: boolean): void {
    const leg = this.legs.tryGet(index);
    if (leg !== undefined) {
      leg.apply({ isUserConstraint });
    }
  }

  /**
   * Gets the number of legs in this section.
   * @returns the number of legs in this section.
   */
  public getLegsLength(): number {
    if (this.legs) {
      return this.legs.length;
    } else {
      return 0;
    }
  }

  /**
   * Creates the SelectAirwayInputData when insert airway is selected.
   * @param segmentIndex The index of the segment.
   * @param selectedIndex The selected item index.
   * @param emptyRowSelected Whether the empty row is selected.
   * @returns the SelectAirwayInputData object
   */
  protected getAirwayInsertData(segmentIndex: number, selectedIndex: number, emptyRowSelected: boolean): SelectAirwayInputData {
    const plan = this.props.fms.getFlightPlan();
    if (emptyRowSelected) {
      const segment = plan.getSegment(segmentIndex);
      if (segment.legs && segment.legs.length < 1) {
        const previousSegment = plan.getSegment(segmentIndex - 1);
        const previousSegmentLastLeg = previousSegment.legs.length - 1;
        return { segmentIndex: segmentIndex - 1, legIndex: previousSegmentLastLeg };
      } else {
        const segmentLastLeg = segment.legs.length - 1;
        return { segmentIndex: segmentIndex, legIndex: segmentLastLeg };
      }
    } else if (selectedIndex === 0 && segmentIndex > 0) {
      const previousSegment = plan.getSegment(segmentIndex - 1);
      const previousSegmentLastLeg = previousSegment.legs.length - 1;
      return { segmentIndex: segmentIndex - 1, legIndex: previousSegmentLastLeg };
    }
    return { segmentIndex: segmentIndex, legIndex: selectedIndex - 1 };
  }

  /**
   * Checks whether an airway can be inserted from this selected index.
   * @param segmentIndex The index of the segment.
   * @param isEmptyRowSelected If an empty row is selected.
   * @returns the SelectAirwayInputData object
   */
  protected canAirwayInsert(segmentIndex: number, isEmptyRowSelected: boolean): boolean {
    if (this.isHeaderSelected()) {
      return false;
    }

    const plan = this.props.fms.getFlightPlan();

    if (plan.getSegment(segmentIndex).segmentType !== FlightPlanSegmentType.Enroute) {
      return false;
    }

    const segment = plan.getSegment(segmentIndex);
    let segmentLegIndex: number;

    if (isEmptyRowSelected) {
      segmentLegIndex = segment.legs.length;
    } else {
      segmentLegIndex = this.listRef.instance.getSelectedIndex();
    }

    return plan.getPrevLeg(segmentIndex, segmentLegIndex) !== null;
  }

  /**
   * Gets the loaded approach name.
   * @param plan The Flight Plan.
   * @returns The approach name as a string.
   */
  protected renderApproachName(plan: FlightPlan): VNode {
    const approach = this.props.facilities.destinationFacility ? FmsUtils.getApproachFromPlan(plan, this.props.facilities.destinationFacility) : undefined;

    return (
      <ApproachNameDisplay approach={Subject.create(approach ?? null)} />
    );
  }

  // TODO remove when all events converted
  /**
   * Checks if the header of this section is selected.
   * @protected
   * @returns A boolean indicating if the header is selected.
   */
  protected isHeaderSelected(): boolean {
    return this.headerRef.getOrDefault()?.isFocused ?? false;
  }

  // TODO remove when all events converted
  /**
   * Checks if the empty row of this section is selected.
   * @protected
   * @returns A boolean indicating if the empty row is selected.
   */
  protected isEmptyRowSelected(): boolean {
    return this.emptyRowRef.getOrDefault()?.isFocused ?? false;
  }

  /**
   * Callback for when UpperKnob event happens on a leg.
   * @param source The FixInfo element.
   * @returns True if the control handled the event.
   */
  protected readonly onUpperKnobLegBase = (source: G1000UiControl): boolean => {
    const idx = (source instanceof FixInfo) ? this.listRef.instance.indexOf(source) : undefined;
    this.props.viewService.open('WptInfo', true)
      .onAccept.on((sender, fac: Facility) => {
        const success = this.props.fms.insertWaypoint(this.segment.segmentIndex, fac, idx);
        if (!success) {
          this.props.viewService.open('MessageDialog', true).setInput({ inputString: 'Invalid flight plan modification.' });
        }
      });

    return true;
  };

  /**
   * Callback to onUpperKnob on legs for override by sections
   * @param sender The FixInfo element.
   * @returns True if the control handled the event.
   */
  protected onUpperKnobLeg = (sender: G1000UiControl): boolean => {
    return this.onUpperKnobLegBase(sender as FixInfo);
  };

  /**
   * Callback for when CLR event happens on a leg.
   * @param node The FixInfo element.
   * @returns A boolean indicating if the CLR was handled.
   */
  protected readonly onClrLegBase = (node: FixInfo): boolean => {
    const idx = this.listRef.instance.indexOf(node);
    const displayLeg = this.legs.tryGet(idx);

    const isActive = displayLeg !== undefined && displayLeg.get().isActive;
    const selectedLeg = node.props.data.get().legDefinition;
    const isHoldOrPtLegType = [LegType.HM, LegType.HF, LegType.HA, LegType.PI].includes(selectedLeg.leg.type);

    if (selectedLeg !== undefined) {
      const dialog = this.props.viewService.open('MessageDialog', true).setInput({ inputString: `Remove ${selectedLeg?.name}?`, hasRejectButton: true, closeOnAccept: false });
      dialog.onAccept.on((sender, accept) => {
        if (accept) {
          const success = this.props.fms.removeWaypoint(this.segment.segmentIndex, idx);

          if (success) {
            if (isActive && isHoldOrPtLegType) {
              this.props.fms.activateLeg(this.segment.segmentIndex, idx);
            }
            if (isActive && !isHoldOrPtLegType && !Simplane.getIsGrounded()) {
              this.props.fms.createDirectToRandom(selectedLeg.leg.fixIcao);
            }
            dialog.close();
          } else {
            dialog.setInput({ inputString: 'Invalid flight plan modification.' });
          }
        } else {
          dialog.close();
        }
      });
    }

    return true;
  };

  /**
   * Callback to onClr on legs for override by sections
   * @param sender The FixInfo element.
   * @returns A boolean indicating if the CLR was handled.
   */
  protected onClrLeg = (sender: G1000UiControl): boolean => {
    return this.onClrLegBase(sender as FixInfo);
  };

  /**
   * A callback which is called when a leg selection changes.
   * @param item The selected item.
   */
  protected onLegItemSelected(item: Subject<FixLegInfo> | null): void {
    // Notify flight plan element selection
    if (item && this.props.onFlightPlanElementSelected) {
      this.props.onFlightPlanElementSelected(item.get().legDefinition);
    }

    // Notify flight plan focus
    if (item && this.props.onFlightPlanFocusSelected) {
      this.props.onFlightPlanFocusSelected(this.getFlightPlanFocusFromLeg(item.get().legDefinition));
    }
  }

  /**
   * Gets a flight plan focus from a selected flight plan leg.
   * @param leg The selected flight plan leg.
   * @returns The flight plan focus given the selected leg.
   */
  protected getFlightPlanFocusFromLeg(leg: LegDefinition): FlightPlanFocus {
    const plan = this.props.fms.getFlightPlan();
    if (plan.directToData.segmentIndex >= 0) {
      const dtoSegment = plan.getSegment(plan.directToData.segmentIndex);
      // If the DTO target leg is selected and the DTO is active, focus on the DTO leg instead to show the DTO path.
      if (dtoSegment.legs[plan.directToData.segmentLegIndex] === leg && dtoSegment.offset + plan.directToData.segmentLegIndex + FmsUtils.DTO_LEG_OFFSET === plan.activeLateralLeg) {
        leg = dtoSegment.legs[plan.directToData.segmentLegIndex + FmsUtils.DTO_LEG_OFFSET];
      }
    }
    return [leg];
  }

  /**
   * A callback which is called when this section's header is focused.
   */
  protected onHeaderFocused(): void {
    this.props.onFlightPlanElementSelected && this.props.onFlightPlanElementSelected(this.segment ?? null);
  }

  /**
   * A callback which is called when this section's empty row is focused.
   */
  protected onEmptyRowFocused(): void {
    this.props.onFlightPlanElementSelected && this.props.onFlightPlanElementSelected(null);
    this.props.onFlightPlanFocusSelected && this.props.onFlightPlanFocusSelected(this.getFlightPlanFocusWhenEmpty());
  }

  /**
   * Gets a flight plan focus when empty.
   * @returns A flight plan focus.
   */
  protected getFlightPlanFocusWhenEmpty(): FlightPlanFocus {
    if (!this.segment) {
      return [];
    }

    // Try to focus on the leg immediately after where the empty leg row would insert a leg into the plan.
    // If such a leg does not exist, try to focus on the leg immediately before that position.
    const flightPlan = this.props.fms.getFlightPlan();
    const legToFocus = flightPlan.getNextLeg(this.segment.segmentIndex, this.segment.legs.length - 1)
      ?? flightPlan.getPrevLeg(this.segment.segmentIndex, this.segment.legs.length);
    return legToFocus ? [legToFocus] : null;
  }

  /**
   * Method called to collapse or uncollapse this section.
   * @param setHidden is whether to set the legs hidden or not
   */
  public abstract collapseLegs(setHidden: boolean): void;

  /**
   * A method called to get the offset leg index if there is a direct to in the segment.
   * @param index The leg index within the segment.
   * @returns The correct segment leg index for this leg.
   */
  private getPlanSegmentLegIndex(index: number): number {
    const plan = this.props.fms.getPrimaryFlightPlan();
    const directToData = plan.directToData;

    if (this.segment.segmentIndex === directToData.segmentIndex && index === directToData.segmentLegIndex) {
      return index + FmsUtils.DTO_LEG_OFFSET;
    }

    return index;
  }

  /**
   * A callback called when a user constraint is set on a leg.
   * @param index The leg index within the segment.
   * @param alt The altitude to set the user constraint.
   */
  private onAltitudeSet(index: number, alt: number): void {
    const displayLeg = this.legs.tryGet(index)?.get();
    if (!displayLeg) {
      return;
    }

    this.props.fms.setUserConstraint(this.segment.segmentIndex, this.getPlanSegmentLegIndex(index), alt);
  }

  /**
   * A callback called when a user constraint is removed from a leg.
   * @param index The leg index within the segment.
   */
  private onAltitudeRemoved(index: number): void {
    const displayLeg = this.legs.tryGet(index)?.get();
    if (!displayLeg || (displayLeg.isAdvisory && displayLeg.invalidConstraintAltitude === undefined)) {
      return;
    }

    index = this.getPlanSegmentLegIndex(index);

    const underlyingConstraint = this.props.fms.hasConstraint(this.segment.segmentIndex, index);
    const isUserConstraint = this.props.fms.isConstraintUser(this.segment.segmentIndex, index);
    if (underlyingConstraint !== undefined && isUserConstraint) {
      const altitudeNumber = NumberUnitSubject.createFromNumberUnit(UnitType.FOOT.createNumber(underlyingConstraint));
      const unit = Subject.create(UnitType.FOOT);

      const input: MessageDialogDefinition = {
        renderContent: (): VNode =>
          <>
            <span>{'Remove or Revert to published VNV altitude of '}</span>
            <NumberUnitDisplay class='altitude-question-display' formatter={(v): string => v.toFixed(0)} value={altitudeNumber} displayUnit={unit} />
            <span>?</span>
          </>,
        confirmButtonText: 'REMOVE',
        hasRejectButton: true,
        rejectButtonText: 'REVERT'
      };

      this.props.viewService.open('MessageDialog', true).setInput(input).onAccept.on((sender, accept) => {
        if (accept) {
          this.props.fms.setUserConstraint(this.segment.segmentIndex, index);
          this.legs.get(index).apply({ isAdvisory: true });
        } else {
          this.props.fms.setUserConstraint(this.segment.segmentIndex, index, undefined, true);
          this.legs.get(index).apply({ targetAltitude: UnitType.FOOT.convertTo(underlyingConstraint, UnitType.METER) });
        }

        this.legs.get(index).apply({ isUserConstraint: false });
      });
    } else if (isUserConstraint || !displayLeg.isAdvisory) {
      const input: MessageDialogDefinition = {
        inputString: 'Remove VNV altitude?',
        confirmButtonText: 'OK',
        hasRejectButton: true,
        rejectButtonText: 'CANCEL'
      };

      this.props.viewService.open('MessageDialog', true).setInput(input).onAccept.on((sender, accept) => {
        if (accept) {
          this.props.fms.setUserConstraint(this.segment.segmentIndex, index);
          this.legs.get(index).apply({ isUserConstraint: false });
          this.legs.get(index).apply({ isAdvisory: true });
        }
      });
    }
  }

  /**
   * Renders this section's list of flight plan legs.
   * @returns This section's list of flight plan legs, as a VNode.
   */
  protected renderLegList(): VNode {
    return (
      <G1000ControlList
        ref={this.listRef} data={this.legs}
        renderItem={this.renderItem}
        onItemSelected={this.onLegItemSelected.bind(this)}
        hideScrollbar scrollContainer={this.props.scrollContainer}
        reconcileChildBlur={(): BlurReconciliation => BlurReconciliation.Next}
        requireChildFocus
      />
    );
  }

  /**
   * Renders a Leg in the flight plan.
   * @param data The data object for this leg.
   * @returns The rendered VNode.
   */
  protected renderItem = (data: Subject<FixLegInfo>): VNode => {
    if (this.props.isExtendedView) {
      return <FixInfo onUpperKnobInc={this.onUpperKnobLeg} onClr={this.onClrLeg} data={data} isExtended={true}
        viewService={this.props.viewService} onAltitudeChanged={(alt): void => this.onAltitudeSet(this.listRef.instance.getSelectedIndex(), alt)}
        onAltitudeRemoved={(): void => this.onAltitudeRemoved(this.listRef.instance.getSelectedIndex())} />;
    } else {
      return <FixInfo onUpperKnobInc={this.onUpperKnobLeg} onClr={this.onClrLeg} data={data} viewService={this.props.viewService}
        onAltitudeChanged={(alt): void => this.onAltitudeSet(this.listRef.instance.getSelectedIndex(), alt)}
        onAltitudeRemoved={(): void => this.onAltitudeRemoved(this.listRef.instance.getSelectedIndex())} />;
    }
  };

  /**
   * Renders the vertical direct vnode (when we need to pass HTML).
   * @param constraint The VNAV Constraint.
   * @returns A VNode to be rendered in the MessageDialog.
   */
  protected renderVerticalDirectDialogContent = (constraint: VNavConstraint): VNode => {
    const altitude = UnitType.METER.convertTo(constraint.targetAltitude, UnitType.FOOT).toFixed(0);

    return (
      <div>
        Activate Vertical Ð to:<p />{altitude}FT at {constraint.name} ?
      </div>
    );
  };
}