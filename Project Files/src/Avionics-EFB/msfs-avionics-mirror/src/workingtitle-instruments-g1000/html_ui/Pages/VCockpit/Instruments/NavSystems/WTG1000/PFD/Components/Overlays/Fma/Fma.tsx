import { FSComponent, DisplayComponent, VNode, ComputedSubject, Subject, NavMath } from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import { APEvents, NavEvents } from 'msfssdk/instruments';
import { FixTypeFlags, LegTurnDirection, LegType } from 'msfssdk/navigation';
import { ActiveLegType, FlightPlanActiveLegEvent, FlightPlanner, FlightPlannerEvents } from 'msfssdk/flightplan';
import { APAltitudeModes, APLateralModes, APVerticalModes, VNavAltCaptureType, VNavApproachGuidanceMode, VNavPathMode, VNavSimVarEvents } from 'msfssdk/autopilot';

import { LNavSimVars } from '../../../../Shared/Autopilot/LNavSimVars';
import { NavIndicatorController } from '../../../../Shared/Navigation/NavIndicatorController';
import { FmaLegIcon } from '../FmaLegIcon';
import { WaypointAlerter } from '../WaypointAlerter';
import { DirectToState } from '../../../../Shared/FlightPlan/Fms';
import { G1000ControlEvents } from '../../../../Shared/G1000Events';
import { FmaDisplaySlot } from './FmaDisplaySlot';
import { FmaApSlot } from './FmaApSlot';
import { FmaData } from '../../../../Shared/Autopilot/FmaData';

import './Fma.css';

/**
 * The properties on the airspeed component.
 */
interface FmaProps {
  /** An instance of the event bus. */
  bus: EventBus;
  /** A flight planner. */
  planner: FlightPlanner;
  /** The nav indicator controller. */
  navController: NavIndicatorController;
}

/**
 * The PFD FMA.
 */
export class Fma extends DisplayComponent<FmaProps> {

  private apVerticalSpeedArrow = FSComponent.createRef<HTMLElement>();
  private fromWptElement = FSComponent.createRef<HTMLElement>();
  private toWptElement = FSComponent.createRef<HTMLElement>();
  public iconComponentRef = FSComponent.createRef<FmaLegIcon>();

  private planActive = false;

  private distanceSubject = ComputedSubject.create<number, string>(-1, (v) => {
    if (this.planActive && v > 0) {
      return v.toFixed(1);
    } else { return '_ _._ _'; }
  });
  private bearingSubject = ComputedSubject.create<number, string>(-1, (v) => {
    if (this.planActive && v > 0) {
      return `${Math.round(v)}`.padStart(3, '0');
    } else { return '_ _ _'; }
  });

  private autopilotModes: FmaData = {
    verticalActive: APVerticalModes.NONE,
    verticalArmed: APVerticalModes.NONE,
    verticalApproachArmed: APVerticalModes.NONE,
    verticalAltitudeArmed: APAltitudeModes.NONE,
    altitideCaptureArmed: false,
    altitideCaptureValue: 0,
    lateralActive: APLateralModes.NONE,
    lateralArmed: APLateralModes.NONE,
    lateralModeFailed: false,

  };

  private selectedVs = 0;
  private selectedFLC = 0;

  private lateralActiveModeSubject = ComputedSubject.create<APLateralModes, string>(APLateralModes.NONE, (v) => {
    return this.getLateralActiveString(v);
  });
  private lateralArmedModeSubject = ComputedSubject.create<APLateralModes, string>(APLateralModes.NONE, (v) => {
    return this.getLateralArmedString(v);
  });
  private verticalActiveSubject = ComputedSubject.create<APVerticalModes, string>(APVerticalModes.NONE, (v) => {
    return this.getVerticalActiveString(v);
  });

  private verticalArmedSubject = Subject.create('');
  private verticalApproachArmedSubject = Subject.create('');
  private verticalValueSubject = Subject.create('');
  private verticalValueUnitSubject = Subject.create('');

  private vnavAltCapType = VNavAltCaptureType.None;
  private vnavPathMode = VNavPathMode.None;
  private approachMode = VNavApproachGuidanceMode.None;

  private lateralModeFailed = Subject.create<boolean>(false);
  private verticalModeFailed = Subject.create<boolean>(false);

