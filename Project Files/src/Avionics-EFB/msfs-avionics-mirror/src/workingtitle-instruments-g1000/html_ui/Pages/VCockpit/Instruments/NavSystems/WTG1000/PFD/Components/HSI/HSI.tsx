import { FSComponent, DisplayComponent, VNode, NodeReference, ComponentProps, Subject, ComputedSubject } from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import { ADCEvents, APEvents, NavSourceId, NavSourceType } from 'msfssdk/instruments';
import { FlightPlanner } from 'msfssdk/flightplan';

import { G1000ControlEvents } from '../../../Shared/G1000Events';
import { TrafficAdvisorySystem } from '../../../Shared/Traffic/TrafficAdvisorySystem';
import { NavIndicatorController, ObsSuspModes } from '../../../Shared/Navigation/NavIndicatorController';
import { HSIMap } from './HSIMap';
import { HSIRose } from './HSIRose';

import './HSI.css';
import { PFDUserSettings, PfdMapLayoutSettingMode } from '../../PFDUserSettings';
import { AvionicsComputerSystemEvents, AvionicsSystemState } from '../../../Shared/Systems';

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
}

/**
 * The HSI component of the PFD.
 */
export class HSI extends DisplayComponent<HSIProps> {
  private readonly roseRef = new NodeReference<HSIRose>();
  private readonly mapRef = new NodeReference<HSIMap>();
  private readonly minimumsContainerRef = FSComponent.createRef<HTMLDivElement>();
  private readonly gpsMessage = FSComponent.createRef<HTMLDivElement>();

  public hsiController = this.props.navIndicatorController;
  private dtkBoxLabel = FSComponent.createRef<HTMLElement>();
  private dtkBoxValue = FSComponent.createRef<HTMLElement>();
  private sourceActive: NavSourceId | undefined;
  private minimumsValue = Subject.create(0);
  private headingSelectValue = ComputedSubject.create(0, (v): string => {
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

    ap.on('heading_select')
      .withPrecision(0)
      .handle(this.updateSelectedHeadingDisplay.bind(this));

    g1000.on('set_minimums')
      .handle((mins) => {
        this.minimumsValue.set(mins);
        this.updateMinimumsShown(this.areMinimumsEnabled, this.altitude, this.minimumsValue.get());
      });

    g1000.on('show_minimums')
      .handle((show) => {
        this.areMinimumsEnabled = show;
        this.updateMinimumsShown(this.areMinimumsEnabled, this.altitude, this.minimumsValue.get());
      });

    this.props.bus.getSubscriber<ADCEvents>().on('alt').withPrecision(0).handle(alt => {
      this.altitude = alt;
      this.updateMinimumsShown(this.areMinimumsEnabled, this.altitude, this.minimumsValue.get());
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
        this.dtkBoxLabel.instance.textContent = 'CRS';
        this.dtkBoxValue.instance.style.color = '#00ff00';
        break;
      case NavSourceType.Gps:
        if (this.hsiController.obsSuspMode === ObsSuspModes.OBS) {
          this.dtkBoxLabel.instance.textContent = 'CRS';
        } else {
          this.dtkBoxLabel.instance.textContent = 'DTK';
        }
        this.dtkBoxValue.instance.style.color = 'magenta';
        break;
    }
    const dtk = this.hsiController.navStates[this.hsiController.activeSourceIndex].dtk_obs;
    if (dtk !== null) {
      const disDtk = Math.round(dtk) == 0 ? 360 : Math.round(dtk);
      this.dtkBoxValue.instance.textContent = `${disDtk}°`.padStart(4, '0');
    }
  }

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
          <span ref={this.dtkBoxLabel} />&nbsp;
          <span ref={this.dtkBoxValue} class="size20" />
        </div>
        <div class="mins-temp-comp-container" ref={this.minimumsContainerRef}>
          <div class="mins-temp-comp-upper-text size10">BARO</div>
          <div class="mins-temp-comp-lower-text size14">MIN</div>
          <div class="mins-temp-comp-value size18 cyan">{this.minimumsValue.map(x => x.toFixed(0))}<span class="size12">FT</span></div>
        </div>
        <div class='hsi-gps-msg' ref={this.gpsMessage}>GPS LOI</div>
        <HSIRose ref={this.roseRef} bus={this.props.bus} controller={this.hsiController} />
        <HSIMap ref={this.mapRef} bus={this.props.bus} flightPlanner={this.props.flightPlanner} controller={this.hsiController} tas={this.props.tas} />
      </div >
    );
  }
}
