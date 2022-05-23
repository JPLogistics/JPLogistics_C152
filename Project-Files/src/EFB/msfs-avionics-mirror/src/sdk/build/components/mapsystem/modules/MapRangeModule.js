import { UnitType } from '../../../math/NumberUnit';
import { NumberUnitSubject } from '../../../math/NumberUnitSubject';
import { MapSystemContext } from '../MapSystemContext';
import { AbstractMapModule } from './AbstractMapModule';
/**
 * A module describing the nominal range of a map.
 */
export class MapRangeModule extends AbstractMapModule {
    /**
     * Creates an instance of a MapRangeModule.
     * @param mapSystemContext The map system context to use with this instance.
     */
    constructor(mapSystemContext = MapSystemContext.Empty) {
        super(mapSystemContext);
        /** The range of the map as a number unit. */
        this.nominalRange = NumberUnitSubject.createFromNumberUnit(UnitType.NMILE.createNumber(1));
        this.projectionParams = {
            range: this.nominalRange.get().asUnit(UnitType.GA_RADIAN)
        };
        this.rangeHandler = (range) => {
            this.projectionParams.range = range.asUnit(UnitType.GA_RADIAN);
            this.mapSystemContext.projection.setQueued(this.projectionParams);
        };
    }
    /** @inheritdoc */
    startSync() {
        this.nominalRange.sub(this.rangeHandler, true);
    }
    /** @inheritdoc */
    stopSync() {
        this.nominalRange.unsub(this.rangeHandler);
    }
}
