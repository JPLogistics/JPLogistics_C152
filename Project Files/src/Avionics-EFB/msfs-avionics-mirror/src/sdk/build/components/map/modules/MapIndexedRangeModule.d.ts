import { NumberUnitInterface, UnitFamily } from '../../../utils/math/NumberUnit';
import { Subject } from '../../../utils/Subject';
import { MapRangeModule } from './MapRangeModule';
/**
 * A module describing the nominal range of a map.
 */
export declare class MapIndexedRangeModule extends MapRangeModule {
    /** The index of the map nominal range. */
    readonly nominalRangeIndex: Subject<number>;
    /** The array of possible map nominal ranges. */
    readonly nominalRanges: Subject<readonly NumberUnitInterface<UnitFamily.Distance>[]>;
    /** @inheritdoc */
    constructor();
    /**
     * A callback which is called when the nominal range array changes.
     * @param array The new array.
     */
    private onNominalRangesChanged;
    /**
     * Sets the nominal range by index.
     * @param index The index of the new nominal range.
     * @returns The value of the new nominal range.
     * @throws Error if index of out of bounds.
     */
    setNominalRangeIndex(index: number): NumberUnitInterface<UnitFamily.Distance>;
}
//# sourceMappingURL=MapIndexedRangeModule.d.ts.map