  private obsActive = false;
  private obsValue = 0;

  private flightDirectorOn = false;
  private apMaster = Subject.create<boolean>(false);
  private fdNotInstalled = false;

  /**
   * A callback called after the component renders.
   */
  public onAfterRender(): void {
    if (this.apVerticalSpeedArrow.instance !== null) {
      this.apVerticalSpeedArrow.instance.style.display = 'none';
    }

    const ap = this.props.bus.getSubscriber<APEvents>();
    const vnav = this.props.bus.getSubscriber<VNavSimVarEvents>();
    const fpl = this.props.bus.getSubscriber<FlightPlannerEvents>();
    const lnav = this.props.bus.getSubscriber<LNavSimVars>();
    const g1000Events = this.props.bus.getSubscriber<G1000ControlEvents>();

    ap.on('ap_master_engage').handle((engaged) => { engaged && !this.fdNotInstalled ? this.apMaster.set(true) : null; });
    ap.on('ap_master_disengage').handle((disengaged) => { disengaged ? this.apMaster.set(false) : null; });
    ap.on('flight_director_state').handle(this.onFdChange);
    ap.on('vs_hold_fpm').handle((vs) => {
      this.selectedVs = vs;
      this.handleVerticalValueChanged();
    });
    ap.on('flc_hold_knots').handle((flc) => {
      this.selectedFLC = flc;
      this.handleVerticalValueChanged();
    });

    vnav.on('vnavPathMode').whenChanged().handle(mode => this.onVNavUpdate(mode, this.vnavAltCapType, this.approachMode));
    vnav.on('vnavAltCaptureType').whenChanged().handle(type => this.onVNavUpdate(this.vnavPathMode, type, this.approachMode));
    vnav.on('vnavApproachMode').whenChanged().handle(mode => this.onVNavUpdate(this.vnavPathMode, this.vnavAltCapType, mode));

    fpl.on('fplActiveLegChange').handle((change) => {
      this.onLegChange(change);
    });

    fpl.on('fplIndexChanged').handle(() => {
      this.onLegChange();
    });

    fpl.on('fplLegChange').handle(() => {
      this.onLegChange();
    });

    lnav.on('lnavDis').whenChangedBy(0.1).handle((v) => {
      this.distanceSubject.set(v);
    });
    lnav.on('lnavBrgMag').whenChangedBy(1).handle((v) => {
      this.bearingSubject.set(v);
    });

    g1000Events.on('fma_modes').handle((v) => {
      this.autopilotModes = v;
      let verticalModeFailed = false;
      if (v.lateralModeFailed) {
        this.lateralModeFailed.set(true);
        const verticalMode = this.verticalActiveSubject.getRaw();
        if (verticalMode === APVerticalModes.GP || verticalMode === APVerticalModes.GS) {
          verticalModeFailed = true;
          this.verticalModeFailed.set(true);
        }
      } else {
        this.lateralModeFailed.set(false);
        this.verticalModeFailed.set(false);
      }
      if (!v.lateralModeFailed) {
        this.lateralActiveModeSubject.set(this.autopilotModes.lateralActive);
      }
      if (!verticalModeFailed) {
        this.verticalActiveSubject.set(this.autopilotModes.verticalActive);
      }
      this.lateralArmedModeSubject.set(this.autopilotModes.lateralArmed);
      this.verticalArmedSubject.set(this.getVerticalArmedString(this.autopilotModes.verticalArmed));
      this.verticalApproachArmedSubject.set(this.getVerticalApproachArmedString(this.autopilotModes.verticalApproachArmed));
      this.handleVerticalValueChanged();
    });

    g1000Events.on('fd_not_installed').handle(v => {
      this.fdNotInstalled = v;
      if (v) {
        this.apMaster.set(false);
      }
    });

    const nav = this.props.bus.getSubscriber<NavEvents>();
    nav.on('gps_obs_active').whenChanged().handle((state) => {
      this.obsActive = state;
      this.onLegChange();
    });
    nav.on('gps_obs_value').whenChanged().handle((v) => {
      const value = Math.round(NavMath.normalizeHeading(v));
      this.obsValue = value === 0 ? 360 : value;
      this.onLegChange();
    });
  }

