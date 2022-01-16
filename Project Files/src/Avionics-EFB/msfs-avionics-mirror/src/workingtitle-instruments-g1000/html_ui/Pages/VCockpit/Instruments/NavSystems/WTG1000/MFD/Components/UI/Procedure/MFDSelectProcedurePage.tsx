import { FSComponent, Subject, VecNSubject, VNode } from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import { FlightPathCalculator, FlightPlan } from 'msfssdk/flightplan';
import { Fms, ProcedureType } from '../../../../Shared/FlightPlan/Fms';
import { G1000ControlEvents } from '../../../../Shared/G1000Events';
import { MapPointerController } from '../../../../Shared/Map/Controllers/MapPointerController';
import { FmsHEvent } from '../../../../Shared/UI/FmsHEvent';
import { UiControlGroup } from '../../../../Shared/UI/UiControlGroup';
import { MFDUiPage, MFDUiPageProps } from '../MFDUiPage';
import { MFDSelectApproach } from './Approach/MFDSelectApproach';
import { MFDSelectArrival } from './DepArr/MFDSelectArrival';
import { MFDSelectDeparture } from './DepArr/MFDSelectDeparture';
import { MFDProcMapComponent } from './MFDProcMapComponent';
import { MFDProcMapModel } from './MFDProcMapModel';

import './MFDSelectProcedurePage.css';

/**
 * An MFD select procedure component.
 */
export interface MFDSelectProcedure extends UiControlGroup {
  /**
   * Activates this component.
   */
  activate(): void;

  /**
   * Deactivates this component.
   */
  deactivate(): void;
}

/**
 * A map of procedure types to MFD select procedure component types.
 */
export type MFDSelectProcedureTypeComponentMap = {
  /** Departures. */
  [ProcedureType.DEPARTURE]: MFDSelectDeparture;
  /** Arrivals. */
  [ProcedureType.ARRIVAL]: MFDSelectArrival;
  /** Approaches. */
  [ProcedureType.APPROACH]: MFDSelectApproach;
  /** Visual approaches. */
  [ProcedureType.VISUALAPPROACH]: MFDSelectApproach;
}

/**
 * Component props for MFDSelectProcedurePage.
 */
export interface MFDSelectProcedurePageProps extends MFDUiPageProps {
  /** The event bus. */
  bus: EventBus;

  /** The flight management system. */
  fms: Fms;

  /** A flight path calculator to use to build preview flight plans. */
  calculator: FlightPathCalculator;
}

/**
 * An MFD select procedure page.
 */
export class MFDSelectProcedurePage extends MFDUiPage<MFDSelectProcedurePageProps> {
  protected static readonly MAP_UPDATE_FREQ = 30; // Hz
  protected static readonly MAP_POINTER_MOVE_INCREMENT = 5; // pixels

  protected readonly mapRef = FSComponent.createRef<MFDProcMapComponent>();
  protected readonly selectDepartureRef = FSComponent.createRef<MFDSelectDeparture>();
  protected readonly selectArrivalRef = FSComponent.createRef<MFDSelectArrival>();
  protected readonly selectApproachRef = FSComponent.createRef<MFDSelectApproach>();

  protected readonly mapModel = MFDProcMapModel.createModel(this.props.bus);
  protected readonly pointerModule = this.mapModel.getModule('pointer');
  protected readonly focusModule = this.mapModel.getModule('focus');

  protected readonly mapRangeIndexSub = Subject.create(14);

  protected readonly procedurePlanSub = Subject.create<FlightPlan | null>(null);
  protected readonly transitionPlanSub = Subject.create<FlightPlan | null>(null);

  private mapPointerController?: MapPointerController;

  private activeSelectProcedure?: MFDSelectProcedure;
  private activeProcedureTypeSub = Subject.create(ProcedureType.APPROACH);

  /** @inheritdoc */
  public onAfterRender(thisNode: VNode): void {
    super.onAfterRender(thisNode);

    this.mapPointerController = new MapPointerController(this.mapModel, this.mapRef.instance.mapProjection);
    this.mapRef.instance.sleep();

    // Select procedure pages are always scroll enabled.
    this.setScrollEnabled(true);

    this.selectDepartureRef.instance.deactivate();
    this.selectArrivalRef.instance.deactivate();
    this.selectApproachRef.instance.deactivate();
    this._setActiveProcedureType(this.activeProcedureTypeSub.get());

    this.props.bus.getSubscriber<G1000ControlEvents>().on('mfd_proc_page_type').whenChanged().handle(type => {
      this._setActiveProcedureType(type);
    });
  }

  /**
   * Sets the active procedure type for this page, activating the corresponding select procedure component. Procedure
   * selection is restricted to the active procedure type.
   * @param type A procedure type.
   * @returns The select procedure component that was activated, or undefined if this page is not yet initialized.
   */
  public setActiveProcedureType<T extends ProcedureType>(type: T): MFDSelectProcedureTypeComponentMap[T] | undefined {
    this.props.bus.pub('mfd_proc_page_type', type, false);
    return this.activeSelectProcedure as MFDSelectProcedureTypeComponentMap[T] | undefined;
  }

  /**
   * Sets the active procedure type for this page, activating the corresponding select procedure component.
   * @param type A procedure type.
   */
  private _setActiveProcedureType(type: ProcedureType): void {
    this.activeProcedureTypeSub.set(type);

    if (this.activeSelectProcedure) {
      this.activeSelectProcedure.deactivate();
      this.scrollController.unregisterCtrl(this.activeSelectProcedure);
    }

    let selectProc: MFDSelectProcedure | undefined;
    switch (type) {
      case ProcedureType.DEPARTURE:
        selectProc = this.selectDepartureRef.instance;
        this._title.set('PROC – Departure Loading');
        break;
      case ProcedureType.ARRIVAL:
        selectProc = this.selectArrivalRef.instance;
        this._title.set('PROC – Arrival Loading');
        break;
      case ProcedureType.APPROACH:
      case ProcedureType.VISUALAPPROACH:
        selectProc = this.selectApproachRef.instance;
        this._title.set('PROC – Approach Loading');
        break;
    }

    this.activeSelectProcedure = selectProc;
    if (selectProc) {
      this.scrollController.registerCtrl(selectProc);
      this.scrollController.gotoFirst();
      selectProc.activate();
    }
  }

