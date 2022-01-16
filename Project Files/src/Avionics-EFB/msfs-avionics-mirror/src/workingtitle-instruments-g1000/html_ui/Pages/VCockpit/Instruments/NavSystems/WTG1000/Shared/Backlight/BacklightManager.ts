import { GeoPoint, Vec3Math } from 'msfssdk';
import { Consumer, EventBus } from 'msfssdk/data';
import { ClockEvents, GNSSEvents } from 'msfssdk/instruments';
import { UserSetting, UserSettingManager } from 'msfssdk/settings';
import { BacklightIntensitySettingName, BacklightMode, BacklightModeSettingName, BacklightUserSettings, BacklightUserSettingTypes } from './BacklightUserSettings';

/**
 * Manages backlight levels for the PFD and MFD screens and softkeys.
 */
export class BacklightManager {
  // The following constants control the response of the backlight simvar to the set intensity level.
  private static readonly RESPONSE_MIN = 0.01; // minimum backlight response
  private static readonly RESPONSE_MAX = 2; // maximum backlight response
  private static readonly RESPONSE_FACTOR = 3; // the greater the factor, the steeper the response curve
  private static readonly RESPONSE_SCALE = (BacklightManager.RESPONSE_MAX - BacklightManager.RESPONSE_MIN) / (Math.exp(BacklightManager.RESPONSE_FACTOR) - 1);

  private static readonly AUTO_UPDATE_REALTIME_FREQ = 10; // max frequency (Hz) of auto backlight level updates in real time
  private static readonly AUTO_UPDATE_SIMTIME_THRESHOLD = 60000; // minimum interval (ms) between auto backlight level updates in sim time

  private static readonly AUTO_MAX_INTENSITY = 100; // The maximum intensity applied by auto backlight.
  private static readonly AUTO_MIN_INTENSITY = 30; // The minimum intensity applied by auto backlight.
  private static readonly AUTO_INTENSITY_RANGE = BacklightManager.AUTO_MAX_INTENSITY - BacklightManager.AUTO_MIN_INTENSITY;

  private static readonly AUTO_MAX_SOLAR_ANGLE = 3; // The solar altitude angle at which auto backlight reaches maximum intensity.
  private static readonly AUTO_MIN_SOLAR_ANGLE = -8; // The solar altitude angle at which auto backlight reaches minimum intensity.
  private static readonly AUTO_MAX_SOLAR_ANGLE_SIN = Math.sin(BacklightManager.AUTO_MAX_SOLAR_ANGLE * Avionics.Utils.DEG2RAD);
  private static readonly AUTO_MIN_SOLAR_ANGLE_SIN = Math.sin(BacklightManager.AUTO_MIN_SOLAR_ANGLE * Avionics.Utils.DEG2RAD);
  private static readonly AUTO_SOLAR_ANGLE_RANGE_SIN = BacklightManager.AUTO_MAX_SOLAR_ANGLE_SIN - BacklightManager.AUTO_MIN_SOLAR_ANGLE_SIN;

  private static readonly EPOCH = 946684800000; // Jan 1, 2000 00:00:00 UTC
  private static readonly DAY = 86400000; // milliseconds in one day

  private static tempVec3 = new Float64Array(3);

  private readonly settingManager: UserSettingManager<BacklightUserSettingTypes>;

  private readonly MODE_SETTING_NAME: BacklightModeSettingName;
  private readonly INTENSITY_SETTING_NAME: BacklightIntensitySettingName;
  private readonly LVAR_NAME: string;

  private readonly screenIntensitySetting: UserSetting<BacklightIntensitySettingName, number>;

  private readonly simTimeConsumer: Consumer<number>;
  private simTimeChangeConsumer: Consumer<number> | null = null;
  private simTime = 0;

  private readonly pposConsumer: Consumer<LatLongAlt>;
  private pposChangeConsumer: Consumer<LatLongAlt> | null = null;
  private readonly ppos = new Float64Array(3);

  private readonly simTimeHandler = this.onSimTimeChanged.bind(this);
  private readonly pposHandler = this.onPPosChanged.bind(this);

  private needRecalcAuto = true;

  /**
   * Constructor.
   * @param display The display to manage. Either the PFD or the MFD.
   * @param bus The event bus.
   */
  constructor(public readonly display: 'pfd' | 'mfd', bus: EventBus) {
    this.MODE_SETTING_NAME = `${this.display}ScreenBacklightMode`;
    this.INTENSITY_SETTING_NAME = `${this.display}ScreenBacklightIntensity`;
    this.LVAR_NAME = `L:AS1000_${this.display}_Brightness`;

    this.settingManager = BacklightUserSettings.getManager(bus);

    this.screenIntensitySetting = this.settingManager.getSetting(this.INTENSITY_SETTING_NAME);

    const clockSubscriber = bus.getSubscriber<ClockEvents>();
    this.simTimeConsumer = clockSubscriber.on('simTime');
    this.pposConsumer = bus.getSubscriber<GNSSEvents>().on('gps-position');

    clockSubscriber.on('realTime').atFrequency(BacklightManager.AUTO_UPDATE_REALTIME_FREQ).handle(this.onUpdate.bind(this));
  }

