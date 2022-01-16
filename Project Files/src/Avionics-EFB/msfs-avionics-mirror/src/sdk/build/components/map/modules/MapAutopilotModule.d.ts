import { NumberUnitSubject } from '../../..';
import { EventBus } from '../../../data';
/**
 * A module describing the state of the autopilot.
 */
export declare class MapAutopilotModule {
    /** The altitude preselector setting. */
    readonly selectedAltitude: NumberUnitSubject<import("../../..").UnitFamily.Distance, import("../../..").SimpleUnit<import("../../..").UnitFamily.Distance>>;
    private readonly apSelectedAltitudeHandler;
    private isSyncing;
    private selectedAltitudeConsumer;
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
//# sourceMappingURL=MapAutopilotModule.d.ts.map