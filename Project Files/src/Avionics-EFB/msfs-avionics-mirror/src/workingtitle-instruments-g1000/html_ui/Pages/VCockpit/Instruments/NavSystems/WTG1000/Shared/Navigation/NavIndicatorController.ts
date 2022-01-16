import { NavMath, NodeReference, Subject, UnitType } from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import {
  ADCEvents,
  BearingDirection,
  BearingSource,
  BearingValidity,
  CdiDeviation, DmeState, FrequencyBank, Glideslope, GNSSEvents, Localizer, LocalizerFrequency, NavEvents, NavSourceId,
  NavSourceType, ObsSetting, RadioEvents, RadioType, VorToFrom, VorToFromSetting
} from 'msfssdk/instruments';
import { FlightPlanLegEvent, FlightPlannerEvents } from 'msfssdk/flightplan';
import { VNavApproachGuidanceMode, VNavMode, VNavPathMode, VNavSimVarEvents } from 'msfssdk/autopilot';

import { CDIScaleLabel, LNavSimVars } from '../Autopilot/LNavSimVars';
import { VerticalDeviation } from '../../PFD/Components/FlightInstruments/VerticalDeviation';
import { LNavEvents } from '../Autopilot/Directors/LNavDirector';
import { G1000ControlEvents } from '../G1000Events';
import { Fms } from '../FlightPlan/Fms';
import { AdditionalApproachType } from 'msfssdk/navigation';

export enum NavSensitivity {
  DPRT = 'DPRT',
  TERM = 'TERM',
  ENR = 'ENR',
  OCN = 'OCN',
  LNAV = 'LNAV',
  LNAVplusV = 'LNAV+V',
  VIS = 'VISUAL',
  LVNAV = 'L/VNAV',
  LPV = 'LPV',
  LP = 'LP',
  LPplusV = 'LP+V',
  MAPR = 'MAPR',
  VOR = 'VOR',
  ILS = 'ILS'
}

export enum ObsSuspModes {
  NONE,
  SUSP,
  OBS
}

export enum VNavDisplayMode {
  NONE,
  PATH
}

export enum GPDisplayMode {
  NONE,
  PREVIEW,
  ACTIVE
}

/**
 * Encapsulation of the logic for an nav source.
 */
export class HsiSource {
  public source: NavSourceId;
  public valid = false;
  public bearing: number | null = null;
  public distance: number | null = null;
  public deviation: number | null = null;
  public deviationScale = 1.0;
  public deviationScaleLabel: CDIScaleLabel | null = null;
  public toFrom: VorToFrom = VorToFrom.OFF;
  public dtk_obs: number | null = null;
  public isLocalizer = false;
  public hasSignal = false;
  public hasLocalizer = false;
  public localizerCourse: number | null = null;
  public hasGlideslope = false;
  public gsDeviation: number | null = null;
  public altDeviation: number | null = null;
  public hasDme = false;
  public frequency: number | null = null;

  /**
   * Create an HSI Source
   * @param id The navsourceid.
   */
  public constructor(id: NavSourceId) {
    this.source = id;
    if (this.source.type === NavSourceType.Nav) {
      this.dtk_obs = 0;
    }
  }
}

/**
 * A NavIndicatorController to control what nav sources are being indicated on the panel.
 */
export class NavIndicatorController {
  public bus: EventBus;
  public onUpdateDtkBox?: () => void;
  public navStates: HsiSource[] = [];
  public activeSensitivity: NavSensitivity = NavSensitivity.VOR;
  public activeSourceIndex = 0;
  public hsiMapActive = false;
  public courseNeedleRefs: any = { hsiRose: undefined, hsiMap: undefined };
  public hsiRefs: any = { hsiRose: undefined, hsiMap: undefined };
  public hsiMapDeviationRef: any = undefined;
  public vdi: VerticalDeviation | undefined = undefined;
  private bearingPointerStatus = [false, false];
  private bearingPointerAdf = [false, false];
  private bearingPointerDirection: (number | null)[] = [null, null];
  private firstRun = true;
  public obsSuspMode = ObsSuspModes.NONE;
  private missedApproachActive = false;

  private currentSpeed = 30;
  private currentHeading = 0;
  private currentAltitude = 0;

  private currentVNavTodDistance = -1;
  private currentVNavBodDistance = -1;
  private vnavPathInRange = false;
  private currentVNavTargetAltitude = -1;
  private currentVNavConstraintAltitude = -1;
  private currentVNavFpa = 0;
  private vnavState = VNavMode.Enabled;
  public currentVNavPathMode = VNavPathMode.None;
  public readonly vnavDisplayMode = Subject.create(VNavDisplayMode.NONE);
  public readonly gpDisplayMode = Subject.create(GPDisplayMode.NONE);