  /**
   * Gets the FMA display string from an AP Vertical Active Mode.
   * @param v The computed subject input value.
   * @returns the string to display on the FMA
   */
  private getVerticalActiveString(v: APVerticalModes): string {
    switch (v) {
      case APVerticalModes.VS:
        return 'VS';
      case APVerticalModes.FLC:
        return 'FLC';
      case APVerticalModes.ALT:
        return 'ALT';
      case APVerticalModes.GS:
        return 'GS';
      case APVerticalModes.VNAV:
        return 'VPTH';
      case APVerticalModes.GP:
        return 'GP';
      case APVerticalModes.PITCH:
        return 'PIT';
      case APVerticalModes.CAP: {
        const alt = this.autopilotModes.verticalAltitudeArmed;
        return alt === APAltitudeModes.ALTS ? 'ALTS' : alt === APAltitudeModes.ALTV ? 'ALTV' : 'ALT';
      }
      default:
        return ' ';
    }
  }

  /**
   * Gets the FMA display string from an AP Vertical Armed Mode.
   * @param v The computed subject input value.
   * @returns the string to display on the FMA
   */
  private getVerticalArmedString(v: APVerticalModes): string {
    if (this.autopilotModes.altitideCaptureArmed || this.autopilotModes.verticalActive === APVerticalModes.VNAV) {
      const alt = this.autopilotModes.verticalAltitudeArmed;
      return alt === APAltitudeModes.ALTS ? 'ALTS' : alt === APAltitudeModes.ALTV ? 'ALTV' : 'ALT';
    }
    switch (v) {
      case APVerticalModes.ALT:
        return 'ALT';
      case APVerticalModes.VNAV:
        if (this.vnavPathMode === VNavPathMode.PathArmed) {
          return 'VPTH';
        }
        return ' ';
      default:
        return ' ';
    }
  }

  /**
   * Gets the FMA display string from an AP Vertical Approach Armed Mode.
   * @param v The computed subject input value.
   * @returns the string to display on the FMA
   */
  private getVerticalApproachArmedString(v: APVerticalModes): string {
    switch (v) {
      case APVerticalModes.GP:
        if (this.autopilotModes.altitideCaptureArmed && this.autopilotModes.verticalArmed === APVerticalModes.VNAV) {
          return 'GP/V';
        }
        return 'GP';
      case APVerticalModes.GS:
        if (this.autopilotModes.altitideCaptureArmed && this.autopilotModes.verticalArmed === APVerticalModes.VNAV) {
          return 'GS/V';
        }
        return 'GS';
      default:
        if (this.autopilotModes.altitideCaptureArmed && this.autopilotModes.verticalArmed === APVerticalModes.VNAV) {
          return 'VPTH';
        }
        return ' ';
    }
  }

  /**
   * Gets the FMA display string from an AP Lateral Active Mode.
   * @param v The computed subject input value.
   * @returns the string to display on the FMA
   */
  private getLateralActiveString(v: APLateralModes): string {
    switch (v) {
      case APLateralModes.HEADING:
        return 'HDG';
      case APLateralModes.LOC:
        return 'LOC';
      case APLateralModes.VOR:
        return 'VOR';
      case APLateralModes.GPSS:
        return 'GPS';
      case APLateralModes.ROLL:
        return 'ROL';
      case APLateralModes.LEVEL:
        return 'LVL';
      default:
        return '';
    }
  }

  /**
   * Gets the FMA display string from an AP Lateral Armed Mode.
   * @param v The computed subject input value.
   * @returns the string to display on the FMA
   */
  private getLateralArmedString(v: APLateralModes): string {
    switch (v) {
      case APLateralModes.HEADING:
        return 'HDG';
      case APLateralModes.LOC:
        return 'LOC';
      case APLateralModes.VOR:
        return 'VOR';
      case APLateralModes.GPSS:
        return 'GPS';
      case APLateralModes.ROLL:
        return 'ROL';
      case APLateralModes.LEVEL:
        return 'LVL';
      case APLateralModes.BC:
        return 'BC';
      default:
        return '';
    }
  }

