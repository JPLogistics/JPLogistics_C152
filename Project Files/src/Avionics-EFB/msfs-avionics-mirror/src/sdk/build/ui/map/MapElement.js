/**
 * A common class for elements to be drawn on the map.
 */
export class MapElement {
    constructor() {
        this.gpsPosition = new Float64Array(2);
        this.screenPosition = new Float64Array(2);
        // TODO would be nicer using numbers
        this.id = '';
        this.isVisible = true;
    }
}