  public currentVnavApproachMode = VNavApproachGuidanceMode.None;
  private currentLpvDeviation = Number.POSITIVE_INFINITY;
  public currentLpvDistance = Number.POSITIVE_INFINITY;

  public readonly dmeSourceIndex = Subject.create(0);
  public readonly dmeDistanceSubject = Subject.create(-1);
  public readonly isLnavCalculating = Subject.create<boolean>(false);

  /**
   * Initialize an instance of the NavIndicatorController.
   * @param bus is the event bus
   * @param fms is the fms
   */
  constructor(bus: EventBus, public fms: Fms) {
    this.bus = bus;
    for (let i = 0; i < 3; i++) {
      const type = i < 2 ? NavSourceType.Nav : NavSourceType.Gps;
      const index = i == 1 ? 2 : 1;
      const sourceId: NavSourceId = { type: type, index: index };
      const source: HsiSource = new HsiSource(sourceId);
      source.toFrom = VorToFrom.OFF;
      this.navStates.push(source);
    }
    this.monitorEvents();
  }

  /**
   * Method to monitor nav processor events to keep track of HSI-related data.
   */
  public monitorEvents(): void {
    const g1000 = this.bus.getSubscriber<G1000ControlEvents>();
    g1000.on('approach_details_set').handle(() => {
      this.updateSensitivity();
      this.onUpdateLpv(this.currentLpvDeviation, this.currentLpvDistance);
    });

    this.bus.getSubscriber<GNSSEvents>().on('ground_speed').handle(speed => this.currentSpeed = speed);

    const adc = this.bus.getSubscriber<ADCEvents>();
    adc.on('hdg_deg').withPrecision(1).handle(hdg => this.currentHeading = hdg);
    adc.on('alt').atFrequency(1).handle(alt => this.currentAltitude = alt);

    const navcom = this.bus.getSubscriber<RadioEvents>();
    navcom.on('setFrequency').handle((setFrequency) => {
      if (setFrequency.radio.radioType === RadioType.Nav && setFrequency.bank == FrequencyBank.Active) {
        this.navStates[setFrequency.radio.index - 1].frequency = setFrequency.frequency;
      }
    });

    const nav = this.bus.getSubscriber<NavEvents>();
    nav.on('cdi_select').handle(this.onUpdateCdiSelect);
    nav.on('obs_set').handle(this.onUpdateDtk);
    nav.on('cdi_deviation').handle(this.onUpdateCdiDeviation);
    nav.on('vor_to_from').handle(this.onUpdateToFrom);
    nav.on('localizer').handle(this.onUpdateLocalizer);
    nav.on('glideslope').handle(this.onUpdateGlideslope);
    nav.on('is_localizer_frequency').handle(this.onUpdateIsLocFreq);
    nav.on('brg_source').whenChanged().handle(this.updateBearingSrc);
    nav.on('brg_direction').handle(this.updateBearingDir);
    nav.on('dme_state').handle(this.onUpdateDme);
    nav.on('brg_validity').handle(this.updateBearingValidity);
    nav.on('gps_obs_active').handle(obsActive => {
      if (obsActive) {
        this.obsSuspMode = ObsSuspModes.OBS;
      } else {
        this.obsSuspMode = ObsSuspModes.NONE;
      }
      if (this.onUpdateDtkBox !== undefined) {
        this.onUpdateDtkBox();
      }
      this.updateSensitivity();
    });

    const lnavSimVars = this.bus.getSubscriber<LNavSimVars>();
    lnavSimVars.on('lnavDtkMag').handle(this.onUpdateLnavDtk);
    lnavSimVars.on('lnavXtk').handle(this.onUpdateLnavXtk);
    lnavSimVars.on('lnavBrgMag').whenChangedBy(5).handle(this.onUpdateLnavBrg);
    lnavSimVars.on('lnavCdiScaling').handle(scale => {
      this.navStates[2].deviationScale = scale;
    });
    lnavSimVars.on('lnavCdiScalingLabel').handle(label => {
      this.navStates[2].deviationScaleLabel = label;
      this.updateSensitivity();
    });

    const lnavEvents = this.bus.getSubscriber<LNavEvents>();
    lnavEvents.on('suspChanged').handle(isSuspended => {
      if (isSuspended) {
        this.obsSuspMode = ObsSuspModes.SUSP;
      } else {
        this.obsSuspMode = ObsSuspModes.NONE;
      }
      this.updateSensitivity();
    });

    const vnav = this.bus.getSubscriber<VNavSimVarEvents>();
    vnav.on('vnavVDev').withPrecision(0).handle(deviation => this.onUpdateVnav(deviation));
    vnav.on('vnavLpvVDev').withPrecision(0).handle(deviation => this.onUpdateLpv(deviation, this.currentLpvDistance));
    vnav.on('vnavLpvDistance').withPrecision(0).handle(distance => this.onUpdateLpv(this.currentLpvDeviation, distance));
    vnav.on('vnavApproachMode').whenChanged().handle((mode) => {
      this.currentVnavApproachMode = mode;
      this.updateVNavDisplayMode();
    });
    vnav.on('vnavPathMode').handle(mode => {
      this.currentVNavPathMode = mode;
      this.updateVNavDisplayMode();
    });
    vnav.on('vnavTodDistance').atFrequency(1).handle(distance => {
      this.currentVNavTodDistance = distance;
    });
    vnav.on('vnavBodDistance').atFrequency(1).handle(distance => {
      this.currentVNavBodDistance = distance;
      this.checkIfVnavPathInRange();
    });
    vnav.on('vnavTargetAlt').handle(alt => {
      if (alt > 45000 || alt <= 0) {
        this.currentVNavTargetAltitude = -1;
      } else {
        this.currentVNavTargetAltitude = alt;
      }
      this.updateVNavDisplayMode();
    });
    vnav.on('vnavConstraintAltitude').whenChanged().handle(alt => {
      if (alt > 45000 || alt <= 0) {
        this.currentVNavConstraintAltitude = -1;
      } else {
        this.currentVNavConstraintAltitude = alt;
      }
      this.updateVNavDisplayMode();
    });
    vnav.on('vnavFpa').handle(fpa => {
      this.currentVNavFpa = fpa;
      this.updateVNavDisplayMode();
    });
    vnav.on('vnavMode').whenChanged().handle(state => {
      this.vnavState = state;
      this.updateVNavDisplayMode();
    });

    const fpl = this.bus.getSubscriber<FlightPlannerEvents>();
    fpl.on('fplLegChange').handle((e: FlightPlanLegEvent) => {
      if (e.planIndex === this.fms.flightPlanner.activePlanIndex) {
        this.onFplChange();
      }
    });
    fpl.on('fplIndexChanged').handle(() => this.onFplChange());
    fpl.on('fplLoaded').handle(() => this.onFplChange());

    this.dmeSourceIndex.sub((v) => {
      const dmeSource = v;
      const dmeDistance = this.navStates[dmeSource].distance;
      if (this.navStates[dmeSource].hasDme && dmeDistance !== null && dmeDistance > 0) {
        this.dmeDistanceSubject.set(dmeDistance);
      } else {
        this.dmeDistanceSubject.set(-1);
      }
    });

    this.isLnavCalculating.sub((v) => {
      if (!v) {
        this.onUpdateLnavXtk(0);
      } else {
        this.updateComponentsDisplay(this.navStates[2].source);
      }
    });
  }

