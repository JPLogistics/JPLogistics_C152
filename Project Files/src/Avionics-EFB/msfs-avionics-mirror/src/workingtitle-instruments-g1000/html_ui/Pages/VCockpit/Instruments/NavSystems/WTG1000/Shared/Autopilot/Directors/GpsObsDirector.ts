/// <reference types="msfstypes/JS/simvar" />

import { GeoCircle, GeoPoint, NavMath, Subject, UnitType, LinearServo } from 'msfssdk';
import { EventBus, HEvent, SimVarValueType } from 'msfssdk/data';
import { GNSSEvents } from 'msfssdk/instruments';
import { DirectorState } from 'msfssdk/autopilot';
import { LegDefinition } from 'msfssdk/flightplan';

import { AircraftState } from './LNavDirector';
import { LNavVars } from '../LNavSimVars';
import { NavEventsExtentions } from '../../Navigation/APRadioNavInstrument';



/**
 * A director that handles OBS Lateral Navigation.
 */
export class GpsObsDirector {

  public state: DirectorState;

  /** A callback called when the OBS director deactivates. */
  public onDeactivate?: () => void;

  public obsSetting = 0;
  public obsActive = false;
  private xtk: number | undefined = undefined;
  private magvar = 0;

  public obsLeg = Subject.create<LegDefinition | undefined>(undefined);

  private readonly geoPointCache = [new GeoPoint(0, 0)];
  private readonly geoCircleCache = [new GeoCircle(new Float64Array(3), 0)];

  private currentBankRef = 0;
  private readonly bankServo = new LinearServo(10);

  /**
   * Creates an instance of the GPS OBS Director.
   * @param bus The event bus to use with this instance.
   * @param aircraftState Is the current aircraft state.
   */
  constructor(private readonly bus: EventBus, private readonly aircraftState: AircraftState) {

    const hEvent = bus.getSubscriber<HEvent>();

    hEvent.on('hEvent').handle((e: string) => {
      if (e === 'AS1000_PFD_CRS_INC' || e === 'AS1000_MFD_CRS_INC') {
        this.incrementObs(true);
      } else if (e === 'AS1000_PFD_CRS_DEC' || e === 'AS1000_MFD_CRS_DEC') {
        this.incrementObs(false);
      }
    });

    const nav = this.bus.getSubscriber<NavEventsExtentions>();
    nav.on('gps_obs_active').whenChanged().handle((state) => {
      this.obsActive = state;
      if (this.obsActive) {
        const dtk = this.obsLeg.get()?.calculated?.initialDtk;
        if (dtk !== undefined) {
          this.obsSetting = dtk;
        } else if (this.obsSetting < 0 || this.obsSetting > 360) {
          this.obsSetting = 0;
        }
        SimVar.SetSimVarValue('K:GPS_OBS_SET', SimVarValueType.Degree, this.obsSetting);
      }
      if (!this.obsActive) {
        this.deactivate();
      }
    });
    nav.on('gps_obs_value').whenChanged().handle((value) => {
      this.obsSetting = value;
    });

    const gnss = this.bus.getSubscriber<GNSSEvents>();
    gnss.on('magvar').whenChanged().handle((v) => {
      this.magvar = v;
    });

    this.state = DirectorState.Inactive;
  }

  /**
   * Activates the LNAV director.
   */
  public activate(): void {
    this.state = DirectorState.Active;
  }

  /**
   * Arms the LNAV director.
   */
  public arm(): void {
    this.state = DirectorState.Armed;
  }

  /**
   * Deactivates the LNAV director.
   */
  public deactivate(): void {
    if (this.onDeactivate !== undefined) {
      this.onDeactivate();
    }
    this.state = DirectorState.Inactive;
  }

  /**
   * Increments or Decrements the OBS Setting for GPS if in GPS OBS MODE.
   * @param increment is whether to increment (or decrement) the value.
   */
  private incrementObs(increment: boolean): void {
    if (this.obsActive) {
      if (increment) {
        SimVar.SetSimVarValue('K:GPS_OBS_INC', SimVarValueType.Number, 0);
      } else {
        SimVar.SetSimVarValue('K:GPS_OBS_DEC', SimVarValueType.Number, 0);
      }
    }
  }

  /**
   * Updates the lateral director.
   */
  public update(): void {
    if (this.obsActive) {
      if (this.obsSetting >= 0 && this.obsSetting <= 360) {
        SimVar.SetSimVarValue(LNavVars.DTK, 'degrees', Math.floor(this.obsSetting));
      }
      this.getObsXtk();
      if (this.xtk !== undefined) {
        SimVar.SetSimVarValue(LNavVars.XTK, 'nautical miles', this.xtk);
      }
    }
    if (this.state === DirectorState.Active) {
      this.navigateFlightPath();
    }
  }

  /**
   * Gets the current obs xtk.
   */
  private getObsXtk(): void {
    const leg = this.obsLeg.get();
    if (leg?.calculated?.endLat !== undefined && leg?.calculated?.endLon !== undefined) {
      const start = this.geoPointCache[0].set(leg.calculated.endLat, leg.calculated.endLon);
      const obsTrue = NavMath.normalizeHeading(this.obsSetting + this.magvar);
      const path = this.geoCircleCache[0].setAsGreatCircle(start, obsTrue);
      this.xtk = UnitType.GA_RADIAN.convertTo(path.distance(this.aircraftState.planePos), UnitType.NMILE);
    } else {
      this.xtk = undefined;
    }
  }

  /**
   * Navigates the provided leg flight path.
   */
  private navigateFlightPath(): void {
    if (this.xtk === undefined) {
      this.deactivate();
      return;
    }

    const absInterceptAngle = Math.min(Math.pow(Math.abs(this.xtk) * 20, 1.35) + (Math.abs(this.xtk) * 50), 45);
    const interceptAngle = this.xtk < 0 ? absInterceptAngle : -1 * absInterceptAngle;
    const obsTrue = NavMath.normalizeHeading(this.obsSetting + this.magvar);

    const bankAngle = this.desiredBank(NavMath.normalizeHeading(obsTrue + interceptAngle), this.xtk);

    if (this.state === DirectorState.Active) {
      this.setBank(bankAngle);
    }
  }

  /**
   * Tries to activate when armed.
   * @returns whether OBS can activate
   */
  public canActivate(): boolean {
    if (this.xtk !== undefined && Math.abs(this.xtk) < 1) {
      return true;
    }
    return false;
  }

  /**
   * Gets a desired bank from a desired track.
   * @param desiredTrack The desired track.
   * @param xtk The cross track.
   * @returns The desired bank angle.
   */
  private desiredBank(desiredTrack: number, xtk: number): number {
    const turnDirection = NavMath.getTurnDirection(this.aircraftState.track, desiredTrack);
    const headingDiff = Math.abs(NavMath.diffAngle(this.aircraftState.track, desiredTrack));

    let baseBank = Math.min(1.25 * headingDiff, 25);
    if (baseBank <= 2.5) {
      baseBank = NavMath.clamp(xtk * 100, -2.5, 2.5);
    } else {
      baseBank *= (turnDirection === 'left' ? 1 : -1);
    }

    return baseBank;
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
}