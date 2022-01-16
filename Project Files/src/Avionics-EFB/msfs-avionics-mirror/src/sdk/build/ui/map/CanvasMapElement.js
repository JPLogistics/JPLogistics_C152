import { MapElement } from './MapElement';
/**
 * A common class for elements to be drawn on the map.
 */
export class CanvasMapElement extends MapElement {
    /**
     * Updates the canvas map element.
     */
    update() {
        // noop
    }
    /**
     * Renders the map element to the canvas using the supplied context.
     * @param ctx The canvas context to render to.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    draw(ctx) {
        /** virtual */
    }
}
CanvasMapElement.img = new Image();