  /**
   * A method to check if the VNAV Path is in a displayable range.
   */
  private checkIfVnavPathInRange(): void {
    let vnavPathInRange = false;
    if (this.currentVNavBodDistance > 0
      && this.currentSpeed > 30
      && this.navStates[2].altDeviation !== null
      && this.currentVNavTargetAltitude > 0
      && this.currentVNavConstraintAltitude > 0
      && this.currentVNavConstraintAltitude < this.currentAltitude
      && Math.abs(this.currentVNavFpa) > 0) {

      const todNM = UnitType.METER.convertTo(this.currentVNavTodDistance, UnitType.NMILE);
      const bodNM = UnitType.METER.convertTo(this.currentVNavBodDistance, UnitType.NMILE);
      if (todNM < this.currentSpeed / 60 && bodNM > 0) {
        vnavPathInRange = true;
      }
    }
    if (vnavPathInRange !== this.vnavPathInRange) {
      this.vnavPathInRange = vnavPathInRange;
      this.updateVNavDisplayMode();
    }
  }

  /**
   * A method to update the VNAV Display Mode Subject.
   */
  private updateVNavDisplayMode(): void {
    const activeSource = this.navStates[this.activeSourceIndex];
    let vnavMode = VNavDisplayMode.NONE;
    let gpMode = GPDisplayMode.NONE;
    if (this.currentVNavPathMode === VNavPathMode.PathActive) {
      vnavMode = VNavDisplayMode.PATH;
      if (activeSource.source.type === NavSourceType.Gps && activeSource.hasGlideslope && !this.missedApproachActive) {
        gpMode = GPDisplayMode.PREVIEW;
      }
    } else if (this.currentVnavApproachMode === VNavApproachGuidanceMode.GPActive) {
      vnavMode = VNavDisplayMode.NONE;
      gpMode = GPDisplayMode.ACTIVE;
    } else if (activeSource.source.type === NavSourceType.Gps) {
      const vtfActive = this.fms.approachDetails.approachIsActive && this.fms.isApproachVtf();
      if (this.vnavPathInRange && this.vnavState === VNavMode.Enabled && !vtfActive) {
        vnavMode = VNavDisplayMode.PATH;
      }
      if (activeSource.hasGlideslope && !this.missedApproachActive) {
        switch (this.activeSensitivity) {
          case NavSensitivity.VIS:
          case NavSensitivity.LNAVplusV:
          case NavSensitivity.LPplusV:
          case NavSensitivity.LPV:
          case NavSensitivity.LVNAV:
            gpMode = GPDisplayMode.ACTIVE;
            break;
          default:
            gpMode = GPDisplayMode.PREVIEW;
        }
      }
    }
    this.vnavDisplayMode.set(vnavMode);
    this.gpDisplayMode.set(gpMode);
    this.vdi?.updateSourceSensitivity();

    this.bus.pub('vnav_path_display', vnavMode === VNavDisplayMode.PATH, true);
  }

