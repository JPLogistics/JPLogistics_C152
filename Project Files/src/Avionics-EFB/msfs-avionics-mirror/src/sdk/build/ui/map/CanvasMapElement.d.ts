import { MapElement } from './MapElement';
/**
 * A common class for elements to be drawn on the map.
 */
export declare class CanvasMapElement extends MapElement {
    static img: HTMLImageElement;
    /**
     * Updates the canvas map element.
     */
    update(): void;
    /**
     * Renders the map element to the canvas using the supplied context.
     * @param ctx The canvas context to render to.
     */
    draw(ctx: CanvasRenderingContext2D): void;
}
//# sourceMappingURL=CanvasMapElement.d.ts.map