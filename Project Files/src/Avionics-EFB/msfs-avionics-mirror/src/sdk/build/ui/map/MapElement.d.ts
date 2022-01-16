/**
 * A common class for elements to be drawn on the map.
 */
export declare abstract class MapElement {
    gpsPosition: Float64Array;
    screenPosition: Float64Array;
    id: string;
    isVisible: boolean;
    abstract update(): void;
    abstract draw(ctx: CanvasRenderingContext2D): void;
}
//# sourceMappingURL=MapElement.d.ts.map