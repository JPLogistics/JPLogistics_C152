import { ConsumerSubject, SimVarValueType } from '../data';
/**
 * A FADEC for turbojets. Controls engine throttle based on throttle lever position and other inputs.
 */
export class JetFadec {
    /**
     * Constructor.
     * @param bus The event bus.
     * @param modes The modes supported by this FADEC, ordered from highest to lowest priority.
     * @param throttleInfos An array containing information pertaining to the throttles controlled by this FADEC. The
     * order of modes in the array determines their priority during mode selection. On every update cycle, the FADEC
     * iterates through the modes array in order, calling `accept()` on each mode until a value of `true` is returned.
     * Therefore, modes positioned earlier in the array have a higher priority for selection.
     */
    constructor(bus, modes, throttleInfos) {
        this.bus = bus;
        this.modes = modes;
        this.throttleInfos = throttleInfos;
        this.updateHandler = this.update.bind(this);
        this.realTimeSub = ConsumerSubject.create(this.bus.getSubscriber().on('realTime'), 0);
        this.updateTimer = null;
        this.lastUpdateTime = 0;
        this.lastModes = this.throttleInfos.map(() => null);
        const sub = this.bus.getSubscriber();
        this.throttleLeverPositionSubs = throttleInfos.map(info => {
            return ConsumerSubject.create(sub.on(info.leverPosTopic), 0);
        });
    }
    /**
     * Turns this FADEC on. If this FADEC is already running, then it will be turned off before turning on again with
     * the specified frequency.
     * @param frequency The frequency, in hertz, at which this FADEC will update.
     */
    start(frequency) {
        this.stop();
        this.bus.pub('fadec_active', true, true, true);
        this.updateTimer = setInterval(this.updateHandler, 1000 / frequency);
    }
    /**
     * Turns this FADEC off.
     */
    stop() {
        if (this.updateTimer === null) {
            return;
        }
        clearInterval(this.updateTimer);
        this.updateTimer = null;
        for (let i = 0; i < this.throttleInfos.length; i++) {
            this.setMode(i, null);
        }
        this.bus.pub('fadec_active', false, true, true);
    }
    /**
     * Updates this FADEC.
     */
    update() {
        const realTime = Date.now();
        // Check if the current time has diverged from the event bus value by more than 1 second.
        // If it has, we are probably paused in the menu and should skip the update.
        if (realTime - this.realTimeSub.get() >= 1000) {
            return;
        }
        const dt = realTime - this.lastUpdateTime;
        this.onUpdate(dt);
        this.lastUpdateTime = realTime;
    }
    /**
     * This method.
     * @param dt The elapsed time, in milliseconds, since the last update.
     */
    onUpdate(dt) {
        for (let i = 0; i < this.throttleInfos.length; i++) {
            this.updateThrottle(i, dt);
        }
    }
    /**
     * Updates a throttle.
     * @param index The index of the throttle in this FADEC's throttle list.
     * @param dt The elapsed time, in milliseconds, since the last update.
     */
    updateThrottle(index, dt) {
        const info = this.throttleInfos[index];
        const throttleLeverPos = this.throttleLeverPositionSubs[index].get();
        const throttle = SimVar.GetSimVarValue(`GENERAL ENG THROTTLE LEVER POSITION:${info.index}`, SimVarValueType.Percent) / 100;
        const thrust = SimVar.GetSimVarValue(`TURB ENG JET THRUST:${info.index}`, SimVarValueType.Pounds);
        const n1 = SimVar.GetSimVarValue(`TURB ENG N1:${info.index}`, SimVarValueType.Percent);
        const n1Corrected = SimVar.GetSimVarValue(`TURB ENG CORRECTED N1:${info.index}`, SimVarValueType.Percent);
        let desiredThrottle = throttleLeverPos;
        let visibleThrottlePos = throttleLeverPos;
        for (let i = 0; i < this.modes.length; i++) {
            const mode = this.modes[i];
            if (mode.accept(info.index, throttleLeverPos, throttle, thrust, n1, n1Corrected)) {
                this.setMode(index, mode);
                desiredThrottle = mode.computeDesiredThrottle(info.index, throttleLeverPos, throttle, thrust, n1, n1Corrected, dt);
                visibleThrottlePos = mode.getVisibleThrottlePos(info.index, throttleLeverPos);
                break;
            }
        }
        SimVar.SetSimVarValue(`GENERAL ENG THROTTLE LEVER POSITION:${info.index}`, SimVarValueType.Percent, Utils.Clamp(desiredThrottle * 100, 0, 100));
        SimVar.SetSimVarValue(info.visiblePosSimVar, 'number', Utils.Clamp(visibleThrottlePos, 0, 1));
    }
    /**
     * Sets a FADEC mode for a throttle.
     * @param index The index of the throttle in this FADEC's throttle list.
     * @param mode The mode to set.
     */
    setMode(index, mode) {
        var _a;
        if (mode === this.lastModes[index]) {
            return;
        }
        this.lastModes[index] = mode;
        this.bus.pub(`fadec_mode_${this.throttleInfos[index].index}`, (_a = mode === null || mode === void 0 ? void 0 : mode.name) !== null && _a !== void 0 ? _a : '', true, true);
    }
}
