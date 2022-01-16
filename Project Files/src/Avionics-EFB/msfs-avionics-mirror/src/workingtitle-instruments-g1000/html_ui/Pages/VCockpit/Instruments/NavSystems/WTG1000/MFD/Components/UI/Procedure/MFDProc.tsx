import { ArraySubject, FSComponent, Subject, VNode } from 'msfssdk';
import { AirportFacility, ApproachProcedure, FacilityType, ICAO } from 'msfssdk/navigation';
import { FmsUtils } from '../../../../Shared/FlightPlan/FmsUtils';
import { Fms, ProcedureType } from '../../../../Shared/FlightPlan/Fms';
import { MenuItemDefinition, PopoutMenuItem } from '../../../../Shared/UI/Dialogs/PopoutMenuItem';
import { List } from '../../../../Shared/UI/List';
import { GroupBox } from '../GroupBox';
import { UiView, UiViewProps } from '../../../../Shared/UI/UiView';
import { UiControl } from '../../../../Shared/UI/UiControl';
import { FmsHEvent } from '../../../../Shared/UI/FmsHEvent';
import { ApproachNameDisplay } from '../../../../Shared/UI/FPL/ApproachNameDisplay';
import { MFDSelectProcedurePage } from './MFDSelectProcedurePage';

import './MFDProc.css';

/** The properties on list menu popout component. */
interface MFDProcProps extends UiViewProps {
  /** An instance of the fms. */
  fms: Fms;
  /** A css class to apply to the dialog. */
  class?: string;
}

/**
 * The PFD procedures popout.
 */
export class MFDProc extends UiView<MFDProcProps> {
  protected listRef = FSComponent.createRef<List>();
  protected listContainerRef = FSComponent.createRef<HTMLElement>();
  private menuItems: MenuItemDefinition[] = this.buildMenuItems();

  protected readonly menuItemsSubject = ArraySubject.create(this.menuItems);
  private readonly arrival = Subject.create('_ _ _ _-');
  private readonly departure = Subject.create('_ _ _ _-');

  private readonly destinationAirportSub = Subject.create<AirportFacility | null>(null);
  private readonly approachSub = Subject.create<ApproachProcedure | null>(null);

  /**
   * A local method to get the ident from an ICAO.
   * @param icao is icao to get the ident from.
   * @returns an ident string or an empty string.
   */
  private getIdent(icao: string | undefined): string {
    if (icao !== undefined) {
      return ICAO.getIdent(icao);
    }
    return '';
  }

  /** @inheritdoc */
  public onViewOpened(): void {
    this.departure.set('_ _ _ _-');
    this.arrival.set('_ _ _ _-');
    this.destinationAirportSub.set(null);
    this.approachSub.set(null);

    const plan = this.props.fms.getPrimaryFlightPlan();
    if (plan && plan.procedureDetails.departureIndex > -1 && plan.originAirport !== undefined) {
      this.props.fms.facLoader.getFacility(FacilityType.Airport, plan.originAirport).then((fac) => {
        let depStr = fac.departures[plan.procedureDetails.departureIndex].name;
        if (plan.procedureDetails.departureTransitionIndex > -1) {
          depStr += '.' + fac.departures[plan.procedureDetails.departureIndex].enRouteTransitions[plan.procedureDetails.departureTransitionIndex].name;
        }
        this.departure.set(this.getIdent(plan.originAirport) + '-' + depStr);
      });
    }
    if (
      plan && plan.destinationAirport !== undefined
      && (plan.procedureDetails.arrivalIndex > -1 || plan.procedureDetails.approachIndex > -1 || plan.getUserData('visual_approach') !== undefined)
    ) {
      this.props.fms.facLoader.getFacility(FacilityType.Airport, plan.destinationAirport).then((fac) => {
        if (plan.procedureDetails.arrivalIndex > -1) {
          let arrStr = fac.arrivals[plan.procedureDetails.arrivalIndex].name;
          if (plan.procedureDetails.arrivalTransitionIndex > -1) {
            arrStr = fac.arrivals[plan.procedureDetails.arrivalIndex].enRouteTransitions[plan.procedureDetails.arrivalTransitionIndex].name + '.' + arrStr;
          }
          this.arrival.set(this.getIdent(plan.destinationAirport) + '-' + arrStr);
        }
        const approach = FmsUtils.getApproachFromPlan(plan, fac);
        this.destinationAirportSub.set(fac);
        this.approachSub.set(approach ?? null);
      });
    }
    const menuItems = this.buildMenuList();
    this.setMenuItems(menuItems);
  }

