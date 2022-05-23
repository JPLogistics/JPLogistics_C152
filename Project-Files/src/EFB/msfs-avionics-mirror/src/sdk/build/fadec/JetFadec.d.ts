import { ConsumerSubject, EventBus } from '../data';
/**
 * A control mode used by a jet FADEC.
 */
export interface JetFadecMode {
    /** The name of this mode. */
    readonly name: string;
    /**
     * Checks whether the FADEC should enter this mode for a specified engine.
     * @param index The index of the engine.
     * @param throttleLeverPos The virtual position of the throttle lever, in the range of 0 - 1.
     * @param throttle The current engine throttle setting, in the range of 0 - 1.
     * @param thrust The current net thrust delivered by the engine, in pounds.
     * @param n1 The current N1 value of the engine, in percent.
     * @param n1Corrected The current corrected N1 value of the engine, in percent.
     * @returns Whether the FADEC should enter this mode for the specified engine.
     */
    accept(index: number, throttleLeverPos: number, throttle: number, thrust: number, n1: number, n1Corrected: number): boolean;
    /**
     * Computes the desired engine throttle setting.
     * @param index The index of the engine.
     * @param throttleLeverPos The virtual position of the throttle lever, in the range of 0 - 1.
     * @param throttle The current engine throttle setting, in the range of 0 - 1.
     * @param thrust The current net thrust delivered by the engine, in pounds.
     * @param n1 The current N1 value of the engine, in percent.
     * @param n1Corrected The current corrected N1 value of the engine, in percent.
     * @param dt The elapsed time since the last FADEC update, in milliseconds.
     * @returns The desired engine throttle setting, in the range of 0 - 1.
     */
    computeDesiredThrottle(index: number, throttleLeverPos: number, throttle: number, thrust: number, n1: number, n1Corrected: number, dt: number): number;
    /**
     * Gets the visible position of the throttle lever for a specified engine.
     * @param index The index of the engine.
     * @param throttleLeverPos The virtual position of the throttle lever, in the range of 0 - 1.
     * @returns The visible position of the throttle lever, in the range of 0 - 1.
     */
    getVisibleThrottlePos(index: number, throttleLeverPos: number): number;
}
/**
 * Information for a throttle controlled by a jet FADEC.
 */
export declare type JetFadecThrottleInfo = {
    /** The index of the engine controlled by the throttle. */
    index: number;
    /** The event bus topic that emits the throttle's virtual lever position. */
    leverPosTopic: string;
    /** The name of the SimVar controlling the throttle's visible lever position. */
    visiblePosSimVar: string;
};
/**
 * A FADEC for turbojets. Controls engine throttle based on throttle lever position and other inputs.
 */
export declare class JetFadec {
    protected readonly bus: EventBus;
    protected readonly modes: readonly JetFadecMode[];
    protected readonly throttleInfos: readonly JetFadecThrottleInfo[];
    protected readonly throttleLeverPositionSubs: readonly ConsumerSubject<number>[];
    private readonly updateHandler;
    private readonly realTimeSub;
    private updateTimer;
    private lastUpdateTime;
    protected readonly lastModes: (JetFadecMode | null)[];
    /**
     * Constructor.
     * @param bus The event bus.
     * @param modes The modes supported by this FADEC, ordered from highest to lowest priority.
     * @param throttleInfos An array containing information pertaining to the throttles controlled by this FADEC. The
     * order of modes in the array determines their priority during mode selection. On every update cycle, the FADEC
     * iterates through the modes array in order, calling `accept()` on each mode until a value of `true` is returned.
     * Therefore, modes positioned earlier in the array have a higher priority for selection.
     */
    constructor(bus: EventBus, modes: readonly JetFadecMode[], throttleInfos: readonly JetFadecThrottleInfo[]);
    /**
     * Turns this FADEC on. If this FADEC is already running, then it will be turned off before turning on again with
     * the specified frequency.
     * @param frequency The frequency, in hertz, at which this FADEC will update.
     */
    start(frequency: number): void;
    /**
     * Turns this FADEC off.
     */
    stop(): void;
    /**
     * Updates this FADEC.
     */
    private update;
    /**
     * This method.
     * @param dt The elapsed time, in milliseconds, since the last update.
     */
    protected onUpdate(dt: number): void;
    /**
     * Updates a throttle.
     * @param index The index of the throttle in this FADEC's throttle list.
     * @param dt The elapsed time, in milliseconds, since the last update.
     */
    protected updateThrottle(index: number, dt: number): void;
    /**
     * Sets a FADEC mode for a throttle.
     * @param index The index of the throttle in this FADEC's throttle list.
     * @param mode The mode to set.
     */
    protected setMode(index: number, mode: JetFadecMode | null): void;
}
//# sourceMappingURL=JetFadec.d.ts.map