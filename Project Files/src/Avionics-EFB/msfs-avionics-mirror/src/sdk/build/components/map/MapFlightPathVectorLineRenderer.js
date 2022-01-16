import { GeoCircle } from '../..';
import { FlightPathUtils } from '../../flightplan';
import { MapGeoCircleLineRenderer } from './MapGeoCircleLineRenderer';
/**
 * Renders flight path vectors as a curved line.
 */
export class MapFlightPathVectorLineRenderer {
    /**
     * Constructor.
     * @param resampler The geodesic resampler used by this renderer.
     */
    constructor(resampler) {
        this.renderer = new MapGeoCircleLineRenderer(resampler);
    }
    /**
     * Renders a flight path vector to a canvas.
     * @param vector The flight path vector to render.
     * @param projection The projection to use when rendering.
     * @param context The canvas 2D rendering context to which to render.
     * @param stream The path stream to which to render.
     * @param width The width of the rendered line.
     * @param style The style of the rendered line.
     * @param dash The dash array of the rendered line. Defaults to no dash.
     */
    render(vector, projection, context, stream, width, style, dash) {
        const circle = FlightPathUtils.setGeoCircleFromVector(vector, MapFlightPathVectorLineRenderer.geoCircleCache[0]);
        this.renderer.render(circle, vector.startLat, vector.startLon, vector.endLat, vector.endLon, projection, context, stream, width, style, dash);
    }
}
MapFlightPathVectorLineRenderer.geoCircleCache = [new GeoCircle(new Float64Array(3), 0)];