  /**
   * A method called on flight plan changes to set whether lnav has a valid plan.
   */
  private onFplChange(): void {
    const length = this.fms.flightPlanner.hasActiveFlightPlan() ? this.fms.flightPlanner.getActiveFlightPlan().length : 0;
    if (length < 2) {
      this.isLnavCalculating.set(false);
    } else {
      this.isLnavCalculating.set(true);
    }
  }

  /**
   * A method called from hsimap when the HSI format is changed.
   * @param hsiMap a bool set to true when the hsiMap should be displayed and false when the rose should be displayed.
   */
  public onFormatChange(hsiMap: boolean): void {
    switch (hsiMap) {
      case true:
        this.hsiMapActive = true;
        this.hsiRefs.hsiRose.instance.setVisible(false);
        this.hsiRefs.hsiMap.instance.setVisible(true);
        break;
      case false:
        this.hsiMapActive = false;
        this.hsiRefs.hsiMap.instance.setVisible(false);
        this.hsiRefs.hsiRose.instance.setVisible(true);
    }
    this.updateComponentsDisplay();
  }

  /**
   * A method to compare the incoming NavSourceId with the Active Nav Source.
   * @param source The current selected CDI Source.
   * @returns a bool of whether the incoming NavSourceId is the active nav source.
   */
  private checkIfActive(source: NavSourceId): boolean {
    const type = source.type;
    const index = source.index;
    if (type === this.navStates[this.activeSourceIndex].source.type && index === this.navStates[this.activeSourceIndex].source.index) {
      return true;
    } else {
      return false;
    }
  }

  /**
   * A callback called when the CDI Source Changes.
   * @param source The current selected CDI Source.
   */
  private onUpdateCdiSelect = (source: NavSourceId): void => {
    if (source.type !== this.navStates[this.activeSourceIndex].source.type
      || source.index !== this.navStates[this.activeSourceIndex].source.index) {
      switch (source.type) {
        case NavSourceType.Nav:
          if (source.index == 1) {
            this.activeSourceIndex = 0;
          } else {
            this.activeSourceIndex = 1;
          }
          if (this.navStates[this.activeSourceIndex].isLocalizer && this.navStates[this.activeSourceIndex].hasLocalizer) {
            this.slewObs();
          }
          break;
        case NavSourceType.Gps:
          this.activeSourceIndex = 2;
          break;
      }
      this.updateSensitivity();
      this.updateVNavDisplayMode();
    }
  }

  /**
   * A callback called to update the nav sensitivity.
   * @param updatedSource is the source that was updated
   */
  private updateSensitivity(updatedSource: NavSourceId | undefined = undefined): void {
    const update = updatedSource === undefined ? true : this.checkIfActive(updatedSource);
    if (update) {
      switch (this.navStates[this.activeSourceIndex].source.type) {
        case NavSourceType.Nav:
          if (this.navStates[this.activeSourceIndex].isLocalizer) {
            this.activeSensitivity = NavSensitivity.ILS;
          } else {
            this.activeSensitivity = NavSensitivity.VOR;
          }
          break;
        case NavSourceType.Gps:
          this.setGpsSensitivity();
          break;
      }
      this.updateComponentsDisplay();
    }
  }