  /**
   * A callback called when the active VNAV path mode changes.
   * @param mode The new path mode.
   * @param type The new alt capture type.
   * @param approachMode The new approach mode.
   */
  private onVNavUpdate(mode: VNavPathMode, type: VNavAltCaptureType, approachMode: VNavApproachGuidanceMode): void {
    this.vnavPathMode = mode;
    this.vnavAltCapType = type;
    this.approachMode = approachMode;
  }

  /**
   * Handles the vertical value subjects on inputs from the event bus.
   */
  private handleVerticalValueChanged(): void {
    if (this.autopilotModes.verticalActive === APVerticalModes.VS) {
      const vsValue = Math.abs(this.selectedVs);
      this.verticalValueSubject.set(`${(vsValue)}`);
      this.verticalValueUnitSubject.set('FPM');
      if (this.selectedVs < -1) {
        this.apVerticalSpeedArrow.instance.style.display = '';
        this.apVerticalSpeedArrow.instance.setAttribute('transform', 'rotate(180,6,10)');
      } else if (this.selectedVs > 1) {
        this.apVerticalSpeedArrow.instance.style.display = '';
        this.apVerticalSpeedArrow.instance.setAttribute('transform', 'rotate(0,6,10)');
      } else {
        this.apVerticalSpeedArrow.instance.style.display = 'none';
      }
    } else if (this.autopilotModes.verticalActive === APVerticalModes.ALT || this.autopilotModes.verticalActive === APVerticalModes.CAP) {
      this.verticalValueSubject.set(`${(Math.round(this.autopilotModes.altitideCaptureValue))}`);
      this.verticalValueUnitSubject.set('FT');
      this.apVerticalSpeedArrow.instance.style.display = 'none';
    } else if (this.autopilotModes.verticalActive == APVerticalModes.FLC) {
      this.verticalValueSubject.set(`${(Math.round(this.selectedFLC))}`);
      this.verticalValueUnitSubject.set('KT');
      this.apVerticalSpeedArrow.instance.style.display = 'none';
    } else {
      this.apVerticalSpeedArrow.instance.style.display = 'none';
      this.verticalValueSubject.set('');
      this.verticalValueUnitSubject.set('');
    }
  }

  /**
   * A callback called when the FD State changes from the event bus.
   * @param fdState The current FD State value.
   */
  private onFdChange = (fdState: boolean): void => {
    this.flightDirectorOn = fdState;
    if (!this.flightDirectorOn) {
      this.lateralArmedModeSubject.set(APLateralModes.NONE);
      this.lateralActiveModeSubject.set(APLateralModes.NONE);
      this.verticalActiveSubject.set(APVerticalModes.NONE);
      this.verticalArmedSubject.set('');
      this.verticalApproachArmedSubject.set('');
      this.verticalValueSubject.set('');
      this.verticalValueUnitSubject.set('');
      this.apVerticalSpeedArrow.instance.style.display = 'none';
    }
  }

