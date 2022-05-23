import { ComponentProps, ComputedSubject, DisplayComponent, FSComponent, NodeReference, Unit, Subject, UnitType, VNode, UnitFamily } from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import { FlightPlanner } from 'msfssdk/flightplan';
import { ADCEvents, APEvents, DHEvents, NavSourceId, NavSourceType } from 'msfssdk/instruments';

import { NavIndicatorController, ObsSuspModes } from 'garminsdk/navigation';

import { G1000ControlEvents } from '../../../Shared/G1000Events';
import { AvionicsComputerSystemEvents, AvionicsSystemState } from '../../../Shared/Systems';
import { TrafficAdvisorySystem } from '../../../Shared/Traffic/TrafficAdvisorySystem';
import { PfdMapLayoutSettingMode, PFDUserSettings } from '../../PFDUserSettings';
import { HSIMap } from './HSIMap';
import { HSIRose } from './HSIRose';

import './HSI.css';
import { UnitsUserSettingManager } from '../../../Shared/Units/UnitsUserSettings';

/**
 * Properties on the HSI component.
 */
interface HSIProps extends ComponentProps {
  /** An instance of the event bus. */
  bus: EventBus;

  /** An instance of the flight planner. */
  flightPlanner: FlightPlanner;

  /** An instance of the nav indicator controller. */
  navIndicatorController: NavIndicatorController;

  /** The G1000 traffic advisory system. */
  tas: TrafficAdvisorySystem;

  /** A user setting manager for DA units.. */
  unitsSettingManager: UnitsUserSettingManager;
}

/**
 * The HSI component of the PFD.
 */
export class HSI extends DisplayComponent<HSIProps> {
  private readonly roseRef = new NodeReference<HSIRose>();
  private readonly mapRef = new NodeReference<HSIMap>();
  private readonly minimumsContainerRef = FSComponent.createRef<HTMLDivElement>();
  private readonly gpsMessage = FSComponent.createRef<HTMLDivElement>();

  public readonly hsiController = this.props.navIndicatorController;
  private readonly dtkBoxLabelSubj = Subject.create<string>('');
  private readonly dtkBoxValue = FSComponent.createRef<HTMLElement>();
  private readonly dtkBoxValueSubj = ComputedSubject.create<number, string>(0, (value) => {
    return `${value}°`.padStart(4, '0');
  });

  private sourceActive: NavSourceId | undefined;
  private minimumFeet = 0;
  private readonly minimumsValue = Subject.create(0);
  private readonly minimumsUnit = ComputedSubject.create<Unit<UnitFamily.Distance>, string>(this.props.unitsSettingManager.altitudeUnits.get(), u => {
    return u === UnitType.METER ? 'M' : 'FT';
  });

  private readonly headingSelectValue = ComputedSubject.create(0, (v): string => {
    const hdg = v == 0 ? 360 : v;
    return `${hdg}°`.padStart(4, '0');
  });

  private areMinimumsEnabled = false;
  private altitude = 0;

  /**
   * A callback called after the component renders.
   */
  public onAfterRender(): void {
    this.hsiController.onUpdateDtkBox = this.updateDtkBox;
    this.registerComponents();

    const ap = this.props.bus.getSubscriber<APEvents>();
    const g1000 = this.props.bus.getSubscriber<G1000ControlEvents>();
    const dh = this.props.bus.getSubscriber<DHEvents>();

    g1000.on('show_minimums')
      .handle((show) => {
        this.areMinimumsEnabled = show;
        this.updateMinimumsShown(this.areMinimumsEnabled, this.altitude, this.minimumFeet);
      });

    ap.on('ap_heading_selected')
      .withPrecision(0)
      .handle(this.updateSelectedHeadingDisplay.bind(this));

    dh.on('decision_altitude').handle((mins) => {
      this.minimumFeet = mins;
      this.minimumsValue.set(Math.round(this.minimumsUnit.getRaw() == UnitType.METER ? UnitType.METER.convertFrom(mins, UnitType.FOOT) : mins));
      this.updateMinimumsShown(this.areMinimumsEnabled, this.altitude, this.minimumFeet);
    });

    this.minimumsUnit.sub(u => {
      this.minimumsValue.set(Math.round(u == 'M' ? UnitType.METER.convertFrom(this.minimumFeet, UnitType.FOOT) : this.minimumFeet));
    });

    this.props.unitsSettingManager.altitudeUnits.sub(u => {
      this.minimumsUnit.set(u);
    });

    this.props.bus.getSubscriber<ADCEvents>().on('alt').withPrecision(0).handle(alt => {
      this.altitude = alt;
      this.updateMinimumsShown(this.areMinimumsEnabled, this.altitude, this.minimumFeet);
    });

    this.props.bus.getSubscriber<AvionicsComputerSystemEvents>()
      .on('avionicscomputer_state_1')
      .handle(state => {
        if (state.index === 1) {
          if (state.current === AvionicsSystemState.On) {
            this.gpsMessage.instance.style.color = 'white';
            this.gpsMessage.instance.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
            this.gpsMessage.instance.textContent = 'GPS INTEG OK';

            setTimeout(() => this.gpsMessage.instance.classList.add('hidden'), 4000);
          } else {
            this.gpsMessage.instance.style.color = 'black';
            this.gpsMessage.instance.style.backgroundColor = 'yellow';
            this.gpsMessage.instance.textContent = 'GPS LOI';

            this.gpsMessage.instance.classList.remove('hidden');
          }
        }
      });

    //init mins to display = none
    this.minimumsContainerRef.instance.classList.add('hidden');

    PFDUserSettings.getManager(this.props.bus).whenSettingChanged('mapLayout').handle((mode) => {
      this.hsiController.onFormatChange(mode === PfdMapLayoutSettingMode.HSI);
      this.mapRef.instance.setVisible(mode === PfdMapLayoutSettingMode.HSI);
    });
  }