  /**
   * Sets the GPS nav sentitivity value.
   */
  private setGpsSensitivity(): void {
    const nav = this.navStates[this.activeSourceIndex];
    let missedApproachActive = false;
    switch (nav.deviationScaleLabel) {
      case CDIScaleLabel.Departure:
        this.activeSensitivity = NavSensitivity.DPRT;
        break;
      case CDIScaleLabel.Terminal:
        this.activeSensitivity = NavSensitivity.TERM;
        break;
      case CDIScaleLabel.LNav:
        this.activeSensitivity = NavSensitivity.LNAV;
        break;
      case CDIScaleLabel.LNavPlusV:
        this.activeSensitivity = NavSensitivity.LNAVplusV;
        break;
      case CDIScaleLabel.LNavVNav:
        this.activeSensitivity = NavSensitivity.LVNAV;
        break;
      case CDIScaleLabel.LP:
        this.activeSensitivity = NavSensitivity.LP;
        break;
      case CDIScaleLabel.LPPlusV:
        this.activeSensitivity = NavSensitivity.LPplusV;
        break;
      case CDIScaleLabel.LPV:
        this.activeSensitivity = NavSensitivity.LPV;
        break;
      case CDIScaleLabel.Visual:
        this.activeSensitivity = NavSensitivity.VIS;
        break;
      case CDIScaleLabel.MissedApproach:
        this.activeSensitivity = NavSensitivity.MAPR;
        missedApproachActive = true;
        break;
      default:
        this.activeSensitivity = NavSensitivity.ENR;
    }
    if (missedApproachActive !== this.missedApproachActive) {
      this.missedApproachActive = missedApproachActive;
    }
  }

  /**
   * A callback called when the obs updates from the event bus.
   * @param obs The current obs/dtk value.
   */
  private onUpdateDtk = (obs: ObsSetting): void => {
    if (obs.source.type === NavSourceType.Nav) {
      switch (obs.source.index) {
        case 1:
          this.navStates[0].dtk_obs = obs.heading;
          break;
        case 2:
          this.navStates[1].dtk_obs = obs.heading;
          break;
      }
      this.updateComponentsData(obs.source);
    }
  }

  /**
   * A callback called when the lnav dtk updates from the event bus.
   * @param dtk The current lnav dtk value.
   */
  private onUpdateLnavDtk = (dtk: number): void => {
    if (!this.isLnavCalculating.get()) {
      this.navStates[2].dtk_obs = this.currentHeading;
    } else if (dtk !== this.navStates[2].dtk_obs) {
      this.navStates[2].dtk_obs = dtk;
    }
    if (this.activeSourceIndex == 2) {
      this.setLnavToFrom();
      this.updateComponentsData(this.navStates[2].source);
    }
  }

  /**
   * A callback called when the lnav xtk updates from the event bus.
   * @param xtk The current lnav xtk value.
   */
  private onUpdateLnavXtk = (xtk: number): void => {
    // Check for both a full or direct to flight plan.
    if (!this.isLnavCalculating.get()) {
      if (this.navStates[2].toFrom !== VorToFrom.OFF) {
        this.navStates[2].toFrom = VorToFrom.OFF;
        this.updateComponentsDisplay(this.navStates[2].source);
      }
    } else if (this.navStates[2].deviation === null || -xtk !== (this.navStates[2].deviation * this.navStates[2].deviationScale)) {
      this.navStates[2].deviation = (-xtk / this.navStates[2].deviationScale);
      if (this.navStates[2].toFrom === VorToFrom.OFF) {
        this.setLnavToFrom();
        this.updateComponentsDisplay(this.navStates[2].source);
      }
    }
    if (this.activeSourceIndex == 2) {
      this.updateComponentsData();
    }
  }

  /**
   * A callback called when the bearing to an lnav fix updates across the event bus to set the to/from flag for GPS.
   * @param brg The current bearing to the current fix.
   */
  private onUpdateLnavBrg = (brg: number): void => {
    this.navStates[2].bearing = brg;
    this.setLnavToFrom() && this.updateComponentsDisplay(this.navStates[2].source);
  }

  /**
   * A method called when the bearing or dtk to/from an lnav fix updates to set the to/from flag for GPS.
   * @returns Whether the toFrom value has changed.
   */
  private setLnavToFrom(): boolean {
    if (this.isLnavCalculating.get()) {
      let toFrom = VorToFrom.TO;
      const dtk = this.navStates[2].dtk_obs;
      const bearing = this.navStates[2].bearing;
      if (bearing !== null && dtk !== null) {
        if (Math.abs(NavMath.diffAngle(bearing, dtk)) > 120) {
          toFrom = VorToFrom.FROM;
        }
      }
      if (toFrom !== this.navStates[2].toFrom) {
        this.navStates[2].toFrom = toFrom;
        return true;
      }
    }
    return false;
  }