  /**
   * A callback called when the flight plan changes.
   * @param change is the flightplanactivelegevent
   */
  private onLegChange(change?: FlightPlanActiveLegEvent): void {
    const planIndex = this.props.planner.activePlanIndex;
    if (change && change.planIndex !== planIndex || !this.props.planner.hasFlightPlan(planIndex)) {
      return;
    }
    const plan = this.props.planner.getFlightPlan(planIndex);
    const legIndex = (change && change.index) ?? plan.activeLateralLeg;
    const directToState = this.props.navController.fms.getDirectToState();
    const isDirectTo = directToState === DirectToState.TOEXISTING || directToState === DirectToState.TORANDOM ? true : false;

    if (change === undefined || (change !== undefined && change.type === ActiveLegType.Lateral)) {
      let toWpt = undefined;
      let fromWpt = '';
      let toLeg = undefined;

      if (plan.length > 0 && legIndex < plan.length) {
        this.planActive = true;
        toLeg = plan.getLeg(legIndex);
        toWpt = toLeg.name + this.getFixType(toLeg.leg.fixTypeFlags);

        if (legIndex > 0) {
          const fromLeg = plan.getLeg(legIndex - 1);
          if (fromLeg && fromLeg.name !== 'PPOS') {
            fromWpt = plan.getLeg(legIndex - 1).name + this.getFixType(fromLeg.leg.fixTypeFlags);
          }
        }
      } else { this.planActive = false; }

      if (toWpt === undefined) {
        toWpt = '';
      }

      if (toWpt === 'MANSEQ') {
        toWpt = 'man seq';
        let hdg = toLeg?.leg.course ?? 0;
        hdg = NavMath.normalizeHeading(Math.round(hdg));
        hdg = hdg === 0 ? 360 : hdg;
        fromWpt = `hdg ${hdg.toString().padStart(3, '0')}°`;
      }

      if (this.toWptElement.instance !== null) {
        if (this.toWptElement.instance.textContent !== toWpt) {
          this.toWptElement.instance.textContent = toWpt;
        }
      }

      if (this.obsActive) {
        fromWpt = `obs ${this.obsValue.toFixed(0).padStart(3, '0')}°`;
      }

      if (this.fromWptElement.instance !== null) {
        if (this.fromWptElement.instance.textContent !== fromWpt) {
          this.fromWptElement.instance.textContent = fromWpt;
        }
      }

      if (this.iconComponentRef.instance !== null) {
        if (this.obsActive) {
          this.iconComponentRef.instance.updateFmaIcon(true, false, LegType.TF, LegTurnDirection.None);
        } else if (toLeg !== undefined) {
          this.iconComponentRef.instance.updateFmaIcon(true, isDirectTo, toLeg.leg.type, toLeg.leg.turnDirection);
        } else {
          this.iconComponentRef.instance.updateFmaIcon(false);
        }
      }
    }
  }

  /**
   * Returns the fix type string from the flag.
   * @param fixTypeFlag is the flag.
   * @returns a string.
   */
  private getFixType(fixTypeFlag: FixTypeFlags): string {
    switch (fixTypeFlag) {
      case FixTypeFlags.FAF:
        return ' faf';
      case FixTypeFlags.IAF:
        return ' iaf';
      case FixTypeFlags.MAP:
        return ' map';
    }
    return '';
  }

  /**
   * Renders the component.
   * @returns The component VNode.
   */
  public render(): VNode {
    return (
      <div id="NavComBoxCenter">
        <div id="CenterBarTopLeft">
          <span ref={this.fromWptElement} class="dataField"></span>
          <FmaLegIcon ref={this.iconComponentRef} />
          <span ref={this.toWptElement} class="dataField"></span>
          <WaypointAlerter bus={this.props.bus} />
        </div>
        <div id="CenterBarTopRight">
          <div class='FixDist smallText'>DIS</div>
          <div class='FixDistValue dataField'><span>{this.distanceSubject}</span><span class='smallText'>NM</span></div>
          <div class='FixBrg smallText'>BRG</div>
          <div class='FixBrgValue dataField'><span>{this.bearingSubject}</span><span>°</span></div>
        </div>
        <div id="CenterBarBottomLeft">
          <div class='lateral-armed-mode'>{this.lateralArmedModeSubject}</div>
          <FmaDisplaySlot class='lateral-active-mode' armed={this.lateralArmedModeSubject} active={this.lateralActiveModeSubject} isFailed={this.lateralModeFailed} />
        </div>
        <FmaApSlot isActive={this.apMaster} />
        <div class="fma-ap-vertical-modes">
          <FmaDisplaySlot class='activeVerticalMode' armed={this.verticalArmedSubject} secondaryArmed={this.verticalApproachArmedSubject}
            active={this.verticalActiveSubject} isFailed={this.verticalModeFailed} />
          <div class='verticalModeArrow'>
            <svg width='12' height='22'>
              <path ref={this.apVerticalSpeedArrow} d="M 6 18 l -1 0 l 0 -12 l -3 3 l -1.333 -1.344 l 5.333 -5.656 l 5.333 5.656 l -1.333 1.344 l -3 -3 l 0 12 z" fill="rgb(0, 255, 0)" />
            </svg>
          </div>
          <div class='verticalModeValue'>{this.verticalValueSubject}</div>
          <div class='verticalModeUnits'>{this.verticalValueUnitSubject}</div>
          <div class='right'>{this.verticalArmedSubject}</div>
          <div class='right'>{this.verticalApproachArmedSubject}</div>
        </div>
      </div>
    );
  }
}
