import { GeoCircle } from '../..';
import { FlightPathUtils } from '../../flightplan';
import { GeoCirclePatternRenderer } from './GeoCirclePatternRenderer';
/**
 * Renders flight path vectors as repeating patterns.
 */
export class FlightPathVectorPatternRenderer {
    constructor() {
        this.renderer = new GeoCirclePatternRenderer();
    }
    /**
     * Renders a flight path vector to a canvas.
     * @param vector The flight path vector to render.
     * @param context The canvas 2D rendering context to which to render.
     * @param streamStack The path stream to which to render.
     * @param pattern The pattern to render.
     * @param continuePath Whether to continue the previously rendered path. If true, a discontinuity in the rendered
     * path will not be inserted before the vector is rendered. This may lead to undesired artifacts if the previously
     * rendered path does not terminate at the point where the projected vector starts. Defaults to false.
     */
    render(vector, context, streamStack, pattern, continuePath = false) {
        const circle = FlightPathUtils.setGeoCircleFromVector(vector, FlightPathVectorPatternRenderer.geoCircleCache[0]);
        this.renderer.render(circle, vector.startLat, vector.startLon, vector.endLat, vector.endLon, context, streamStack, pattern, continuePath);
    }
}
FlightPathVectorPatternRenderer.geoCircleCache = [new GeoCircle(new Float64Array(3), 0)];