  /**
   * A callback called when the cdi deviation updates from the event bus.
   * @param deviation The current deviation value.
   */
  private onUpdateCdiDeviation = (deviation: CdiDeviation): void => {
    if (deviation.source.type !== NavSourceType.Nav) { return; }
    switch (deviation.source.index) {
      case this.navStates[0].source.index:
        this.navStates[0].deviation = deviation.deviation !== null ? deviation.deviation / 127 : -100;
        break;
      case this.navStates[1].source.index:
        this.navStates[1].deviation = deviation.deviation !== null ? deviation.deviation / 127 : -100;
        break;
    }
    this.updateComponentsData(deviation.source);
  }

  /**
   * A callback called when the vor to/from updates from the event bus.
   * @param toFrom The current to/from value.
   */
  private onUpdateToFrom = (toFrom: VorToFromSetting): void => {
    if (toFrom.source.type !== NavSourceType.Nav) { return; }
    switch (toFrom.source.index) {
      case this.navStates[0].source.index:
        this.navStates[0].toFrom = toFrom.toFrom;
        break;
      case this.navStates[1].source.index:
        this.navStates[1].toFrom = toFrom.toFrom;
        break;
    }
    this.updateComponentsDisplay(toFrom.source);
  }

  /**
   * A callback called when the dme updates from the event bus.
   * @param dme The current deviation value.
   */
  private onUpdateDme = (dme: DmeState): void => {
    if (dme.source.type !== NavSourceType.Nav) { return; }
    switch (dme.source.index) {
      case this.navStates[0].source.index:
        this.navStates[0].hasDme = dme.hasDme;
        this.navStates[0].distance = dme.dmeDistance;
        break;
      case this.navStates[1].source.index:
        this.navStates[1].hasDme = dme.hasDme;
        this.navStates[1].distance = dme.dmeDistance;
        break;
    }
    const dmeSource = this.dmeSourceIndex.get();
    const dmeDistance = this.navStates[dmeSource].distance;
    if (this.navStates[dmeSource].hasDme && dmeDistance !== null && dmeDistance > 0) {
      this.dmeDistanceSubject.set(dmeDistance);
    } else {
      this.dmeDistanceSubject.set(-1);
    }
  }

  /**
   * A callback called when the localizer data updates from the event bus.
   * @param localizer The current localizer data.
   */
  private onUpdateLocalizer = (localizer: Localizer): void => {
    if (localizer.source.type !== NavSourceType.Nav) { return; }
    switch (localizer.source.index) {
      case this.navStates[0].source.index:
        this.navStates[0].hasLocalizer = localizer.isValid;
        if (localizer.isValid) {
          this.navStates[0].localizerCourse = localizer.course;
        }
        break;
      case this.navStates[1].source.index:
        this.navStates[1].hasLocalizer = localizer.isValid;
        if (localizer.isValid) {
          this.navStates[1].localizerCourse = localizer.course;
        }
        break;
    }
    this.slewObs();
    this.updateSensitivity(localizer.source);
    this.updateVNavDisplayMode();
  }

  /**
   * A callback called when the glideslope data updates from the event bus.
   * @param glideslope The current glideslope data.
   */
  private onUpdateGlideslope = (glideslope: Glideslope): void => {
    if (glideslope.source.type !== NavSourceType.Nav) { return; }
    switch (glideslope.source.index) {
      case this.navStates[0].source.index:
        if (glideslope.isValid == this.navStates[0].hasGlideslope && glideslope.isValid) {
          this.navStates[0].gsDeviation = glideslope.deviation;
          this.vdi?.updateDeviation();
          return;
        } else {
          this.navStates[0].hasGlideslope = glideslope.isValid;
          if (glideslope.isValid) {
            this.navStates[0].gsDeviation = glideslope.deviation;
          }
        }
        break;
      case this.navStates[1].source.index:
        if (glideslope.isValid == this.navStates[1].hasGlideslope && glideslope.isValid) {
          this.navStates[1].gsDeviation = glideslope.deviation;
          this.vdi?.updateDeviation();
          return;
        } else {
          this.navStates[1].hasGlideslope = glideslope.isValid;
          if (glideslope.isValid) {
            this.navStates[1].gsDeviation = glideslope.deviation;
          }
        }
        break;
    }
  }

