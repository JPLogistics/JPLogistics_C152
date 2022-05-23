import { NumberUnitSubject, UnitType } from '../../..';
/**
 * A module describing the state of the autopilot.
 */
export class MapAutopilotModule {
    constructor() {
        /** The altitude preselector setting. */
        this.selectedAltitude = NumberUnitSubject.createFromNumberUnit(UnitType.FOOT.createNumber(0));
        this.apSelectedAltitudeHandler = (alt) => {
            this.selectedAltitude.set(alt);
        };
        this.isSyncing = false;
        this.selectedAltitudeConsumer = null;
    }
    /**
     * Begins syncing this module with the event bus. While syncing is active, this module's properties will be
     * automatically updated with the latest information provided by the event bus.
     * @param bus The event bus.
     * @param updateFreq The frequency at which to sync with the event bus.
     */
    beginSync(bus, updateFreq) {
        this.stopSync();
        const subscriber = bus.getSubscriber();
        this.selectedAltitudeConsumer = subscriber.on('ap_altitude_selected').atFrequency(updateFreq);
        this.selectedAltitudeConsumer.handle(this.apSelectedAltitudeHandler);
        this.isSyncing = true;
    }
    /**
     * Stops syncing this module with the event bus.
     */
    stopSync() {
        var _a;
        if (!this.isSyncing) {
            return;
        }
        (_a = this.selectedAltitudeConsumer) === null || _a === void 0 ? void 0 : _a.off(this.apSelectedAltitudeHandler);
        this.isSyncing = false;
    }
}
