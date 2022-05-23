import { ArraySubject, Subject } from '../../..';
import { BingComponent } from '../../bing';
import { AbstractMapModule } from './AbstractMapModule';
/**
 * A map data module that controls the terrain color reference point.
 */
export class MapColorsModule extends AbstractMapModule {
    constructor() {
        super(...arguments);
        /** The current map terrain colors reference point. */
        this.terrainReference = Subject.create(EBingReference.SEA);
        /** The current map colors array. */
        this.colors = ArraySubject.create(BingComponent.createEarthColorsArray('#0000FF', [
            {
                elev: 0,
                color: '#000000'
            },
            {
                elev: 60000,
                color: '#000000'
            }
        ]));
    }
}