  /**
   * A callback called when the LPV data is updated.
   * @param deviation The LPV vertical deviation.
   * @param distance The LPV lateral distance.
   */
  private onUpdateLpv(deviation: number, distance: number): void {
    this.currentLpvDeviation = deviation;
    const hasGlideslope = this.navStates[2].hasGlideslope;

    if (distance !== this.currentLpvDistance) {
      this.currentLpvDistance = distance;
      const approachType = this.fms.approachDetails.approachType;

      if (this.fms.approachDetails.approachIsActive && !this.fms.approachDetails.approachIsCircling && Math.abs(distance) < 30000 &&
        (approachType === ApproachType.APPROACH_TYPE_GPS || approachType === ApproachType.APPROACH_TYPE_RNAV || approachType === AdditionalApproachType.APPROACH_TYPE_VISUAL)) {
        if (!hasGlideslope) {
          this.navStates[2].hasGlideslope = true;
          this.updateVNavDisplayMode();
        }
      } else if (hasGlideslope) {
        this.navStates[2].hasGlideslope = false;
        this.updateVNavDisplayMode();
      }
    } else if (distance <= 0 && hasGlideslope) {
      this.navStates[2].hasGlideslope = false;
      this.updateVNavDisplayMode();
    }

    if (isFinite(deviation) && isFinite(distance) && this.navStates[2].hasGlideslope) {
      const scale = Math.tan(UnitType.DEGREE.convertTo(2.0, UnitType.RADIAN)) * distance;
      const scaleClamped = NavMath.clamp(scale, 200, 1000) * -1;

      this.navStates[2].gsDeviation = deviation / scaleClamped;
      this.vdi?.updateDeviation();
    }
  }

  /**
   * A callback called when the VNAV data is updated.
   * @param deviation The vnav vertical deviation.
   */
  private onUpdateVnav(deviation: number): void {
    this.navStates[2].altDeviation = deviation / -750;
    this.vdi?.updateDeviation();
  }

  /**
   * A callback called when isLoc value updates from the event bus.
   * @param isLoc The current isLoc value.
   */
  private onUpdateIsLocFreq = (isLoc: LocalizerFrequency): void => {
    if (isLoc.source.type !== NavSourceType.Nav) { return; }
    switch (isLoc.source.index) {
      case this.navStates[0].source.index:
        this.navStates[0].isLocalizer = isLoc.isLocalizer;
        break;
      case this.navStates[1].source.index:
        this.navStates[1].isLocalizer = isLoc.isLocalizer;
        break;
    }
    this.updateComponentsDisplay(isLoc.source);
  }

  /**
   * A callback called to slew the obs to the ILS inbound course when an loc becomes valid.
   */
  private slewObs(): void {
    const course = this.navStates[this.activeSourceIndex].localizerCourse;
    if (this.activeSourceIndex < 2 && this.navStates[this.activeSourceIndex].isLocalizer &&
      this.navStates[this.activeSourceIndex].hasLocalizer && course !== null) {
      SimVar.SetSimVarValue(`K:VOR${this.activeSourceIndex + 1}_SET`, 'number', Math.round(course));
    }
  }

  /**
   * A method called when xtk/dtk data updates.
   * @param updatedSource is the source that was updated
   */
  private updateComponentsData(updatedSource: NavSourceId | undefined = undefined): void {
    const update = updatedSource === undefined ? true : this.checkIfActive(updatedSource);
    if (update || this.firstRun) {
      if (this.onUpdateDtkBox !== undefined) {
        this.onUpdateDtkBox();
      }
      if (this.hsiMapActive) {
        this.courseNeedleRefs.hsiMap.instance.updateData();
        this.hsiMapDeviationRef.instance.updateData();
      } else {
        this.courseNeedleRefs.hsiRose.instance.updateData();
      }
      if (this.firstRun) {
        this.firstRun = false;
      }
    }
  }

  /**
   * A method called when any value updates that needs to trigger a component update.
   * @param updatedSource is the source that was updated
   */
  private updateComponentsDisplay(updatedSource: NavSourceId | undefined = undefined): void {
    const update = updatedSource === undefined ? true : this.checkIfActive(updatedSource);
    if (update || this.firstRun) {
      if (this.hsiMapActive) {
        this.courseNeedleRefs.hsiMap.instance.updateSourceSensitivity();
        this.hsiMapDeviationRef.instance.updateSourceSensitivity();
      } else {
        this.courseNeedleRefs.hsiRose.instance.updateSourceSensitivity();
        this.hsiRefs.hsiRose.instance.updateSourceSensitivity();
      }
      this.updateComponentsData(updatedSource);
    }
  }

