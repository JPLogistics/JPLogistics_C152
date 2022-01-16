import { DebounceTimer, NumberUnitInterface, UnitFamily, UnitType } from 'msfssdk';
import { EventBus, KeyEventData, KeyEvents, KeyInterceptManager, SimVarValueType } from 'msfssdk/data';
import { APEvents } from 'msfssdk/instruments';
import { PFDUserSettings } from '../../PFD/PFDUserSettings';

/**
 * Controls the value of the autopilot selected altitude setting in response to key events.
 */
export class AltitudeSelectManager {
  private readonly pfdSettingsManager = PFDUserSettings.getManager(this.bus);
  private keyInterceptManager?: KeyInterceptManager;

  private readonly minValueFeet: number;
  private readonly maxValueFeet: number;
  private readonly minValueMeters: number;
  private readonly maxValueMeters: number;

  private readonly altimeterMetricSetting = this.pfdSettingsManager.getSetting('altMetric');

  private isEnabled = true;
  private isInitialized = false;
  private isLocked = false;

  private lockDebounceTimer = new DebounceTimer();

  private readonly selectedAltitudeChangedHandler = (): void => {
    // wait one frame before unlocking due to delay between when a key event is created and when it is intercepted on
    // the JS side
    setTimeout(() => {
      this.isLocked = false;
      this.lockDebounceTimer.clear();
    });
  };

  /**
   * Constructor.
   * @param bus The event bus.
   * @param minValue The minimum value of the selected altitude setting.
   * @param maxValue The maximum value of the selected altitude setting.
   */
  constructor(
    private readonly bus: EventBus,
    minValue: NumberUnitInterface<UnitFamily.Distance>,
    maxValue: NumberUnitInterface<UnitFamily.Distance>
  ) {
    this.minValueFeet = Math.round(minValue.asUnit(UnitType.FOOT));
    this.maxValueFeet = Math.round(maxValue.asUnit(UnitType.FOOT));
    this.minValueMeters = Math.round(minValue.asUnit(UnitType.METER));
    this.maxValueMeters = Math.round(maxValue.asUnit(UnitType.METER));

    KeyInterceptManager.getManager(bus).then(manager => {
      this.keyInterceptManager = manager;

      manager.interceptKey('AP_ALT_VAR_SET_ENGLISH', false);
      manager.interceptKey('AP_ALT_VAR_SET_METRIC', false);
      manager.interceptKey('AP_ALT_VAR_INC', false);
      manager.interceptKey('AP_ALT_VAR_DEC', false);

      const sub = this.bus.getSubscriber<KeyEvents & APEvents>();

      sub.on('alt_select').whenChanged().handle(this.selectedAltitudeChangedHandler);
      sub.on('key_intercept').handle(this.onKeyIntercepted.bind(this));

      this.bus.pub('ap_alt_sel_set', !this.isEnabled || this.isInitialized, true);
    });
  }

  /**
   * Sets whether this manager is enabled. When this manager is disabled, all key events to change the selected
   * altitude setting are processed "as-is".
   * @param isEnabled Whether this manager is enabled.
   */
  public setEnabled(isEnabled: boolean): void {
    this.isEnabled = isEnabled;
    this.bus.pub('ap_alt_sel_set', !isEnabled || this.isInitialized, true);
  }

  /**
   * Responds to key intercepted events.
   * @param data The event data.
   * @param data.key The key that was intercepted.
   * @param data.index The index of the intercepted key event.
   * @param data.value The value of the intercepted key event.
   */
  private onKeyIntercepted({ key, index, value }: KeyEventData): void {
    index ??= 1; // key events without an explicit index automatically get mapped to index 1

    // Even though values are uint32, we will do what the sim does and pretend they're actually sint32
    if (value !== undefined && value >= 2147483648) {
      value -= 4294967296;
    }

    if (!this.isEnabled || index > 1) {
      this.passThroughKeyEvent(key, index, value);
      return;
    }

    // In order to avoid race conditions, only handle a key event if we are not already busy setting the selected
    // altitude simvar
    if (!this.isLocked) {
      this.handleKeyEvent(key, value);
    }
  }

