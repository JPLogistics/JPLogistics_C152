import { GeoCircle } from '../..';
import { GeoProjectionPathStreamStack } from './GeoProjectionPathStreamStack';
/**
 * Renders arcs along geo circles to a path stream stack.
 */
export declare class GeoCirclePathRenderer {
    private static readonly NORTH_POLE_VEC;
    private static readonly geoPointCache;
    private static readonly vec3Cache;
    /**
     * Renders an arc along a geo circle to a path stream stack.
     * @param circle The geo circle containing the arc to render.
     * @param startLat The latitude of the start of the arc, in degrees.
     * @param startLon The longitude of the start of the arc, in degrees.
     * @param endLat The latitude of the end of the arc, in degrees.
     * @param endLon The longitude of the end of the arc, in degrees.
     * @param streamStack The path stream stack to which to render.
     * @param continuePath Whether to continue the previously rendered path. If true, a discontinuity in the rendered
     * path will not be inserted before the arc is rendered. This may lead to undesired artifacts if the previously
     * rendered path does not terminate at the point where the projected arc starts. Defaults to false.
     */
    render(circle: GeoCircle, startLat: number, startLon: number, endLat: number, endLon: number, streamStack: GeoProjectionPathStreamStack, continuePath?: boolean): void;
}
//# sourceMappingURL=GeoCirclePathRenderer.d.ts.map