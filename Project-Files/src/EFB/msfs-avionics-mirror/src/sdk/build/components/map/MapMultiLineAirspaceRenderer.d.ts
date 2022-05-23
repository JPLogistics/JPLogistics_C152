import { GeoProjection } from '../..';
import { LodBoundaryShape } from '../../navigation';
import { MapAbstractAirspaceRenderer } from './MapAirspaceRenderer';
import { PathStream } from '../../graphics/path';
/**
 * A projected airspace shape which can render its border as optionally offset lines.
 */
export interface MapMultiLineAirspaceShape {
    /**
     * Renders this shape's border with a line.
     * @param context The canvas rendering context to which to render.
     * @param offset The offset, in pixels, of the rendered line with respect to this shape's border. A positive offset
     * will shift the line outside of the border.
     * @param lineWidth The stroke width of the line to render.
     * @param strokeStyle The stroke style of the line to render.
     * @param dash The dash of the line to render.
     * @param stream The path stream to which to render. If undefined, the path will be rendered directly to the canvas
     * rendering context.
     */
    renderLine(context: CanvasRenderingContext2D, offset: number, lineWidth: number, strokeStyle: string | CanvasGradient | CanvasPattern, dash: number[], stream?: PathStream): void;
}
/**
 * An airspace renderer which supports rendering airspace borders as multiple, optionally offset lines.
 */
export declare abstract class MapMultiLineAirspaceRenderer extends MapAbstractAirspaceRenderer {
    private static tempShape?;
    /** @inheritdoc */
    protected renderShape(shape: Readonly<LodBoundaryShape>, projection: GeoProjection, context: CanvasRenderingContext2D, stream?: PathStream): void;
    /**
     * Renders a projected airspace shape with one or more lines.
     * @param shape The shape to render.
     * @param context The canvas rendering context to which to render.
     * @param stream The path stream to which to render. If undefined, the path will be rendered directly to the canvas
     * rendering context.
     */
    protected abstract renderLines(shape: MapMultiLineAirspaceShape, context: CanvasRenderingContext2D, stream?: PathStream): void;
}
//# sourceMappingURL=MapMultiLineAirspaceRenderer.d.ts.map