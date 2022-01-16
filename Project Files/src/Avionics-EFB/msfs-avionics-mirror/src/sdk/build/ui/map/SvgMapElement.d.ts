import { MapElement } from './MapElement';
/**
 * A common class for elements to be drawn on the map.
 */
export declare class SvgMapElement extends MapElement {
    private readonly parent;
    position: Float64Array;
    readonly div: HTMLElement;
    readonly svg: SVGElement;
    readonly svggrp: SVGGElement;
    private readonly svgimg;
    /**
     * Creates an instance of MapElement.
     * @param parent The HTML element that this element is a child of.
     */
    constructor(parent: HTMLElement);
    /**
     * Updates the map element.
     */
    update(): void;
    /**
     * Draws the map element.
     */
    draw(): void;
}
//# sourceMappingURL=SvgMapElement.d.ts.map