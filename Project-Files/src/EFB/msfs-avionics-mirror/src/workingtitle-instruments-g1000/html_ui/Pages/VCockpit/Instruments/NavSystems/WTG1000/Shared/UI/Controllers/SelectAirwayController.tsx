import { FSComponent, NodeReference, Subject, VNode } from 'msfssdk';
import { IntersectionFacility, FacilityType, ICAO } from 'msfssdk/navigation';
import { FlightPlannerEvents } from 'msfssdk/flightplan';

import { Fms } from 'garminsdk/flightplan';
import { ContextMenuDialog, ContextMenuItemDefinition } from '../Dialogs/ContextMenuDialog';
import { SelectControl } from '../UIControls/SelectControl';
import { SelectAirwayStore } from './SelectAirwayStore';

/**
 * The properties Select Airway Input Data.
 */
export interface SelectAirwayInputData {
  /** The selected segment index to insert an airway from. */
  segmentIndex: number;
  /** The selected leg index to insert an airway from. */
  legIndex: number;
}

/** The controller for SelectProcedure views. */
export class SelectAirwayController {
  public inputIcao = Subject.create('');
  public readonly entrySubject = Subject.create('');
  public canLoad = Subject.create(false);
  public emptyListText = Subject.create('NONE');
  public entryIndex = -1;
  public entryIndexSubject = Subject.create(-1);

  /**
   * Creates a Select Airway Controller
   * @param store The store.
   * @param selectNextCb Callback when the next control should be focused.
   * @param fms The FMS instance.
   * @param exitSelectControlRef is the ref for the exit select control.
   */
  constructor(readonly store: SelectAirwayStore,
    readonly selectNextCb: () => void,
    readonly fms: Fms,
    readonly exitSelectControlRef: NodeReference<SelectControl<IntersectionFacility>>) {

    const fpl = this.fms.bus.getSubscriber<FlightPlannerEvents>();
    fpl.on('fplCalculated').handle((e) => {
      if (e.planIndex == 2) {
        const plan = this.fms.flightPlanner.getFlightPlan(2);
        if (plan.segmentCount > 0) {
          const segment = plan.getSegment(0);
          for (let i = 0; i < segment.legs.length; i++) {
            const leg = this.store.sequence.tryGet(i);
            if (leg !== undefined) {
              leg.get().calculated = segment.legs[i].calculated;
              leg.notify();
            }
          }
        }
      }
    });
  }

  /**
   * Sets existing fix for Direct To Existing
   * @param inputData is the DirectToInputData
   */
  public async setExistingFix(inputData: SelectAirwayInputData | undefined): Promise<void> {
    if (inputData?.legIndex !== undefined && inputData?.segmentIndex !== undefined) {
      const plan = this.fms.getFlightPlan();
      const segment = plan.getSegment(inputData.segmentIndex);
      const fixIcao = segment.legs[inputData.legIndex].leg.fixIcao;
      this.inputIcao.set(fixIcao);
      this.entrySubject.set(ICAO.getIdent(this.inputIcao.get()));
      const fac = await this.getFacility(this.inputIcao.get());
      this.store.loadFacility(fac);
      this.gotoNextSelect(false);
    } else {
      this.inputIcao.set('');
    }
  }

  /** Initialize the controller. */
  public initialize(): void {
    this.emptyListText.set('NONE');
    this.canLoad.set(false);
    this.store.clearFacility();
  }

  /** Get the facility.
   * @param icao is the intersection icao
   * @returns an Intersection Facility
   */
  private async getFacility(icao: string): Promise<IntersectionFacility> {
    const facility = await this.fms.facLoader.getFacility(FacilityType.Intersection, icao);
    return facility;
  }

  /**
   * Evaluates if the next select should be focused.
   * @param isRefresh If select event happened based on a data refresh.
   */
  private gotoNextSelect = (isRefresh: boolean): void => {
    if (!isRefresh) {
      this.selectNextCb();
    }
  };

  /**
   * Callback handler for when an airway is selected.
   * @param index is the index of the item selected
   * @param airway The airway name selected.
   * @param isRefresh If select event happened based on a data refresh.
   */
  public onAirwaySelected = (index: number, airway: string, isRefresh: boolean): void => {
    this.emptyListText.set(index <= 0 ? 'NONE' : 'LOADING...');
    this.canLoad.set(false);
    this.store.exits.clear();
    this.store.sequence.clear();

    if (!isRefresh && index > 0) {
      this.store.loadAirway(airway, this.fms.facLoader).then(() => {
        this.store.exits.set(this.store.getExits());
        this.exitSelectControlRef.instance.SelectedValue.set(this.entryIndex);
        this.entryIndexSubject.set(this.entryIndex);
        this.gotoNextSelect(isRefresh);
      });
    }
  };

  /**
   * Builds an airway menu item.
   * @param airway The airway to build the menu item for.
   * @returns A menu item definition.
   */
  public buildAirwayMenuItem = (airway: string): ContextMenuItemDefinition => {
    return { id: airway, renderContent: (): VNode => <span>{airway}</span>, estimatedWidth: airway.length * ContextMenuDialog.CHAR_WIDTH };
  };

  /**
   * Callback handler for when an enroute transition is selected.
   * @param index The index of the selected transition.
   * @param item The transition selected.
   * @param isRefresh If select event happened based on a data refresh.
   */
  public onExitSelected = (index: number, item: IntersectionFacility, isRefresh: boolean): void => {
    this.store.selectedExit = item;
    if (!isRefresh) {
      this.store.buildSequence(this.fms);
      this.gotoNextSelect(isRefresh);
      this.canLoad.set(true);
    }
  };

  /**
   * Builds an airway exit menu item.
   * @param waypoint The intersection facility of the exit.
   * @param index The index of the airway.
   * @returns A menu item definition.
   */
  public buildExitMenuItem = (waypoint: IntersectionFacility, index: number): ContextMenuItemDefinition => {
    const isEnabled = waypoint.icao !== this.inputIcao.get();
    if (!isEnabled) {
      // console.log('entry index: ' + index);
      this.entryIndex = index;
    }

    const ident = ICAO.getIdent(waypoint.icao);
    return {
      id: index.toString(),
      renderContent: (): VNode => <span>{ident}</span>,
      isEnabled: isEnabled,
      estimatedWidth: ident.length * ContextMenuDialog.CHAR_WIDTH
    };
  };

  /** Callback handler for when load is pressed. */
  public onLoadSelected = (): void => {
    this.onLoadExecuted();
  };

  /** Callback handler for when load is pressed. */
  public onLoadExecuted = (): void => {
    if (this.store.selectedFacility !== undefined && this.store.selectedAirway !== undefined && this.store.selectedExit !== undefined) {
      this.fms.insertAirwaySegment(this.store.selectedAirway, this.store.selectedFacility, this.store.selectedExit, this.store.inputSegment, this.store.inputLeg);
    }
  };
}