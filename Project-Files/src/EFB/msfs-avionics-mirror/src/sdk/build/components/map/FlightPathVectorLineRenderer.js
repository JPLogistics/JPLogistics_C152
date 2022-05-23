import { GeoCircle } from '../..';
import { FlightPathUtils } from '../../flightplan';
import { GeoCircleLineRenderer } from './GeoCircleLineRenderer';
/**
 * Renders flight path vectors as a curved line.
 */
export class FlightPathVectorLineRenderer {
    constructor() {
        this.renderer = new GeoCircleLineRenderer();
    }
    /**
     * Renders a flight path vector to a canvas.
     * @param vector The flight path vector to render.
     * @param context The canvas 2D rendering context to which to render.
     * @param streamStack The path stream to which to render.
     * @param width The width of the rendered line.
     * @param style The style of the rendered line.
     * @param dash The dash array of the rendered line. Defaults to no dash.
     */
    render(vector, context, streamStack, width, style, dash) {
        const circle = FlightPathUtils.setGeoCircleFromVector(vector, FlightPathVectorLineRenderer.geoCircleCache[0]);
        this.renderer.render(circle, vector.startLat, vector.startLon, vector.endLat, vector.endLon, context, streamStack, width, style, dash);
    }
}
FlightPathVectorLineRenderer.geoCircleCache = [new GeoCircle(new Float64Array(3), 0)];
