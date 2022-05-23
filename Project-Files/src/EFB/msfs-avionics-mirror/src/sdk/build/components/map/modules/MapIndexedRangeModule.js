import { UnitType } from '../../../math/NumberUnit';
import { Subject } from '../../../sub/Subject';
import { MapRangeModule } from './MapRangeModule';
/**
 * A module describing the nominal range of a map.
 */
export class MapIndexedRangeModule extends MapRangeModule {
    /** @inheritdoc */
    constructor() {
        super();
        /** The index of the map nominal range. */
        this.nominalRangeIndex = Subject.create(0);
        /** The array of possible map nominal ranges. */
        this.nominalRanges = Subject.create([UnitType.NMILE.createNumber(1)]);
        this.nominalRanges.sub(this.onNominalRangesChanged.bind(this));
    }
    /**
     * A callback which is called when the nominal range array changes.
     * @param array The new array.
     */
    onNominalRangesChanged(array) {
        const currentIndex = this.nominalRangeIndex.get();
        this.setNominalRangeIndex(Utils.Clamp(currentIndex, 0, array.length - 1));
    }
    /**
     * Sets the nominal range by index.
     * @param index The index of the new nominal range.
     * @returns The value of the new nominal range.
     * @throws Error if index of out of bounds.
     */
    setNominalRangeIndex(index) {
        const rangeArray = this.nominalRanges.get();
        if (index < 0 || index >= rangeArray.length) {
            throw new Error('Index out of bounds.');
        }
        const range = rangeArray[index];
        this.nominalRangeIndex.set(index);
        this.nominalRange.set(range);
        return range;
    }
}
