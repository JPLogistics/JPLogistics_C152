import { GeoPoint, Vec2Math, Vec3Math } from '../..';
import { MapAbstractAirspaceRenderer } from './MapAirspaceRenderer';
/**
 * An airspace renderer which renders airspace borders as a single line.
 */
export class MapSingleLineAirspaceRenderer extends MapAbstractAirspaceRenderer {
    /**
     * Constructor.
     * @param lineWidth The stroke width of the rendered airspace line.
     * @param strokeStyle The stroke style of the rendered airspace line.
     * @param dash The dash of the rendered airspace line.
     */
    constructor(lineWidth, strokeStyle, dash) {
        super();
        this.lineWidth = lineWidth;
        this.strokeStyle = strokeStyle;
        this.dash = dash;
    }
    /** @inheritdoc */
    renderShape(shape, projection, context, stream) {
        if (shape.length < 2) {
            return;
        }
        stream !== null && stream !== void 0 ? stream : (stream = context);
        stream.beginPath();
        const firstProjected = projection.project(shape[0].end, MapSingleLineAirspaceRenderer.vec2Cache[0]);
        stream.moveTo(firstProjected[0], firstProjected[1]);
        let start = shape[0].end;
        const len = shape.length;
        for (let i = 1; i < len; i++) {
            const vector = shape[i];
            const circle = vector.circle;
            if (circle) {
                if (circle.isGreatCircle()) {
                    this.pathGreatCircle(circle, start, vector.end, projection, stream);
                }
                else {
                    this.pathSmallCircle(circle, start, vector.end, projection, stream);
                }
            }
            else {
                const endProjected = projection.project(vector.end, MapSingleLineAirspaceRenderer.vec2Cache[0]);
                stream.moveTo(endProjected[0], endProjected[1]);
            }
            start = vector.end;
        }
        context.lineWidth = this.lineWidth;
        context.strokeStyle = this.strokeStyle;
        context.setLineDash(this.dash);
        context.stroke();
    }
    /**
     * Loads a projection of a great-circle path into a canvas rendering context.
     * @param circle The great circle defining the path.
     * @param start The start point of the path.
     * @param end The end point of the path.
     * @param projection The projection to use.
     * @param stream The path stream to which to load the projected path.
     */
    pathGreatCircle(circle, start, end, projection, stream) {
        const endProjected = projection.project(end, MapSingleLineAirspaceRenderer.vec2Cache[0]);
        stream.lineTo(endProjected[0], endProjected[1]);
    }
    /**
     * Loads a projection of a small-circle path into a canvas rendering context.
     * @param circle The small circle defining the path.
     * @param start The start point of the path.
     * @param end The end point of the path.
     * @param projection The projection to use.
     * @param stream The path stream to which to load the projected path.
     */
    pathSmallCircle(circle, start, end, projection, stream) {
        const center = MapSingleLineAirspaceRenderer.geoPointCache[0].setFromCartesian(circle.radius < Math.PI / 2 ? circle.center : Vec3Math.multScalar(circle.center, -1, MapSingleLineAirspaceRenderer.vec3Cache[0]));
        const centerProjected = projection.project(center, MapSingleLineAirspaceRenderer.vec2Cache[0]);
        const endProjected = projection.project(end, MapSingleLineAirspaceRenderer.vec2Cache[1]);
        if (start.equals(end)) {
            // draw a circle
            const radius = Vec2Math.distance(endProjected, centerProjected);
            const startAngle = Math.atan2(endProjected[1] - centerProjected[1], endProjected[0] - centerProjected[0]);
            stream.arc(centerProjected[0], centerProjected[1], radius, startAngle, startAngle + 2 * Math.PI);
            stream.moveTo(endProjected[0], endProjected[1]);
        }
        else {
            const startProjected = projection.project(start, MapSingleLineAirspaceRenderer.vec2Cache[2]);
            const startDelta = Vec2Math.sub(startProjected, centerProjected, MapSingleLineAirspaceRenderer.vec2Cache[3]);
            const startDeltaMag = Vec2Math.abs(startDelta);
            const endDelta = Vec2Math.sub(endProjected, centerProjected, MapSingleLineAirspaceRenderer.vec2Cache[4]);
            const endDeltaMag = Vec2Math.abs(endDelta);
            const radius = (startDeltaMag + endDeltaMag) / 2;
            const startAngle = Vec2Math.theta(startDelta);
            const arcStartX = centerProjected[0] + radius / startDeltaMag * startDelta[0];
            const arcStartY = centerProjected[1] + radius / startDeltaMag * startDelta[1];
            const endAngle = Vec2Math.theta(endDelta);
            const arcEndX = centerProjected[0] + radius / endDeltaMag * endDelta[0];
            const arcEndY = centerProjected[1] + radius / endDeltaMag * endDelta[1];
            stream.lineTo(arcStartX, arcStartY);
            stream.arc(centerProjected[0], centerProjected[1], radius, startAngle, endAngle, circle.radius < Math.PI / 2);
            stream.lineTo(arcEndX, arcEndY);
        }
    }
}
MapSingleLineAirspaceRenderer.geoPointCache = [new GeoPoint(0, 0)];
MapSingleLineAirspaceRenderer.vec2Cache = [new Float64Array(2), new Float64Array(2), new Float64Array(2), new Float64Array(2), new Float64Array(2)];
MapSingleLineAirspaceRenderer.vec3Cache = [new Float64Array(3)];
