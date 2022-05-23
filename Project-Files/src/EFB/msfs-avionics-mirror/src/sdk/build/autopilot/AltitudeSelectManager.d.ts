import { NumberUnitInterface, UnitFamily } from '../';
import { EventBus } from '../data';
import { UserSettingType, UserSettingManager } from '../settings';
/**
 * Metric Altitude Select Setting.
 */
export interface MetricAltitudeSelectSetting {
    /** Whether the altimeter is set to Metric */
    'altMetric': boolean;
}
/**
 * A type describing a settings manager that at least has the metric altimeter setting.
 */
export declare type MetricAltitudeSettingsManager = UserSettingManager<MetricAltitudeSelectSetting & Record<any, UserSettingType>>;
/**
 * Configuration options for AltitudeSelectManager.
 */
export declare type AltitudeSelectManagerOptions = {
    /** Whether to support metric mode. */
    supportMetric: boolean;
    /** The minimum value of the selected altitude setting. */
    minValue: NumberUnitInterface<UnitFamily.Distance>;
    /** The maximum value of the selected altitude setting. */
    maxValue: NumberUnitInterface<UnitFamily.Distance>;
    /**
     * The minimum value of the selected altitude setting in metric mode. If undefined, it will be set equal to the
     * minimum value in non-metric mode.
     */
    minValueMetric?: NumberUnitInterface<UnitFamily.Distance>;
    /**
     * The maximum value of the selected altitude setting in metric mode. If undefined, it will be set equal to the
     * maximum value in non-metric mode.
     */
    maxValueMetric?: NumberUnitInterface<UnitFamily.Distance>;
    /**
     * The threshold for an altitude select change key input value above which the input is interpreted as a large
     * increment.
     */
    inputIncrLargeThreshold: number;
    /** The value to increase/decrease the selected altitude setting on a small increment. */
    incrSmall: NumberUnitInterface<UnitFamily.Distance>;
    /** The value to increase/decrease the selected altitude setting on a large increment.  */
    incrLarge: NumberUnitInterface<UnitFamily.Distance>;
    /**
     * The value to increase/decrease the selected altitude setting on a small increment in metric mode. If undefined,
     * it will be set equal to the small increment value in non-metric mode.
     */
    incrSmallMetric?: NumberUnitInterface<UnitFamily.Distance>;
    /**
     * The value to increase/decrease the selected altitude setting on a large increment in metric mode. If undefined,
     * it will be set equal to the large increment value in non-metric mode.
     */
    incrLargeMetric?: NumberUnitInterface<UnitFamily.Distance>;
    /**
     * Whether to lock the selected altitude setting to multiples of the appropriate increment value on a small or large
     * increment. True by default.
     */
    lockAltToStepOnIncr?: boolean;
    /**
     * Whether to lock the selected altitude setting to multiples of the appropriate increment value on a small or large
     * increment in metric mode. If undefined, it will be set equal to the lock flag in non-metric mode.
     */
    lockAltToStepOnIncrMetric?: boolean;
    /**
     * The required number of consecutive small-increment inputs received to trigger input acceleration. While
     * acceleration is active, small-increment inputs will be converted to large increments. A threshold less than or
     * equal to zero effectively disables input acceleration. Defaults to 0.
     */
    accelInputCountThreshold?: number;
    /** Whether to reset input acceleration if the direction of increment changes. Defaults to false. */
    accelResetOnDirectionChange?: boolean;
    /**
     * Whether to initialize the selected altitude setting to the indicated altitude. Defaults to false.
     */
    initToIndicatedAlt?: boolean;
};
/**
 * Controls the value of the autopilot selected altitude setting in response to key events.
 */
export declare class AltitudeSelectManager {
    private readonly bus;
    private static readonly CONSECUTIVE_INPUT_PERIOD;
    private keyInterceptManager?;
    private readonly minValue;
    private readonly maxValue;
    private readonly minValueMetric;
    private readonly maxValueMetric;
    private readonly inputIncrLargeThreshold;
    private readonly incrSmall;
    private readonly incrLarge;
    private readonly incrSmallMetric;
    private readonly incrLargeMetric;
    private readonly lockAltToStepOnIncr;
    private readonly lockAltToStepOnIncrMetric;
    private readonly accelInputCountThreshold;
    private readonly accelResetOnDirectionChange;
    private readonly initToIndicatedAlt;
    private readonly altimeterMetricSetting;
    private isEnabled;
    private isInitialized;
    private isLocked;
    private lockDebounceTimer;
    private consecIncrSmallCount;
    private lastIncrSmallDirection;
    private lastIncrSmallInputTime;
    private readonly selectedAltitudeChangedHandler;
    /**
     * Constructor.
     * @param bus The event bus.
     * @param settingsManager The user settings manager controlling metric altitude preselector setting.
     * @param options Configuration options for this manager.
     */
    constructor(bus: EventBus, settingsManager: MetricAltitudeSettingsManager, options: AltitudeSelectManagerOptions);
    /**
     * Sets whether this manager is enabled. When this manager is disabled, all key events to change the selected
     * altitude setting are processed "as-is".
     * @param isEnabled Whether this manager is enabled.
     */
    setEnabled(isEnabled: boolean): void;
    /**
     * Responds to key intercepted events.
     * @param data The event data.
     * @param data.key The key that was intercepted.
     * @param data.index The index of the intercepted key event.
     * @param data.value The value of the intercepted key event.
     */
    private onKeyIntercepted;
    /**
     * Handles a key event.
     * @param key The key.
     * @param value The value of the key event.
     */
    private handleKeyEvent;
    /**
     * Increments or decrements the selected altitude setting. The amount the setting is changed depends on whether the
     * PFD altimeter metric mode is enabled. The value of the setting after the change is guaranteed to be a round number
     * in the appropriate units (nearest 100 feet or 50 meters).
     * @param startValue The value from which to change, in feet.
     * @param direction The direction of the change: `1` for increment, `-1` for decrement.
     * @param useLargeIncrement Whether to change the altitude by the large increment (1000 feet/500 meters) instead of
     * the small increment (100 feet/50 meters). False by default.
     */
    private changeSelectedAltitude;
    /**
     * Processes a key event "as-is".
     * @param key The key that was pressed.
     * @param index The index of the key event.
     * @param value The value of the key event.
     */
    private passThroughKeyEvent;
}
//# sourceMappingURL=AltitudeSelectManager.d.ts.map