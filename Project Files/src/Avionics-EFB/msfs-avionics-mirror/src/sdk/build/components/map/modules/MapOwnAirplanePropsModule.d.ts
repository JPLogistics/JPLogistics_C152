import { GeoPointSubject, NumberUnitSubject, Subject } from '../../..';
import { EventBus } from '../../../data';
/**
 * A module describing the state of the own airplane.
 */
export declare class MapOwnAirplanePropsModule {
    /** The airplane's position. */
    readonly position: GeoPointSubject;
    /** The airplane's true heading, in degrees. */
    readonly hdgTrue: Subject<number>;
    /** The airplane's turn rate, in degrees per second. */
    readonly turnRate: Subject<number>;
    /** The airplane's indicated altitude. */
    readonly altitude: NumberUnitSubject<import("../../..").UnitFamily.Distance, import("../../..").SimpleUnit<import("../../..").UnitFamily.Distance>>;
    /** The airplane's vertical speed. */
    readonly verticalSpeed: NumberUnitSubject<import("../../..").UnitFamily.Speed, import("../../..").CompoundUnit<import("../../..").UnitFamily.Speed>>;
    /** The airplane's true ground track, in degrees. */
    readonly trackTrue: Subject<number>;
    /** The airplane's ground speed. */
    readonly groundSpeed: NumberUnitSubject<import("../../..").UnitFamily.Speed, import("../../..").CompoundUnit<import("../../..").UnitFamily.Speed>>;
    /** Whether the airplane is on the ground. */
    readonly isOnGround: Subject<boolean>;
    /** The magnetic variation at the airplane's position. */
    readonly magVar: Subject<number>;
    private readonly positionHandler;
    private readonly headingHandler;
    private readonly turnRateHandler;
    private readonly altitudeHandler;
    private readonly verticalSpeedHandler;
    private readonly trackHandler;
    private readonly groundSpeedHandler;
    private readonly onGroundHandler;
    private readonly magVarHandler;
    private isSyncing;
    private positionConsumer;
    private headingConsumer;
    private turnRateConsumer;
    private altitudeConsumer;
    private verticalSpeedConsumer;
    private trackConsumer;
    private groundSpeedConsumer;
    private onGroundConsumer;
    private magVarConsumer;
    /**
     * Begins syncing this module with the event bus. While syncing is active, this module's properties will be
     * automatically updated with the latest information provided by the event bus.
     * @param bus The event bus.
     * @param updateFreq The frequency at which to sync with the event bus.
     */
    beginSync(bus: EventBus, updateFreq: number): void;
    /**
     * Stops syncing this module with the event bus.
     */
    stopSync(): void;
}
//# sourceMappingURL=MapOwnAirplanePropsModule.d.ts.map