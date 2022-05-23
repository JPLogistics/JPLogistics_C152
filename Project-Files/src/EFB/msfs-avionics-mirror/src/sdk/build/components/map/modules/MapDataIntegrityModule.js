import { Subject } from '../../../sub/Subject';
/**
 * A map module describing whether or not various signals are valid.
 */
export class MapDataIntegrityModule {
    constructor() {
        /** Whether or not the GPS position signal is valid. */
        this.gpsSignalValid = Subject.create(false);
        /** Whether or not the heading magnetometer signal is valid. */
        this.headingSignalValid = Subject.create(false);
    }
}
