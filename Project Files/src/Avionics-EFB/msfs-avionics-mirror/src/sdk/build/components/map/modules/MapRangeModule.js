import { UnitType } from '../../../utils/math/NumberUnit';
import { NumberUnitSubject } from '../../../utils/math/NumberUnitSubject';
/**
 * A module describing the nominal range of a map.
 */
export class MapRangeModule {
    constructor() {
        this.nominalRange = NumberUnitSubject.createFromNumberUnit(UnitType.NMILE.createNumber(1));
    }
}