  /** @inheritdoc */
  public onInteractionEvent(evt: FmsHEvent): boolean {
    switch (evt) {
      case FmsHEvent.UPPER_PUSH:
        this.props.viewService.openLastPage();
        return true;
      case FmsHEvent.RANGE_DEC:
        this.changeMapRangeIndex(-1);
        return true;
      case FmsHEvent.RANGE_INC:
        this.changeMapRangeIndex(1);
        return true;
      case FmsHEvent.JOYSTICK_PUSH:
        this.mapPointerController?.togglePointerActive();
        return true;
    }

    return this.handleMapPointerMoveEvent(evt) || super.onInteractionEvent(evt);
  }

  /**
   * Changes the MFD map range index setting.
   * @param delta The change in index to apply.
   */
  private changeMapRangeIndex(delta: number): void {
    const maxIndex = this.mapModel.getModule('range').nominalRanges.get().length - 1;
    const currentIndex = this.mapModel.getModule('range').nominalRangeIndex.get();
    const newIndex = Utils.Clamp(currentIndex + delta, 0, maxIndex);
    this.mapRangeIndexSub.set(newIndex);

    if (currentIndex !== newIndex) {
      this.mapPointerController?.targetPointer();
    }
  }

  /**
   * Handles events that move the map pointer.
   * @param evt The event.
   * @returns Whether the event was handled.
   */
  private handleMapPointerMoveEvent(evt: FmsHEvent): boolean {
    if (!this.pointerModule.isActive.get()) {
      return false;
    }

    switch (evt) {
      case FmsHEvent.JOYSTICK_LEFT:
        this.mapPointerController?.movePointer(-MFDSelectProcedurePage.MAP_POINTER_MOVE_INCREMENT, 0);
        return true;
      case FmsHEvent.JOYSTICK_UP:
        this.mapPointerController?.movePointer(0, -MFDSelectProcedurePage.MAP_POINTER_MOVE_INCREMENT);
        return true;
      case FmsHEvent.JOYSTICK_RIGHT:
        this.mapPointerController?.movePointer(MFDSelectProcedurePage.MAP_POINTER_MOVE_INCREMENT, 0);
        return true;
      case FmsHEvent.JOYSTICK_DOWN:
        this.mapPointerController?.movePointer(0, MFDSelectProcedurePage.MAP_POINTER_MOVE_INCREMENT);
        return true;
    }

    return false;
  }

  /** @inheritdoc */
  protected onViewOpened(): void {
    super.onViewOpened();

    this.props.menuSystem.clear();
    this.props.menuSystem.pushMenu('selectproc-root');

    this.mapRef.instance.wake();
  }

  /** @inheritdoc */
  protected onViewClosed(): void {
    this.mapPointerController?.setPointerActive(false);
    this.mapRef.instance.sleep();
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div ref={this.viewContainerRef} class='mfd-page'>
        <MFDProcMapComponent
          ref={this.mapRef} model={this.mapModel} bus={this.props.bus}
          updateFreq={Subject.create(MFDSelectProcedurePage.MAP_UPDATE_FREQ)}
          dataUpdateFreq={Subject.create(MFDSelectProcedurePage.MAP_UPDATE_FREQ)}
          projectedWidth={578} projectedHeight={734}
          deadZone={VecNSubject.createFromVector(new Float64Array([0, 56, 0, 0]))}
          flightPlanner={this.props.fms.flightPlanner}
          bingId='mfd_page_map'
          rangeIndex={this.mapRangeIndexSub}
          procedureType={this.activeProcedureTypeSub}
          procedurePlan={this.procedurePlanSub}
          transitionPlan={this.transitionPlanSub}
          ownAirplaneLayerProps={{
            imageFilePath: 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG1000/Assets/own_airplane_icon.svg',
            invalidHeadingImageFilePath: 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG1000/Assets/own_airplane_icon_nohdg.svg',
            iconSize: 40,
            iconAnchor: new Float64Array([0.5, 0]),
            invalidHeadingIconAnchor: new Float64Array([0.5, 0.5])
          }}
          class='mfd-procmap'
        />
        <MFDSelectDeparture
          ref={this.selectDepartureRef}
          viewService={this.props.viewService}
          bus={this.props.bus}
          fms={this.props.fms}
          calculator={this.props.calculator}
          procedurePlan={this.procedurePlanSub}
          transitionPlan={this.transitionPlanSub}
          focus={this.focusModule.focus}
        />
        <MFDSelectArrival
          ref={this.selectArrivalRef}
          viewService={this.props.viewService}
          bus={this.props.bus}
          fms={this.props.fms}
          calculator={this.props.calculator}
          procedurePlan={this.procedurePlanSub}
          transitionPlan={this.transitionPlanSub}
          focus={this.focusModule.focus}
        />
        <MFDSelectApproach
          ref={this.selectApproachRef}
          viewService={this.props.viewService}
          bus={this.props.bus}
          fms={this.props.fms}
          calculator={this.props.calculator}
          procedurePlan={this.procedurePlanSub}
          transitionPlan={this.transitionPlanSub}
          focus={this.focusModule.focus}
        />
      </div>
    );
  }
}