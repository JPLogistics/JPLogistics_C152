import { SimpleUnit, UnitFamily } from '../../../math/NumberUnit';
import { NumberUnitSubject } from '../../../math/NumberUnitSubject';
import { MapSystemContext } from '../MapSystemContext';
import { AbstractMapModule } from './AbstractMapModule';
/**
 * A module describing the nominal range of a map.
 */
export declare class MapRangeModule extends AbstractMapModule {
    /** The range of the map as a number unit. */
    readonly nominalRange: NumberUnitSubject<UnitFamily.Distance, SimpleUnit<UnitFamily.Distance>>;
    private readonly projectionParams;
    /**
     * Creates an instance of a MapRangeModule.
     * @param mapSystemContext The map system context to use with this instance.
     */
    constructor(mapSystemContext?: MapSystemContext);
    private readonly rangeHandler;
    /** @inheritdoc */
    startSync(): void;
    /** @inheritdoc */
    stopSync(): void;
}
//# sourceMappingURL=MapRangeModule.d.ts.map