  /**
   * Handles a key event.
   * @param key The key.
   * @param value The value of the key event.
   */
  private handleKeyEvent(key: string, value?: number): void {
    const currentValue = SimVar.GetSimVarValue('AUTOPILOT ALTITUDE LOCK VAR:1', SimVarValueType.Feet);
    let startValue = currentValue;

    if (!this.isInitialized) {
      startValue = SimVar.GetSimVarValue('INDICATED ALTITUDE', SimVarValueType.Feet);
      this.bus.pub('ap_alt_sel_set', true, true);
      this.isInitialized = true;
    }

    switch (key) {
      case 'AP_ALT_VAR_INC':
        this.changeSelectedAltitude(startValue, 1, value !== undefined && value > 999);
        break;
      case 'AP_ALT_VAR_DEC':
        this.changeSelectedAltitude(startValue, -1, value !== undefined && value > 999);
        break;
      case 'AP_ALT_VAR_SET_ENGLISH':
      case 'AP_ALT_VAR_SET_METRIC': {
        if (value !== undefined && value !== currentValue) {
          const delta = value - currentValue;
          this.changeSelectedAltitude(startValue, delta < 0 ? -1 : 1, Math.abs(delta) > 999);
        }
        break;
      }
    }
  }

  /**
   * Increments or decrements the selected altitude setting. The amount the setting is changed depends on whether the
   * PFD altimeter metric mode is enabled. The value of the setting after the change is guaranteed to be a round number
   * in the appropriate units (nearest 100 feet or 50 meters).
   * @param startValue The value from which to change, in feet.
   * @param direction The direction of the change: `1` for increment, `-1` for decrement.
   * @param useLargeIncrement Whether to change the altitude by the large increment (1000 feet/500 meters) instead of
   * the small increment (100 feet/50 meters). False by default.
   */
  private changeSelectedAltitude(startValue: number, direction: -1 | 1, useLargeIncrement = false): void {
    const roundFunc = direction === 1 ? Math.floor : Math.ceil;
    const isMetric = this.altimeterMetricSetting.value;

    let min, max, increment, units;
    if (isMetric) {
      min = this.minValueMeters;
      max = this.maxValueMeters;
      increment = 50;
      units = UnitType.METER;
    } else {
      min = this.minValueFeet;
      max = this.maxValueFeet;
      increment = 100;
      units = UnitType.FOOT;
    }

    startValue = Math.round(UnitType.FOOT.convertTo(startValue, units));
    useLargeIncrement &&= startValue % increment === 0;
    const valueToSet = UnitType.FOOT.convertFrom(Utils.Clamp((roundFunc(startValue / increment) + direction * (useLargeIncrement ? 10 : 1)) * increment, min, max), units);

    if (valueToSet !== SimVar.GetSimVarValue('AUTOPILOT ALTITUDE LOCK VAR:1', SimVarValueType.Feet)) {
      SimVar.SetSimVarValue('AUTOPILOT ALTITUDE LOCK VAR:1', SimVarValueType.Feet, valueToSet);
      this.isLocked = true;
      // Sometimes the alt select change event will not fire if the change is too small, so we set a timeout to unlock
      // just in case
      this.lockDebounceTimer.schedule(() => { this.isLocked = false; }, 250);
    }
  }

  /**
   * Processes a key event "as-is".
   * @param key The key that was pressed.
   * @param index The index of the key event.
   * @param value The value of the key event.
   */
  private passThroughKeyEvent(key: string, index: number, value?: number): void {
    index = Math.max(1, index);

    const currentValue = SimVar.GetSimVarValue(`AUTOPILOT ALTITUDE LOCK VAR:${index}`, SimVarValueType.Feet);

    let valueToSet = currentValue;

    switch (key) {
      case 'AP_ALT_VAR_SET_ENGLISH':
      case 'AP_ALT_VAR_SET_METRIC':
        if (value !== undefined) {
          valueToSet = value;
        }
        break;
      case 'AP_ALT_VAR_INC':
        valueToSet += value ?? 100;
        break;
      case 'AP_ALT_VAR_DEC':
        valueToSet -= value ?? 100;
        break;
    }

    SimVar.SetSimVarValue(`AUTOPILOT ALTITUDE LOCK VAR:${index}`, SimVarValueType.Feet, valueToSet);
  }
}