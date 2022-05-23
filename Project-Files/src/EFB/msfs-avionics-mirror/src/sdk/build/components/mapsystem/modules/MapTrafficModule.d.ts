import { NumberUnitSubject } from '../../../math';
import { Subject, Subscribable } from '../../../sub';
import { TCAS, TCASOperatingMode } from '../../../traffic';
import { MapSystemContext } from '../MapSystemContext';
import { AbstractMapModule } from './AbstractMapModule';
/**
 * Traffic alert level modes.
 */
export declare enum MapTrafficAlertLevelVisibility {
    Other = 1,
    ProximityAdvisory = 2,
    TrafficAdvisory = 4,
    ResolutionAdvisory = 8,
    All = 15
}
/**
 * A module describing the display of traffic.
 */
export declare class MapTrafficModule extends AbstractMapModule {
    readonly tcas: TCAS;
    /** Whether to show traffic information. */
    readonly show: Subject<boolean>;
    /** The TCAS operating mode. */
    readonly operatingMode: Subscribable<TCASOperatingMode>;
    /**
     * The distance from the own airplane beyond which intruders are considered off-scale. If the value is `NaN`,
     * intruders are never considered off-scale.
     */
    readonly offScaleRange: NumberUnitSubject<import("../../../math").UnitFamily.Distance, import("../../../math").SimpleUnit<import("../../../math").UnitFamily.Distance>>;
    /** Alert level visibility flags. */
    readonly alertLevelVisibility: Subject<number>;
    /** The difference in altitude above the own airplane above which intruders will not be displayed. */
    readonly altitudeRestrictionAbove: NumberUnitSubject<import("../../../math").UnitFamily.Distance, import("../../../math").SimpleUnit<import("../../../math").UnitFamily.Distance>>;
    /** The difference in altitude below the own airplane below which intruders will not be displayed. */
    readonly altitudeRestrictionBelow: NumberUnitSubject<import("../../../math").UnitFamily.Distance, import("../../../math").SimpleUnit<import("../../../math").UnitFamily.Distance>>;
    /** Whether displayed intruder altitude is relative. */
    readonly isAltitudeRelative: Subject<boolean>;
    /**
     * Creates an instance of a MapTrafficModule.
     * @param tcas This module's associated TCAS.
     * @param mapSystemContext The map system context that will be used by this module.
     */
    constructor(tcas: TCAS, mapSystemContext?: MapSystemContext);
    /** @inheritdoc */
    onInstall(): void;
}
//# sourceMappingURL=MapTrafficModule.d.ts.map