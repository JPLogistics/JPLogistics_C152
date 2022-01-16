/// <reference types="msfstypes/JS/simvar" />

import { GeoPoint, MathUtils, NavMath, Units, UnitType, LinearServo, Subject } from 'msfssdk';
import { EventBus } from 'msfssdk/data';
import { ADCEvents, CdiDeviation, GNSSEvents, Localizer, NavSourceId, NavSourceType, ObsSetting } from 'msfssdk/instruments';
import { PlaneDirector, DirectorState, APValues, APLateralModes } from 'msfssdk/autopilot';

import { NavEventsExtentions } from '../../Navigation/APRadioNavInstrument';

/**
 * A Nav/Loc autopilot director.
 */
export class APNavDirector implements PlaneDirector {

  public state: DirectorState;

  /** A callback called when the director activates. */
  public onActivate?: () => void;

  /** A callback called when the director arms. */
  public onArm?: () => void;

  /** A callback called when the director deactivates. */
  public onDeactivate?: () => void;

  private readonly bankServo = new LinearServo(10);
  private currentBankRef = 0;
  private currentHeading = 0;
  private currentTrack = 0;
  private navSource?: NavSourceId;
  private cdi?: CdiDeviation;
  private obs?: ObsSetting;
  private loc?: Localizer;

