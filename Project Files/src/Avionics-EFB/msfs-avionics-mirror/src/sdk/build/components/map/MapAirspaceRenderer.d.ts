import { GeoProjection, PathStream } from '../..';
import { LodBoundary, LodBoundaryShape } from '../../navigation';
/**
 * Renders an airspace to canvas.
 */
export interface MapAirspaceRenderer {
    /**
     * Renders an airspace to canvas.
     * @param airspace The airspace to render.
     * @param projection The projection to use when rendering.
     * @param context The canvas rendering context to which to render.
     * @param lod The LOD to render. Defaults to 0.
     * @param stream The path stream to which to render. If undefined, the path will be rendered directly to the canvas
     * rendering context.
     */
    render(airspace: LodBoundary, projection: GeoProjection, context: CanvasRenderingContext2D, lod?: number, stream?: PathStream): void;
}
/**
 * An airspace renderer which does not draw any graphics.
 */
export declare class NullAirspaceRenderer implements MapAirspaceRenderer {
    /** @inheritdoc */
    render(airspace: LodBoundary, projection: GeoProjection, context: CanvasRenderingContext2D, lod?: number, stream?: PathStream): void;
}
/**
 * An abstract implementation of MapAirspaceRenderer.
 */
export declare abstract class MapAbstractAirspaceRenderer implements MapAirspaceRenderer {
    /** @inheritdoc */
    render(airspace: LodBoundary, projection: GeoProjection, context: CanvasRenderingContext2D, lod?: number, stream?: PathStream): void;
    /**
     * Renders a single contiguous shape within an airspace.
     * @param shape The shape to render.
     * @param projection The projection to use when rendering.
     * @param context The canvas rendering context to which to render.
     * @param stream The path stream to which to render. If undefined, the path will be rendered directly to the canvas
     * rendering context.
     */
    protected abstract renderShape(shape: Readonly<LodBoundaryShape>, projection: GeoProjection, context: CanvasRenderingContext2D, stream?: PathStream): void;
}
//# sourceMappingURL=MapAirspaceRenderer.d.ts.map