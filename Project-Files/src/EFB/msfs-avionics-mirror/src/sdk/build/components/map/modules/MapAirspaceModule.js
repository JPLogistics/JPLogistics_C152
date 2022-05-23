import { Subject } from '../../..';
/**
 * A module describing the display of airspaces.
 */
export class MapAirspaceModule {
    /**
     * Constructor.
     * @param showTypes A map of this module's airspace show types to their associated nearest boundary search filter
     * bitflags.
     */
    constructor(showTypes) {
        this.showTypes = showTypes;
        this.show = {};
        for (const type in showTypes) {
            this.show[type] = Subject.create(false);
        }
    }
}
