import { Subject } from '../../../sub/Subject';
/**
 * A map module describing whether or not various signals are valid.
 */
export declare class MapDataIntegrityModule {
    /** Whether or not the GPS position signal is valid. */
    readonly gpsSignalValid: Subject<boolean>;
    /** Whether or not the heading magnetometer signal is valid. */
    readonly headingSignalValid: Subject<boolean>;
}
//# sourceMappingURL=MapDataIntegrityModule.d.ts.map