  /**
   * Utility function to update a given bearing pointer in both the rose and map.
   * @param index The index of the bearing pointer to update.
   * @param func A function to execute on the pointer instances.
   */
  private updateBearingPointers(index: number, func: (element: NodeReference<HTMLDivElement> | null) => void): void {
    const elements: NodeReference<HTMLDivElement> | null[] = [
      index === 0 ? this.hsiRefs.hsiRose.instance.bearingPointer1Element :
        index === 1 ? this.hsiRefs.hsiRose.instance.bearingPointer2Element : null,
      index === 0 ? this.hsiRefs.hsiMap.instance.bearingPointer1Element :
        index === 1 ? this.hsiRefs.hsiMap.instance.bearingPointer2Element : null
    ];

    for (const element of elements) {
      func(element);
    }
  }

  /**
   * Update the source of a bearing pointer.
   * @param data The new bearing source info.
   */
  private updateBearingSrc = (data: BearingSource): void => {
    if (data.source?.type === undefined) {
      this.bearingPointerStatus[data.index] = false;
      this.bearingPointerAdf[data.index] = false;
    } else if (data.source.type === NavSourceType.Adf) {
      this.bearingPointerStatus[data.index] = true;
      this.bearingPointerAdf[data.index] = true;
    } else {
      this.bearingPointerStatus[data.index] = true;
      this.bearingPointerAdf[data.index] = false;
    }
    if (this.bearingPointerDirection[data.index] !== null) {
      this.updateBearingDir({ index: data.index, direction: this.bearingPointerDirection[data.index] });
    }
    if (this.bearingPointerStatus[0] == true || this.bearingPointerStatus[1] == true) {
      this.hsiRefs.hsiRose.instance.compassRoseComponent.instance.setCircleVisible(true);
    } else {
      this.hsiRefs.hsiRose.instance.compassRoseComponent.instance.setCircleVisible(false);
    }
    this.updateBearingPointers(data.index, (element: NodeReference<HTMLDivElement> | null): void => {
      if (element !== null && element.instance !== null && data.source) {
        const source = data.source;
        if (source.type !== NavSourceType.Nav && source.type !== NavSourceType.Gps && source.type !== NavSourceType.Adf) {
          element.instance.style.display = 'none';
          this.bearingPointerStatus[data.index] = false;
        } else if (source.type == NavSourceType.Nav && this.navStates[source.index - 1].isLocalizer) {
          element.instance.style.display = 'none';
        } else {
          element.instance.style.display = '';
        }
      }
    });
  }

  /**
   * Update the validity of a bearing source.
   * @param data The validity event.
   */
  private updateBearingValidity = (data: BearingValidity): void => {
    this.updateBearingPointers(data.index, (element: NodeReference<HTMLDivElement> | null): void => {
      if (element !== null && element.instance !== null) {
        if (data.valid) {
          element.instance.style.display = '';
        } else {
          element.instance.style.display = 'none';
        }
      }
    });
  }

  /**
   * Update the heading of a bearing pointer.
   * @param data The BearingDirection message.
   */
  private updateBearingDir = (data: BearingDirection): void => {
    let direction = data.direction;
    this.bearingPointerDirection[data.index] = direction;
    if (this.bearingPointerAdf[data.index] && data.direction !== null) {
      direction = NavMath.normalizeHeading(data.direction + this.currentHeading);
    }
    this.updateBearingPointers(data.index, (element: NodeReference<HTMLDivElement> | null): void => {
      if (element !== null && element.instance !== null && direction !== null) {
        const newDirection = Math.round(direction * 100) / 100;
        element.instance.style.transform = `rotate3d(0, 0, 1, ${newDirection}deg)`;
      } else if (element !== null && element.instance !== null && direction == null) {
        element.instance.style.display = 'none';
      }
    });
  }

  // /**
  //  * Sets the approach details when an approach_details_set event is received from the bus.
  //  * @param approachDetails The approachDetails received from the bus.
  //  */
  // private onApproachDetailsSet = (approachDetails: ApproachDetails): void => {

  //   const approachDetails: ApproachDetails = {
  //     approachLoaded: approachLoaded !== undefined ? approachLoaded : this.approachDetails.approachLoaded,
  //     approachType: approachType !== undefined ? approachType : this.approachDetails.approachType,
  //     approachRnavType: approachRnavType !== undefined ? approachRnavType : this.approachDetails.approachRnavType,
  //     approachIsActive: approachIsActive !== undefined ? approachIsActive : this.approachDetails.approachIsActive
  //   };
  // }
}