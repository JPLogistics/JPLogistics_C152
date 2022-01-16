import { EventBus } from 'msfssdk/data';
import { FlightPlanner } from 'msfssdk/flightplan';
import { APConfig, APLateralModes, APValues, APVerticalModes } from 'msfssdk/autopilot';
import { LNavDirector } from './Directors/LNavDirector';
import { VNavDirector } from './Directors/VNavDirector';
import { VNavPathCalculator } from './VNavPathCalculator';
import { APAltCapDirector } from './Directors/APAltCapDirector';
import { APAltDirector } from './Directors/APAltDirector';
import { APFLCDirector } from './Directors/APFLCDirector';
import { APHdgDirector } from './Directors/APHdgDirector';
import { APPitchDirector } from './Directors/APPitchDirector';
import { APRollDirector } from './Directors/APRollDirector';
import { APVSDirector } from './Directors/APVSDirector';
import { APNavDirector } from './Directors/APNavDirector';
import { APGPDirector } from './Directors/APGPDirector';
import { APGSDirector } from './Directors/APGSDirector';
import { G1000NavToNavManager } from './G1000NavToNavManager';
import { APLvlDirector } from './Directors/APLvlDirector';

/**
 * A G1000 NXi autopilot configuration.
 */
export class G1000APConfig implements APConfig {
  public defaultLateralMode = APLateralModes.ROLL;
  public defaultVerticalMode = APVerticalModes.PITCH;

  /**
   * Instantiates the AP Config for the Autopilot.
   * @param bus is an instance of the Event Bus.
   * @param flightPlanner is an instance of the flight planner.
   */
  constructor(private readonly bus: EventBus, private readonly flightPlanner: FlightPlanner) {
  }

  /** @inheritdoc */
  public createHeadingDirector(apValues: APValues): APHdgDirector {
    return new APHdgDirector(this.bus, apValues);
  }

  /** @inheritdoc */
  public createRollDirector(): APRollDirector {
    return new APRollDirector(this.bus);
  }

  /** @inheritdoc */
  public createWingLevelerDirector(): APLvlDirector {
    return new APLvlDirector(this.bus);
  }

  /** @inheritdoc */
  public createGpssDirector(): LNavDirector {
    return new LNavDirector(this.bus, this.flightPlanner);
  }

  /** @inheritdoc */
  public createVorDirector(apValues: APValues): APNavDirector {
    return new APNavDirector(this.bus, apValues, APLateralModes.VOR);
  }

  /** @inheritdoc */
  public createLocDirector(apValues: APValues): APNavDirector {
    return new APNavDirector(this.bus, apValues, APLateralModes.LOC);
  }

  /** @inheritdoc */
  public createBcDirector(): undefined {
    return undefined;
  }

  /** @inheritdoc */
  public createPitchDirector(apValues: APValues): APPitchDirector {
    return new APPitchDirector(this.bus, apValues);
  }

  /** @inheritdoc */
  public createVsDirector(apValues: APValues): APVSDirector {
    return new APVSDirector(this.bus, apValues);
  }

  /** @inheritdoc */
  public createFlcDirector(apValues: APValues): APFLCDirector {
    return new APFLCDirector(this.bus, apValues);
  }

  /** @inheritdoc */
  public createAltHoldDirector(apValues: APValues): APAltDirector {
    return new APAltDirector(this.bus, apValues);
  }

  /** @inheritdoc */
  public createAltCapDirector(apValues: APValues): APAltCapDirector {
    return new APAltCapDirector(this.bus, apValues);
  }

  private vnavDirector?: VNavDirector;

  /** @inheritdoc */
  public createVNavDirector(apValues: APValues): VNavDirector {
    return this.vnavDirector ??= new VNavDirector(this.bus, this.flightPlanner, new VNavPathCalculator(this.bus, this.flightPlanner), apValues);
  }

  /** @inheritdoc */
  public createGpDirector(apValues: APValues): APGPDirector {
    return new APGPDirector(this.bus, apValues, this.createVNavDirector(apValues));
  }

  /** @inheritdoc */
  public createGsDirector(apValues: APValues): APGSDirector {
    return new APGSDirector(this.bus, apValues);
  }

  /** @inheritdoc */
  public createNavToNavManager(apValues: APValues): G1000NavToNavManager {
    return new G1000NavToNavManager(this.bus, this.flightPlanner, apValues);
  }
}