  /**
   * Initializes this manager. Once this manager is initialized, it will automatically set backlight levels in response
   * to changes in their settings.
   */
  public init(): void {
    // TODO: Support key levels.
    this.settingManager.whenSettingChanged(this.MODE_SETTING_NAME).handle(this.onBacklightModeChanged.bind(this));
    this.settingManager.whenSettingChanged(this.INTENSITY_SETTING_NAME).handle(this.onScreenIntensityChanged.bind(this, this.LVAR_NAME));
  }

  /**
   * A callback which is called when the backlight mode changes.
   * @param mode The new backlight mode.
   */
  private onBacklightModeChanged(mode: BacklightMode): void {
    if (this.simTimeChangeConsumer) {
      this.simTimeChangeConsumer.off(this.simTimeHandler);
      this.simTimeChangeConsumer = null;
    }
    if (this.pposChangeConsumer) {
      this.pposChangeConsumer.off(this.pposHandler);
      this.pposChangeConsumer = null;
    }

    if (mode === BacklightMode.Auto) {
      this.simTimeChangeConsumer = this.simTimeConsumer.whenChangedBy(BacklightManager.AUTO_UPDATE_SIMTIME_THRESHOLD);
      this.simTimeChangeConsumer.handle(this.simTimeHandler);

      this.pposChangeConsumer = this.pposConsumer.atFrequency(BacklightManager.AUTO_UPDATE_REALTIME_FREQ);
      this.pposChangeConsumer.handle(this.pposHandler);
    } else {
      this.needRecalcAuto = false;
    }
  }

  /**
   * A callback which is called when the screen intensity value changes.
   * @param simvar The simvar to adjust.
   * @param intensity The new intensity value.
   */
  private onScreenIntensityChanged(simvar: string, intensity: number): void {
    const level = BacklightManager.RESPONSE_MIN + (Math.exp(BacklightManager.RESPONSE_FACTOR * intensity / 100) - 1) * BacklightManager.RESPONSE_SCALE;
    SimVar.SetSimVarValue(simvar, 'number', level);
  }

  /**
   * A callback which is called when the sim time changes.
   * @param time The new sim time.
   */
  private onSimTimeChanged(time: number): void {
    this.simTime = time;
    this.needRecalcAuto = true;
  }

  /**
   * A callback which is called when the sim time changes.
   * @param ppos The new plane position.
   */
  private onPPosChanged(ppos: LatLongAlt): void {
    const pposVec = GeoPoint.sphericalToCartesian(ppos.lat, ppos.long, BacklightManager.tempVec3);
    if (Vec3Math.dot(pposVec, this.ppos) >= 1 - 1e-4) { // ~600 m
      return;
    }

    Vec3Math.copy(pposVec, this.ppos);
    this.needRecalcAuto = true;
  }

  /**
   * This method runs once per update cycle.
   */
  private onUpdate(): void {
    if (this.needRecalcAuto) {
      this.updateAutoBacklightIntensity();
      this.needRecalcAuto = false;
    }
  }

  /**
   * Updates backlight intensity according to the auto setting algorithm.
   */
  private updateAutoBacklightIntensity(): void {
    const subSolarPoint = BacklightManager.calculateSubSolarPoint(this.simTime, BacklightManager.tempVec3);
    const sinSolarAngle = Vec3Math.dot(this.ppos, subSolarPoint);
    const sinSolarAngleClamped = Utils.Clamp(sinSolarAngle, BacklightManager.AUTO_MIN_SOLAR_ANGLE_SIN, BacklightManager.AUTO_MAX_SOLAR_ANGLE_SIN);
    const intensityFrac = (sinSolarAngleClamped - BacklightManager.AUTO_MIN_SOLAR_ANGLE_SIN) / BacklightManager.AUTO_SOLAR_ANGLE_RANGE_SIN;

    this.screenIntensitySetting.value = Math.round(BacklightManager.AUTO_MIN_INTENSITY + intensityFrac * BacklightManager.AUTO_INTENSITY_RANGE);
  }

  /**
   * Calculates the subsolar point (the point on Earth's surface directly below the Sun, where solar zenith angle = 0)
   * given a specific time.
   * @param time A UNIX timestamp in milliseconds.
   * @param out A Float64Array object to which to write the result.
   * @returns the subsolar point at the specified time.
   */
  private static calculateSubSolarPoint(time: number, out: Float64Array): Float64Array {
    // Source: Zhang, T et al. https://doi.org/10.1016/j.renene.2021.03.047
    const PI2 = 2 * Math.PI;
    const days = (time - BacklightManager.EPOCH) / BacklightManager.DAY;
    const daysFrac = days - Math.floor(days);
    const L = (4.895055 + 0.01720279 * days);
    const g = (6.240041 + 0.01720197 * days);
    const lambda = L + 0.033423 * Math.sin(g) + 0.000349 * Math.sin(2 * g);
    const epsilon = 0.40910518 - 6.98e-9 * days;
    const rAscension = Math.atan2(Math.cos(epsilon) * Math.sin(lambda), Math.cos(lambda));
    const declination = Math.asin(Math.sin(epsilon) * Math.sin(lambda));

    // equation of time in days.
    const E = (((L - rAscension) % PI2 + 3 * Math.PI) % PI2 - Math.PI) * 0.159155;

    const lat = declination * Avionics.Utils.RAD2DEG;
    const lon = -15 * (daysFrac - 0.5 + E) * 24;

    return GeoPoint.sphericalToCartesian(lat, lon, out);
  }
}