import { Subject } from '../../../utils/Subject';
/**
 * A module describing properties of the own airplane icon.
 */
export class MapOwnAirplaneIconModule {
    constructor() {
        /** Whether to show the airplane icon. */
        this.show = Subject.create(true);
    }
}