  private geoPointCache = [new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0), new GeoPoint(0, 0)];
  private ppos = new GeoPoint(0, 0);
  private navLocation = new GeoPoint(NaN, NaN);

  private isApproachMode = Subject.create<boolean>(false);

  /**
   * Creates an instance of the LateralDirector.
   * @param bus The event bus to use with this instance.
   * @param apValues Is the apValues object.
   * @param mode is the APLateralMode for this instance of the director.
   */
  constructor(private readonly bus: EventBus, private readonly apValues: APValues, private readonly mode: APLateralModes) {
    this.state = DirectorState.Inactive;
    this.monitorEvents();
  }


  /**
   * Activates this director.
   */
  public activate(): void {
    if (this.onActivate !== undefined) {
      this.onActivate();
    }
    SimVar.SetSimVarValue('AUTOPILOT NAV1 LOCK', 'Bool', true);
    this.state = DirectorState.Active;
  }

  /**
   * Arms this director.
   */
  public arm(): void {
    if (this.state === DirectorState.Inactive && this.canArm()) {
      this.state = DirectorState.Armed;
      if (this.onArm !== undefined) {
        this.onArm();
      }
      SimVar.SetSimVarValue('AUTOPILOT NAV1 LOCK', 'Bool', true);
    }
  }

  /**
   * Deactivates this director.
   */
  public deactivate(): void {
    this.state = DirectorState.Inactive;
    SimVar.SetSimVarValue('AUTOPILOT NAV1 LOCK', 'Bool', false);
  }

  /**
   * Updates this director.
   */
  public update(): void {
    if (!this.canArm()) {
      this.deactivate();
    }
    if (this.state === DirectorState.Armed) {
      if (this.canActivate()) {
        this.activate();
      }
    }
    if (this.state === DirectorState.Active) {
      this.setBank(this.desiredBank());
    }
  }

  /**
   * Method to check whether the director can arm.
   * @returns Whether or not this director can arm.
   */
  private canArm(): boolean {
    const typeIsCorrect = this.navSource?.type === NavSourceType.Nav;
    const index = this.navSource?.index;
    if (this.mode === APLateralModes.LOC && typeIsCorrect) {
      const indexIsCorrect = index == this.cdi?.source.index && this.loc?.isValid && index == this.loc?.source.index;
      if (indexIsCorrect) {
        this.isApproachMode.set(true);
        return true;
      }
    }
    if (this.mode === APLateralModes.VOR && typeIsCorrect) {
      const indexIsCorrect = index == this.cdi?.source.index && !this.loc?.isValid && index == this.obs?.source.index;
      if (indexIsCorrect) {
        this.isApproachMode.set(false);
        return true;
      }
    }
    if (this.mode === APLateralModes.LOC && this.apValues.navToNavLocArm) {
      this.isApproachMode.set(true);
      return true;
    }
    this.isApproachMode.set(false);
    return false;
  }


  /**
   * Method to check whether the director can activate.
   * @returns Whether or not this director can activate.
   */
  private canActivate(): boolean {
    const typeIsCorrect = this.navSource?.type === NavSourceType.Nav;
    const index = this.navSource?.index;
    const indexIsCorrect = index == this.cdi?.source.index
      && ((this.loc?.isValid && index == this.loc?.source.index) || (!this.loc?.isValid && index == this.obs?.source.index));
    if (typeIsCorrect && indexIsCorrect && this.cdi !== undefined && this.cdi.deviation !== null && Math.abs(this.cdi.deviation) < 127 && (this.obs?.heading || this.loc?.course)) {
      const dtk = this.loc && this.loc.isValid && this.loc.course ? Units.Radians.toDegrees(this.loc.course) : this.obs?.heading;
      if (dtk === null || dtk === undefined) {
        return false;
      }
      const headingDiff = NavMath.diffAngle(this.currentHeading, dtk);
      const isLoc = this.loc?.isValid ?? false;
      const sensitivity = isLoc ? 1 : .6;
      if (Math.abs(this.cdi.deviation * sensitivity) < 127 && Math.abs(headingDiff) < 110) {
        return true;
      }
    }
    return false;
  }

  /**
   * Gets a desired bank from the nav input data.
   * @returns The desired bank angle.
   */
  private desiredBank(): number {
    const isLoc = this.loc?.isValid ?? false;
    const hasValidDeviation = this.cdi !== undefined && this.cdi.deviation !== null && Math.abs(this.cdi.deviation) < 127;
    const hasValidObs = this.obs !== undefined && this.obs.heading !== null;
    let zoneOfConfusion = false;

    if (isLoc && !hasValidDeviation) {
      this.deactivate();
      return NaN;
    }
    if (!isLoc && (!hasValidDeviation || !hasValidObs)) {
      if (!this.checkForZoneOfConfusion()) {
        this.deactivate();
        return NaN;
      } else {
        zoneOfConfusion = true;
      }
    }
    if (zoneOfConfusion || (this.cdi && this.cdi.deviation !== null)) {
      const xtk = zoneOfConfusion ? 0 : (this.cdi && this.cdi.deviation !== null) ? this.getXtk(this.cdi.deviation, isLoc) : 0;
      const dtk = isLoc && this.loc?.course !== undefined ? Units.Radians.toDegrees(this.loc.course) : this.obs?.heading;
      if (dtk === null || dtk === undefined) {
        this.deactivate();
        return NaN;
      }
      const absInterceptAngle = Math.min(Math.pow(Math.abs(xtk) * 20, 1.35) + (Math.abs(xtk) * 50), isLoc ? 20 : 40);

      const interceptAngle = xtk > 0 ? absInterceptAngle : -1 * absInterceptAngle;

      const desiredTrack = NavMath.normalizeHeading(dtk + interceptAngle);

      const turnDirection = NavMath.getTurnDirection(this.currentTrack, desiredTrack);
      const headingDiff = Math.abs(NavMath.diffAngle(this.currentTrack, desiredTrack));

      let baseBank = Math.min(1.25 * headingDiff, 25);
      if (baseBank <= 2.5) {
        baseBank = NavMath.clamp(xtk * -100, -2.5, 2.5);
      } else {
        baseBank *= (turnDirection === 'left' ? 1 : -1);
      }

      return baseBank;
    }
    this.deactivate();
    return NaN;
  }

  /**
   * Gets a xtk value from the nav input data.
   * @param deviation is the input deviation value
   * @param isLoc is whether this is a LOC signal.
   * @returns The xtk value.
   */
  private getXtk(deviation: number, isLoc: boolean): number {
    const scale = isLoc ? 1 : 2;
    const factor = isLoc ? .35 : 1;
    return MathUtils.clamp(this.getNavDistance() * Math.sin(UnitType.DEGREE.convertTo(12, UnitType.RADIAN) * ((factor * deviation) / 127)), -scale, scale);
  }

  /**
   * Gets the lateral distance from PPOS to the nav signal.
   * @returns The distance value in nautical miles.
   */
  private getNavDistance(): number {
    let navDistance = 5;
    if (!isNaN(this.navLocation.lat)) {
      const navPosition = this.geoPointCache[0];
      navPosition.set(this.navLocation);

      const planePosGP = this.geoPointCache[1];
      planePosGP.set(this.ppos);

      navDistance = UnitType.GA_RADIAN.convertTo(planePosGP.distance(navPosition), UnitType.NMILE);
    }
    return Math.abs(navDistance);
  }

  /**
   * Sets the desired AP bank angle.
   * @param bankAngle The desired AP bank angle.
   */
  private setBank(bankAngle: number): void {
    if (isFinite(bankAngle)) {
      this.currentBankRef = this.bankServo.drive(this.currentBankRef, bankAngle);
      SimVar.SetSimVarValue('AUTOPILOT BANK HOLD REF', 'degrees', this.currentBankRef);
    }
  }

  /**
   * Checks if we might be getting a wild deviation because of the zone of confusion and allows APNavDirector some time to resolve.
   * @returns Whether we might be in the zone of confusion.
   */
  private checkForZoneOfConfusion(): boolean {
    if (this.getNavDistance() < 2 && this.cdi !== undefined && this.cdi.deviation !== null) {
      return true;
    }
    return false;
  }

  /**
   * Method to monitor nav events to keep track of NAV related data needed for guidance.
   */
  private monitorEvents(): void {
    const nav = this.bus.getSubscriber<NavEventsExtentions>();
    nav.on('cdi_deviation').handle(cdi => this.cdi = cdi);
    nav.on('obs_setting').handle(obs => this.obs = obs);
    nav.on('localizer').handle(loc => this.loc = loc);
    nav.on('cdi_select').handle((source) => {
      this.navSource = source;
      if (this.state === DirectorState.Active) {
        this.deactivate();
      }
    });
    nav.on('navLocation').handle((loc) => {
      this.navLocation.set(loc.lat, loc.long);
    });

    this.bus.getSubscriber<ADCEvents>().on('hdg_deg')
      .withPrecision(0)
      .handle((h) => {
        this.currentHeading = h;
      });

    const gnss = this.bus.getSubscriber<GNSSEvents>();
    gnss.on('gps-position').atFrequency(1).handle((lla) => {
      this.ppos.set(lla.lat, lla.long);
    });
    gnss.on('track_deg_magnetic').withPrecision(0).handle((t) => {
      this.currentTrack = t;
    });
  }
}