  /**
   * Updates the heading indicator when the heading changes.
   * @param selHdg deg The new heading value.
   */
  private updateSelectedHeadingDisplay(selHdg: number): void {
    this.headingSelectValue.set(selHdg);
  }

  /**
   * Updates whether or not the minimums box should be shown.
   * @param areEnabled Whether or not minimums are enabled.
   * @param altitude The current plane altitude.
   * @param minimums The current minimums altitude.
   */
  private updateMinimumsShown(areEnabled: boolean, altitude: number, minimums: number): void {
    if (areEnabled && Math.abs(altitude - minimums) <= 2500) {
      this.minimumsContainerRef.instance.classList.remove('hidden');
    } else {
      this.minimumsContainerRef.instance.classList.add('hidden');
    }
  }

  /**
   * Updates the dtk/obs-crs ref box.
   */
  public updateDtkBox = (): void => {
    switch (this.hsiController.navStates[this.hsiController.activeSourceIndex].source.type) {
      case NavSourceType.Nav:
        this.dtkBoxLabelSubj.set('CRS');
        this.dtkBoxValue.instance.style.color = '#00ff00';
        break;
      case NavSourceType.Gps:
        if (this.hsiController.obsSuspMode === ObsSuspModes.OBS) {
          this.dtkBoxLabelSubj.set('OBS');
        } else {
          this.dtkBoxLabelSubj.set('DTK');
        }
        this.dtkBoxValue.instance.style.color = 'magenta';
        break;
    }
    const dtk = this.hsiController.navStates[this.hsiController.activeSourceIndex].dtk_obs;
    if (dtk !== null) {
      const disDtk = Math.round(dtk) == 0 ? 360 : Math.round(dtk);
      this.dtkBoxValueSubj.set(disDtk);
    }
  };

  /**
   * Registers the rose and map hsi components with the HSI Controller.
   */
  private registerComponents(): void {
    this.hsiController.hsiRefs.hsiRose = this.roseRef;
    this.hsiController.hsiRefs.hsiMap = this.mapRef;
  }

  /**
   * Renders the component.
   * @returns The component VNode.
   */
  public render(): VNode {
    return (
      <div id="HSI">
        <div class="hdgcrs-container hdg-box">HDG <span class="cyan size20">{this.headingSelectValue}</span></div>
        <div class="hdgcrs-container dtk-box">
          <span>{this.dtkBoxLabelSubj}</span>&nbsp;
          <span ref={this.dtkBoxValue} class="size20">{this.dtkBoxValueSubj}</span>
        </div>
        <div class="mins-temp-comp-container" ref={this.minimumsContainerRef}>
          <div class="mins-temp-comp-upper-text size10">BARO</div>
          <div class="mins-temp-comp-lower-text size14">MIN</div>
          <div class="mins-temp-comp-value size18 cyan">{this.minimumsValue}<span class="size12">{this.minimumsUnit}</span></div>
        </div>
        <div class='hsi-gps-msg' ref={this.gpsMessage}>GPS LOI</div>
        <HSIRose ref={this.roseRef} bus={this.props.bus} controller={this.hsiController} unitsSettingManager={this.props.unitsSettingManager} />
        <HSIMap ref={this.mapRef} bus={this.props.bus} flightPlanner={this.props.flightPlanner} controller={this.hsiController} tas={this.props.tas} />
      </div >
    );
  }
}
