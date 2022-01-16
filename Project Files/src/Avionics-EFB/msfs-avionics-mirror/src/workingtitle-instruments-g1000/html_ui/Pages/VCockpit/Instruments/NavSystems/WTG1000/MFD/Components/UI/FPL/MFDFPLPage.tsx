import { FSComponent, Subject, VNode } from 'msfssdk';
import { EventBus } from 'msfssdk/data';

import { MapUserSettings } from '../../../../Shared/Map/MapUserSettings';
import { Fms } from '../../../../Shared/FlightPlan/Fms';
import { TrafficAdvisorySystem } from '../../../../Shared/Traffic/TrafficAdvisorySystem';
import { FmsHEvent } from '../../../../Shared/UI/FmsHEvent';
import { MapPointerController } from '../../../../Shared/Map/Controllers/MapPointerController';
import { MFDUiPage, MFDUiPageProps } from '../MFDUiPage';
import { MFDFPL } from './MFDFPL';
import { MFDFPLMapComponent } from './MFDFPLMapComponent';
import { MFDFPLMapModel } from './MFDFPLMapModel';

import './MFDFPLPage.css';
import { FocusPosition } from '../../../../Shared/UI/UiControl2';

/**
 * Component props for MFDFPLPage.
 */
export interface MFDFPLPageProps extends MFDUiPageProps {
  /** The event bus. */
  bus: EventBus;

  /** An instance of the flight planner. */
  fms: Fms;

  /** The G1000 traffic advisory system. */
  tas: TrafficAdvisorySystem;
}

/**
 * A page which displays the flight plan map and active flight plan information.
 */
export class MFDFPLPage extends MFDUiPage<MFDFPLPageProps> {
  private static readonly UPDATE_FREQ = 30; // Hz
  private static readonly POINTER_MOVE_INCREMENT = 5; // pixels

  private readonly mapRef = FSComponent.createRef<MFDFPLMapComponent>();
  private readonly fplRef = FSComponent.createRef<MFDFPL>();

  private readonly mapModel = MFDFPLMapModel.createModel(this.props.bus, this.props.tas);
  private readonly pointerModule = this.mapModel.getModule('pointer');
  private readonly focusModule = this.mapModel.getModule('focus');

  private mapPointerController?: MapPointerController;

  /** @inheritdoc */
  constructor(props: MFDFPLPageProps) {
    super(props);

    this._title.set('FPL – Active Flight Plan');
  }

  /** @inheritdoc */
  public onAfterRender(thisNode: VNode): void {
    super.onAfterRender(thisNode);

    this.mapPointerController = new MapPointerController(this.mapModel, this.mapRef.instance.mapProjection);
    this.mapRef.instance.sleep();
  }

  /** @inheritdoc */
  public processHEvent(evt: FmsHEvent): boolean {
    switch (evt) {
      case FmsHEvent.UPPER_PUSH:
        if (!this.fplRef.instance.isFocused) {
          this.fplRef.instance.focus(FocusPosition.MostRecent);
          this.focusModule.isFocused.set(true);
        } else {
          this.fplRef.instance.blur();
          this.focusModule.isFocused.set(false);
          this.fplRef.instance.resetAutoScroll();
        }
        return true;
      case FmsHEvent.MENU:
        // Always pass menu events through to FPL, even if scroll is disabled.
        if (this.fplRef.instance.onInteractionEvent(evt)) {
          return true;
        }
        break;
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

    let handledByDetails = false;
    if (this.fplRef.instance.isFocused) {
      handledByDetails = this.fplRef.instance.onInteractionEvent(evt);
    }

    if (!handledByDetails) {
      return this.handleMapPointerMoveEvent(evt) || super.onInteractionEvent(evt);
    } else {
      return handledByDetails;
    }
  }

  /**
   * Changes the MFD map range index setting.
   * @param delta The change in index to apply.
   */
  private changeMapRangeIndex(delta: number): void {
    const currentIndex = this.mapModel.getModule('range').nominalRangeIndex.get();
    const newIndex = this.mapRef.instance.changeRangeIndex(delta);

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
        this.mapPointerController?.movePointer(-MFDFPLPage.POINTER_MOVE_INCREMENT, 0);
        return true;
      case FmsHEvent.JOYSTICK_UP:
        this.mapPointerController?.movePointer(0, -MFDFPLPage.POINTER_MOVE_INCREMENT);
        return true;
      case FmsHEvent.JOYSTICK_RIGHT:
        this.mapPointerController?.movePointer(MFDFPLPage.POINTER_MOVE_INCREMENT, 0);
        return true;
      case FmsHEvent.JOYSTICK_DOWN:
        this.mapPointerController?.movePointer(0, MFDFPLPage.POINTER_MOVE_INCREMENT);
        return true;
    }

    return false;
  }

  /** @inheritdoc */
  protected onViewOpened(): void {
    super.onViewOpened();

    this.props.viewService.clearPageHistory();

    this.props.menuSystem.clear();
    this.props.menuSystem.pushMenu('fpln-menu');

    this.mapRef.instance.wake();
    this.fplRef.instance.onViewOpened();
  }

  /** @inheritdoc */
  protected onViewClosed(): void {
    super.onViewClosed();

    this.mapPointerController?.setPointerActive(false);
    this.mapRef.instance.sleep();
  }

  /** @inheritdoc */
  protected onViewResumed(): void {
    super.onViewResumed();

    this.fplRef.instance.onViewResumed();
  }

  /** @inheritdoc */
  protected onFPLPressed(): boolean {
    this.props.viewService.open('NavMapPage');
    return true;
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div ref={this.viewContainerRef} class='mfd-page'>
        <MFDFPLMapComponent
          ref={this.mapRef} model={this.mapModel} bus={this.props.bus}
          updateFreq={Subject.create(MFDFPLPage.UPDATE_FREQ)}
          dataUpdateFreq={Subject.create(MFDFPLPage.UPDATE_FREQ)}
          projectedWidth={440} projectedHeight={734}
          deadZone={new Float64Array([0, 56, 0, 0])} flightPlanner={this.props.fms.flightPlanner}
          id='mfd_fplmap' bingId='mfd_page_map'
          settingManager={MapUserSettings.getMfdManager(this.props.bus)}
          ownAirplaneLayerProps={{
            imageFilePath: 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG1000/Assets/own_airplane_icon.svg',
            invalidHeadingImageFilePath: 'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG1000/Assets/own_airplane_icon_nohdg.svg',
            iconSize: 40,
            iconAnchor: new Float64Array([0.5, 0]),
            invalidHeadingIconAnchor: new Float64Array([0.5, 0.5])
          }}
          trafficIntruderLayerProps={{
            fontSize: 16,
            iconSize: 30
          }}
          drawEntireFlightPlan={this.focusModule.isFocused}
          class='mfd-fplmap'
        />
        <MFDFPL ref={this.fplRef} bus={this.props.bus} viewService={this.props.viewService} fms={this.props.fms} focus={this.focusModule.focus} isolateScroll />
      </div>
    );
  }
}