  /**
   * Sets the menu items for the list menu dialog.
   * @param items The items to set into the menu.
   */
  public setMenuItems(items: MenuItemDefinition[]): void {
    this.menuItems = items;

    this.menuItemsSubject.clear();
    this.menuItemsSubject.set(items);
    this.scrollController.gotoFirst();
  }

  /**
   * Method to dynamically build the menu list
   * @returns an array of menu item definitions
   */
  public buildMenuList(): MenuItemDefinition[] {
    const approachLoaded = this.props.fms.canActivateApproach();
    const canVtfActivate = this.props.fms.canActivateVtf();
    const canMissedActivate = this.props.fms.canMissedApproachActivate();

    const menuItems = [
      {
        id: 'activate-vector-to-final', renderContent: (): VNode => <span>Activate Vector-to-Final</span>, isEnabled: canVtfActivate,
        action: (): void => {
          this.props.fms.activateVtf();
        }
      },
      {
        id: 'activate-approach', renderContent: (): VNode => <span>Activate Approach</span>, isEnabled: approachLoaded,
        action: (): void => {
          this.props.fms.activateApproach();
        }
      },
      {
        id: 'activate-missed', renderContent: (): VNode => <span>Activate Missed Approach</span>, isEnabled: canMissedActivate,
        action: (): void => {
          this.props.fms.activateMissedApproach();
        }
      },
      {
        id: 'select-approach', renderContent: (): VNode => <span>Select Approach</span>, isEnabled: true,
        action: (): void => {
          (this.props.viewService.open('SelectProcedurePage', false) as MFDSelectProcedurePage).setActiveProcedureType(ProcedureType.APPROACH)?.initDefaults();
        }, closeAfterAction: false
      },
      {
        id: 'select-arrival', renderContent: (): VNode => <span>Select Arrival</span>, isEnabled: true,
        action: (): void => {
          (this.props.viewService.open('SelectProcedurePage', false) as MFDSelectProcedurePage).setActiveProcedureType(ProcedureType.ARRIVAL);
        }, closeAfterAction: false
      },
      {
        id: 'select-departure', renderContent: (): VNode => <span>Select Departure</span>, isEnabled: true,
        action: (): void => {
          (this.props.viewService.open('SelectProcedurePage', false) as MFDSelectProcedurePage).setActiveProcedureType(ProcedureType.DEPARTURE);
        }, closeAfterAction: false
      },
    ];
    return menuItems;
  }

  /** @inheritdoc */
  protected buildMenuItems(): MenuItemDefinition[] {
    return this.buildMenuList();
  }

  /** @inheritdoc */
  public onInteractionEvent(evt: FmsHEvent): boolean {
    switch (evt) {
      case FmsHEvent.PROC:
      case FmsHEvent.CLR:
        this.close();
        return true;
    }

    return false;
  }

  /**
   * A callback called to render the menu items.
   * @param d is the menu item
   * @param registerFn The register function.
   * @returns a vnode for display in the menu
   */
  protected renderItem = (d: MenuItemDefinition, registerFn: (ctrl: UiControl) => void): VNode => {
    return <PopoutMenuItem onRegister={registerFn} parent={this} def={d} />;
  }

  /**
   * Renders the component.
   * @returns The component VNode.
   */
  public render(): VNode {
    let className = 'popout-dialog';
    if (this.props.class !== undefined) {
      className += ` ${this.props.class}`;
    }

    return (
      <div class={className} ref={this.viewContainerRef}>
        <h1>{this.props.title}</h1>
        <GroupBox title="Options" ref={this.listContainerRef} class='mfd-proc-options-box'>
          <List ref={this.listRef} onRegister={this.register} data={this.menuItemsSubject} renderItem={this.renderItem} class='mfd-proc-options-list' />
        </GroupBox>
        <GroupBox title="Loaded">
          <div class="white mfd-proc-loaded">
            <div class="gray">Approach:</div>
            <ApproachNameDisplay approach={this.approachSub} airport={this.destinationAirportSub} nullText={'_ _ _ _-'} />
            <div class="gray">Arrival:</div>
            <div>{this.arrival}</div>
            <div class="gray">Departure:</div>
            <div>{this.departure}</div>
          </div>
        </GroupBox>
        <div class="mfd-bottom-menu-prompt">Press the "PROC" key to view the previous page</div>
      </div>
    );
  }

}
