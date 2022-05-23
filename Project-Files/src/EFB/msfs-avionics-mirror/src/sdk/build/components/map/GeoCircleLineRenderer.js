import { GeoCirclePathRenderer } from './GeoCirclePathRenderer';
/**
 * Renders arcs along geo circles as curved lines.
 */
export class GeoCircleLineRenderer {
    constructor() {
        this.pathRenderer = new GeoCirclePathRenderer();
    }
    /**
     * Renders an arc along a geo circle to a canvas.
     * @param circle The geo circle containing the arc to render.
     * @param startLat The latitude of the start of the arc, in degrees.
     * @param startLon The longitude of the start of the arc, in degrees.
     * @param endLat The latitude of the end of the arc, in degrees.
     * @param endLon The longitude of the end of the arc, in degrees.
     * @param context The canvas 2D rendering context to which to render.
     * @param streamStack The path stream stack to which to render.
     * @param width The width of the rendered line.
     * @param style The style of the rendered line.
     * @param dash The dash array of the rendered line. Defaults to no dash.
     */
    render(circle, startLat, startLon, endLat, endLon, context, streamStack, width, style, dash) {
        this.pathRenderer.render(circle, startLat, startLon, endLat, endLon, streamStack);
        context.lineWidth = width;
        context.strokeStyle = style;
        context.setLineDash(dash !== null && dash !== void 0 ? dash : GeoCircleLineRenderer.EMPTY_DASH);
        context.stroke();
    }
}
GeoCircleLineRenderer.EMPTY_DASH = [];
