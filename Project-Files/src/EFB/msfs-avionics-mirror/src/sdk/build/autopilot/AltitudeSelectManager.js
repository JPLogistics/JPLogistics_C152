import { UnitType } from '../';
import { KeyInterceptManager, SimVarValueType } from '../data';
import { DebounceTimer } from '../utils/time';
/**
 * Controls the value of the autopilot selected altitude setting in response to key events.
 */
export class AltitudeSelectManager {
    /**
     * Constructor.
     * @param bus The event bus.
     * @param settingsManager The user settings manager controlling metric altitude preselector setting.
     * @param options Configuration options for this manager.
     */
    constructor(bus, settingsManager, options) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        this.bus = bus;
        this.isEnabled = true;
        this.isInitialized = false;
        this.isLocked = false;
        this.lockDebounceTimer = new DebounceTimer();
        this.consecIncrSmallCount = 0;
        this.lastIncrSmallDirection = 1;
        this.lastIncrSmallInputTime = 0;
        this.selectedAltitudeChangedHandler = () => {
            // wait one frame before unlocking due to delay between when a key event is created and when it is intercepted on
            // the JS side
            setTimeout(() => {
                this.isLocked = false;
                this.lockDebounceTimer.clear();
            });
        };
        this.minValue = Math.round(options.minValue.asUnit(UnitType.FOOT));
        this.maxValue = Math.round(options.maxValue.asUnit(UnitType.FOOT));
        this.minValueMetric = Math.round(((_a = options.minValueMetric) !== null && _a !== void 0 ? _a : options.minValue).asUnit(UnitType.METER));
        this.maxValueMetric = Math.round(((_b = options.maxValueMetric) !== null && _b !== void 0 ? _b : options.maxValue).asUnit(UnitType.METER));
        this.inputIncrLargeThreshold = options.inputIncrLargeThreshold;
        this.incrSmall = Math.round(options.incrSmall.asUnit(UnitType.FOOT));
        this.incrLarge = Math.round(options.incrLarge.asUnit(UnitType.FOOT));
        this.incrSmallMetric = Math.round(((_c = options.incrSmallMetric) !== null && _c !== void 0 ? _c : options.incrSmall).asUnit(UnitType.METER));
        this.incrLargeMetric = Math.round(((_d = options.incrLargeMetric) !== null && _d !== void 0 ? _d : options.incrLarge).asUnit(UnitType.METER));
        this.lockAltToStepOnIncr = (_e = options.lockAltToStepOnIncr) !== null && _e !== void 0 ? _e : true;
        this.lockAltToStepOnIncrMetric = (_f = options.lockAltToStepOnIncrMetric) !== null && _f !== void 0 ? _f : this.lockAltToStepOnIncr;
        this.accelInputCountThreshold = (_g = options.accelInputCountThreshold) !== null && _g !== void 0 ? _g : 0;
        this.accelResetOnDirectionChange = (_h = options.accelResetOnDirectionChange) !== null && _h !== void 0 ? _h : false;
        this.initToIndicatedAlt = (_j = options.initToIndicatedAlt) !== null && _j !== void 0 ? _j : false;
        this.altimeterMetricSetting = options.supportMetric ? settingsManager.getSetting('altMetric') : undefined;
        KeyInterceptManager.getManager(bus).then(manager => {
            this.keyInterceptManager = manager;
            manager.interceptKey('AP_ALT_VAR_SET_ENGLISH', false);
            manager.interceptKey('AP_ALT_VAR_SET_METRIC', false);
            manager.interceptKey('AP_ALT_VAR_INC', false);
            manager.interceptKey('AP_ALT_VAR_DEC', false);
            const sub = this.bus.getSubscriber();
            sub.on('ap_altitude_selected').whenChanged().handle(this.selectedAltitudeChangedHandler);
            sub.on('key_intercept').handle(this.onKeyIntercepted.bind(this));
            this.bus.pub('ap_alt_sel_set', !this.isEnabled || this.isInitialized, true);
        });
    }
    /**
     * Sets whether this manager is enabled. When this manager is disabled, all key events to change the selected
     * altitude setting are processed "as-is".
     * @param isEnabled Whether this manager is enabled.
     */
    setEnabled(isEnabled) {
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
    onKeyIntercepted({ key, index, value }) {
        switch (key) {
            case 'AP_ALT_VAR_INC':
            case 'AP_ALT_VAR_DEC':
            case 'AP_ALT_VAR_SET_ENGLISH':
            case 'AP_ALT_VAR_SET_METRIC':
                break;
            default:
                return;
        }
        index !== null && index !== void 0 ? index : (index = 1); // key events without an explicit index automatically get mapped to index 1
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
    handleKeyEvent(key, value) {
        const currentValue = SimVar.GetSimVarValue('AUTOPILOT ALTITUDE LOCK VAR:1', SimVarValueType.Feet);
        let startValue = currentValue;
        if (!this.isInitialized) {
            if (this.initToIndicatedAlt) {
                startValue = SimVar.GetSimVarValue('INDICATED ALTITUDE', SimVarValueType.Feet);
            }
            this.bus.pub('ap_alt_sel_set', true, true);
            this.isInitialized = true;
        }
        let direction = 0;
        let useLargeIncrement = false;
        switch (key) {
            case 'AP_ALT_VAR_INC':
                direction = 1;
                useLargeIncrement = value !== undefined && value > this.inputIncrLargeThreshold;
                break;
            case 'AP_ALT_VAR_DEC':
                direction = -1;
                useLargeIncrement = value !== undefined && value > this.inputIncrLargeThreshold;
                break;
            case 'AP_ALT_VAR_SET_ENGLISH':
            case 'AP_ALT_VAR_SET_METRIC': {
                if (value !== undefined && value !== currentValue) {
                    const delta = value - currentValue;
                    direction = delta < 0 ? -1 : 1;
                    useLargeIncrement = Math.abs(delta) > this.inputIncrLargeThreshold;
                }
                break;
            }
        }
        // Handle input acceleration
        if (this.accelInputCountThreshold > 0) {
            const time = Date.now();
            let isAccelActive = this.consecIncrSmallCount >= this.accelInputCountThreshold;
            if (useLargeIncrement
                || direction === 0
                || (this.consecIncrSmallCount > 0 && time - this.lastIncrSmallInputTime > AltitudeSelectManager.CONSECUTIVE_INPUT_PERIOD)
                || ((isAccelActive ? this.accelResetOnDirectionChange : this.consecIncrSmallCount > 0) && this.lastIncrSmallDirection !== direction)) {
                this.consecIncrSmallCount = 0;
            }
            if (!useLargeIncrement) {
                this.consecIncrSmallCount++;
                this.lastIncrSmallDirection = direction;
                this.lastIncrSmallInputTime = time;
            }
            isAccelActive = this.consecIncrSmallCount >= this.accelInputCountThreshold;
            if (isAccelActive) {
                useLargeIncrement = true;
            }
        }
        if (direction !== 0) {
            this.changeSelectedAltitude(startValue, direction, useLargeIncrement);
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
    changeSelectedAltitude(startValue, direction, useLargeIncrement = false) {
        var _a, _b;
        const roundFunc = direction === 1 ? Math.floor : Math.ceil;
        const isMetric = (_b = (_a = this.altimeterMetricSetting) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : false;
        let min, max, incrSmall, incrLarge, units, lockAlt;
        if (isMetric) {
            min = this.minValueMetric;
            max = this.maxValueMetric;
            incrSmall = this.incrSmallMetric;
            incrLarge = this.incrLargeMetric;
            units = UnitType.METER;
            lockAlt = this.lockAltToStepOnIncrMetric;
        }
        else {
            min = this.minValue;
            max = this.maxValue;
            incrSmall = this.incrSmall;
            incrLarge = this.incrLarge;
            units = UnitType.FOOT;
            lockAlt = this.lockAltToStepOnIncr;
        }
        startValue = Math.round(UnitType.FOOT.convertTo(startValue, units));
        useLargeIncrement && (useLargeIncrement = !lockAlt || (startValue % incrSmall === 0));
        const valueToSet = UnitType.FOOT.convertFrom(Utils.Clamp((lockAlt ? roundFunc(startValue / incrSmall) * incrSmall : startValue) + direction * (useLargeIncrement ? incrLarge : incrSmall), min, max), units);
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
    passThroughKeyEvent(key, index, value) {
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
                valueToSet += value !== null && value !== void 0 ? value : 100;
                break;
            case 'AP_ALT_VAR_DEC':
                valueToSet -= value !== null && value !== void 0 ? value : 100;
                break;
        }
        SimVar.SetSimVarValue(`AUTOPILOT ALTITUDE LOCK VAR:${index}`, SimVarValueType.Feet, valueToSet);
    }
}
AltitudeSelectManager.CONSECUTIVE_INPUT_PERIOD = 250; // the maximum amount of time, in ms, between input events that are counted as consecutive
