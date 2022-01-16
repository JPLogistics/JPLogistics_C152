import { GeoPoint, Vec2Math, Vec3Math } from '../..';
import { Transform2D } from '../../utils/math/Transform2D';
import { MapAbstractAirspaceRenderer } from './MapAirspaceRenderer';
/**
 * An airspace renderer which supports rendering airspace borders as multiple, optionally offset lines.
 */
export class MapMultiLineAirspaceRenderer extends MapAbstractAirspaceRenderer {
    /** @inheritdoc */
    renderShape(shape, projection, context, stream) {
        var _a;
        if (shape.length < 2) {
            return;
        }
        const multiLineShape = (_a = MapMultiLineAirspaceRenderer.tempShape) !== null && _a !== void 0 ? _a : (MapMultiLineAirspaceRenderer.tempShape = new Shape());
        multiLineShape.build(shape, projection);
        this.renderLines(multiLineShape, context, stream);
    }
}
/**
 * An implementation of MapMultiLineAirspaceShape.
 */
class Shape {
    constructor() {
        this.segments = [];
        this.length = 0;
        this.isClosed = false;
        this.windingOrder = 1;
    }
    /**
     * Builds this shape from a single contiguous airspace shape. Erases the current state of this shape.
     * @param shape An airspace shape.
     * @param projection The projection to use.
     */
    build(shape, projection) {
        if (shape.length < 2) {
            return;
        }
        this.buildSegments(shape, projection);
        // calculate winding order
        let signedArea = 0;
        let prev = this.segments[0];
        for (let i = 1; i < this.length; i++) {
            const segment = this.segments[i];
            signedArea += this.calculateSignedArea(segment, prev);
            prev = segment;
        }
        const first = this.segments[0].end;
        const last = this.segments[this.length - 1].end;
        this.isClosed = Vec2Math.equals(first, last);
        // if the path is not closed, we need to close the path to calculate a pseudo-winding order
        if (!this.isClosed) {
            signedArea += last[0] * first[1] - first[0] * last[1];
        }
        this.windingOrder = signedArea >= 0 ? 1 : -1;
        this.calculateVertices();
    }
    /**
     * Builds this shape's segments from a single contiguous airspace shape.
     * @param shape An airspace shape.
     * @param projection The projection to use.
     */
    buildSegments(shape, projection) {
        this.buildStartSegment(projection, 0, shape[0]);
        let start = shape[0].end;
        // project all points and calculate winding order
        this.length = shape.length;
        for (let i = 1; i < this.length; i++) {
            const vector = shape[i];
            this.buildSegment(projection, i, vector, start);
            start = vector.end;
        }
    }
    /**
     * Builds a single segment from an airspace shape vector.
     * @param projection The projection to use.
     * @param index The index of the segment to build.
     * @param vector An airspace shape vector.
     * @param start The start point of the airspace shape vector.
     */
    buildSegment(projection, index, vector, start) {
        const circle = vector.circle;
        if (circle) {
            if (circle.isGreatCircle()) {
                this.buildSegmentFromGreatCircle(projection, index, circle, start, vector.end);
            }
            else {
                this.buildSegmentFromSmallCircle(projection, index, circle, start, vector.end);
            }
        }
        else {
            this.buildStartSegment(projection, index, vector);
        }
    }
    /**
     * Builds a start segment from an airspace shape vector.
     * @param projection The projection to use.
     * @param index The index of the segment to build.
     * @param vector An airspace shape vector.
     */
    buildStartSegment(projection, index, vector) {
        var _a;
        var _b;
        const segment = ((_a = (_b = this.segments)[index]) !== null && _a !== void 0 ? _a : (_b[index] = Shape.createSegment()));
        segment.type = 'start';
        projection.project(vector.end, segment.end);
    }
    /**
     * Builds a segment from a great-circle path.
     * @param projection The projection to use.
     * @param index The index of the segment to build.
     * @param circle The great circle which defines the path.
     * @param start The start point of the path.
     * @param end The end point of the path.
     */
    buildSegmentFromGreatCircle(projection, index, circle, start, end) {
        var _a;
        var _b;
        const segment = ((_a = (_b = this.segments)[index]) !== null && _a !== void 0 ? _a : (_b[index] = Shape.createSegment()));
        segment.type = 'line';
        projection.project(end, segment.end);
        const delta = Vec2Math.sub(segment.end, this.segments[index - 1].end, Shape.vec2Cache[0]);
        Vec2Math.normalize(Vec2Math.normal(delta, segment.endNormal), segment.endNormal);
    }
    /**
     * Builds a segment from a small-circle path.
     * @param projection The projection to use.
     * @param index The index of the segment to build.
     * @param circle The small circle which defines the path.
     * @param start The start point of the path.
     * @param end The end point of the path.
     */
    buildSegmentFromSmallCircle(projection, index, circle, start, end) {
        var _a;
        var _b;
        const isClockwise = circle.radius > Math.PI / 2;
        const center = Shape.geoPointCache[0].setFromCartesian(isClockwise ? Vec3Math.multScalar(circle.center, -1, Shape.vec3Cache[0]) : circle.center);
        const startProjected = this.segments[index - 1].end;
        const centerProjected = projection.project(center, Shape.vec2Cache[0]);
        const endProjected = projection.project(end, Shape.vec2Cache[1]);
        const startRadial = Vec2Math.sub(startProjected, centerProjected, Shape.vec2Cache[2]);
        const startRadialMag = Vec2Math.abs(startRadial);
        const endRadial = Vec2Math.sub(endProjected, centerProjected, Shape.vec2Cache[3]);
        const endRadialMag = Vec2Math.abs(endRadial);
        const radius = (startRadialMag + endRadialMag) / 2;
        const segment = ((_a = (_b = this.segments)[index]) !== null && _a !== void 0 ? _a : (_b[index] = Shape.createSegment()));
        segment.type = 'arc';
        segment.radius = radius;
        segment.isClockwise = isClockwise;
        Vec2Math.copy(centerProjected, segment.center);
        Vec2Math.copy(endProjected, segment.end);
        Vec2Math.normalize(startRadial, segment.startNormal);
        Vec2Math.normalize(endRadial, segment.endNormal);
    }
    /**
     * Calculates the doubled signed area of a segment.
     * @param segment A segment.
     * @param prevSegment The segment immediately preceding `segment`.
     * @returns Twice the signed area of the segment.
     */
    calculateSignedArea(segment, prevSegment) {
        if (segment.type === 'start') {
            return 0;
        }
        if (segment.type === 'line') {
            return prevSegment.end[0] * segment.end[1] - segment.end[0] * prevSegment.end[1];
        }
        // arc
        const startRadial = Vec2Math.sub(prevSegment.end, segment.center, Shape.vec2Cache[0]);
        const startTheta = Vec2Math.theta(startRadial);
        const endRadial = Vec2Math.sub(segment.end, segment.center, Shape.vec2Cache[1]);
        const endTheta = Vec2Math.theta(endRadial);
        const angularWidth = Shape.getAngularWidth(startTheta, endTheta, segment.isClockwise, true);
        return prevSegment.end[0] * segment.center[1] - segment.center[0] * prevSegment.end[1]
            + segment.center[0] * segment.end[1] - segment.end[0] * segment.center[1]
            + angularWidth * segment.radius * segment.radius * (segment.isClockwise ? 1 : -1);
    }
    /**
     * Calculates vertex data for this shape.
     */
    calculateVertices() {
        const max = this.isClosed ? this.length - 1 : this.length;
        for (let i = 0; i < this.length; i++) {
            //const prev = isClosed ? (i + max - 2) % max + 1 : (i + max - 1) % max;
            const next = this.isClosed ? i % max + 1 : (i + 1) % max;
            this.calculateVertex(i, next);
        }
    }
    /**
     * Calculates data for a vertex.
     * @param currIndex The index of the segment leading to the vertex to calculate.
     * @param nextIndex The index of the segment leading away from the vertex to calculate.
     */
    calculateVertex(currIndex, nextIndex) {
        const curr = this.segments[currIndex];
        const next = this.segments[nextIndex];
        if (curr.type === 'start' && next.type === 'start') {
            curr.vertex.type = 'null';
            curr.vertex.fromIndex = currIndex;
            curr.vertex.toIndex = nextIndex;
        }
        else if (curr.type === 'start' && next.type === 'line') {
            this.calculateLineStartVertex(currIndex, nextIndex, true);
        }
        else if (curr.type === 'line' && next.type === 'start') {
            this.calculateLineStartVertex(currIndex, nextIndex, false);
        }
        else if (curr.type === 'start' && next.type === 'arc') {
            this.calculateArcStartVertex(currIndex, nextIndex, true);
        }
        else if (curr.type === 'arc' && next.type === 'start') {
            this.calculateArcStartVertex(currIndex, nextIndex, false);
        }
        else if (curr.type === 'line' && next.type === 'line') {
            this.calculateLineLineVertex(currIndex, nextIndex);
        }
        else if (curr.type === 'line' && next.type === 'arc') {
            this.calculateLineArcVertex(currIndex, nextIndex, false);
        }
        else if (curr.type === 'arc' && next.type === 'line') {
            this.calculateLineArcVertex(currIndex, nextIndex, true);
        }
        else {
            this.calculateArcArcVertex(currIndex, nextIndex);
        }
    }
    /**
     * Calculates data for a vertex connecting a line segment with a start segment.
     * @param currIndex The index of the segment leading to the vertex to calculate.
     * @param nextIndex The index of the segment leading away from the vertex to calculate.
     * @param isStartFirst Whether the start segment leads to the vertex.
     */
    calculateLineStartVertex(currIndex, nextIndex, isStartFirst) {
        const line = this.segments[isStartFirst ? nextIndex : currIndex];
        const vertex = this.segments[currIndex].vertex;
        vertex.type = 'line-start';
        vertex.fromIndex = currIndex;
        vertex.toIndex = nextIndex;
        Vec2Math.multScalar(line.endNormal, this.windingOrder, vertex.normal);
    }
    /**
     * Calculates data for a vertex connecting an arc segment with a start segment.
     * @param currIndex The index of the segment leading to the vertex to calculate.
     * @param nextIndex The index of the segment leading away from the vertex to calculate.
     * @param isStartFirst Whether the start segment leads to the vertex.
     */
    calculateArcStartVertex(currIndex, nextIndex, isStartFirst) {
        const arc = this.segments[isStartFirst ? nextIndex : currIndex];
        const vertex = this.segments[currIndex].vertex;
        vertex.type = 'arc-start';
        vertex.fromIndex = currIndex;
        vertex.toIndex = nextIndex;
        const arcNormal = isStartFirst ? arc.startNormal : arc.endNormal;
        Vec2Math.multScalar(arcNormal, this.windingOrder * (arc.isClockwise ? 1 : -1), vertex.normal);
    }
    /**
     * Calculates data for a vertex connecting two line segments.
     * @param currIndex The index of the segment leading to the vertex to calculate.
     * @param nextIndex The index of the segment leading away from the vertex to calculate.
     */
    calculateLineLineVertex(currIndex, nextIndex) {
        const curr = this.segments[currIndex];
        const next = this.segments[nextIndex];
        const vertex = curr.vertex;
        vertex.type = 'line-line';
        vertex.fromIndex = currIndex;
        vertex.toIndex = nextIndex;
        Vec2Math.normalize(Vec2Math.multScalar(Vec2Math.add(curr.endNormal, next.endNormal, vertex.normal), this.windingOrder, vertex.normal), vertex.normal);
        // scale the vertex normal unit vector to adjust for angle between the two joining lines (the closer the angle to
        // 0, the farther the point of intersection of offset lines lies to the vertex)
        const deltaUnit = Vec2Math.normalize(Vec2Math.sub(next.end, curr.end, Shape.vec2Cache[0]), Shape.vec2Cache[0]);
        const scaleFactor = Math.abs(1 / (vertex.normal[0] * deltaUnit[1] - vertex.normal[1] * deltaUnit[0]));
        Vec2Math.multScalar(vertex.normal, scaleFactor, vertex.normal);
    }
    /**
     * Calculates data for a vertex connecting an arc segment with an arc segment.
     * @param currIndex The index of the segment leading to the vertex to calculate.
     * @param nextIndex The index of the segment leading away from the vertex to calculate.
     * @param isArcFirst Whether the arc segment leads to the vertex.
     */
    calculateLineArcVertex(currIndex, nextIndex, isArcFirst) {
        const curr = this.segments[currIndex];
        const line = this.segments[isArcFirst ? nextIndex : currIndex];
        const arc = this.segments[isArcFirst ? currIndex : nextIndex];
        const end = curr.end;
        const vertex = curr.vertex;
        vertex.type = 'line-arc';
        vertex.fromIndex = currIndex;
        vertex.toIndex = nextIndex;
        vertex.arcOffsetSign = this.windingOrder * (arc.isClockwise ? 1 : -1);
        // find the transformation that translates the center of the arc to (0, 0) and rotates the line such that it is
        // parallel to the x-axis and places the intersection point in the positive x range.
        const centerEndDelta = Vec2Math.sub(isArcFirst ? arc.end : line.end, arc.center, Shape.vec2Cache[0]);
        const dot = centerEndDelta[1] * line.endNormal[0] - centerEndDelta[0] * line.endNormal[1];
        const theta = Vec2Math.theta(line.endNormal) + (dot >= 0 ? Math.PI / 2 : -Math.PI / 2);
        const translation = Shape.transformCache[0].toTranslation(-arc.center[0], -arc.center[1]);
        const rotation = Shape.transformCache[1].toRotation(-theta);
        Transform2D.concat(vertex.transform, translation, rotation);
        vertex.r0 = arc.radius;
        vertex.y0 = vertex.transform.apply(end, Shape.vec2Cache[0])[1];
        vertex.lineOffsetSign = (rotation.apply(line.endNormal, Shape.vec2Cache[0])[1] >= 0 ? this.windingOrder : -this.windingOrder);
        vertex.transform.invert();
    }
    /**
     * Calculates data for a vertex connecting two arc segments.
     * @param currIndex The index of the segment leading to the vertex to calculate.
     * @param nextIndex The index of the segment leading away from the vertex to calculate.
     */
    calculateArcArcVertex(currIndex, nextIndex) {
        const curr = this.segments[currIndex];
        const next = this.segments[nextIndex];
        const vertex = curr.vertex;
        vertex.type = 'arc-arc';
        vertex.fromIndex = currIndex;
        vertex.toIndex = nextIndex;
        // find the transformation that translates the center of the current arc to (0, 0) and rotates the next arc such
        // that its center lies on the x-axis and places the intersection point in the positive y range.
        const centerDelta = Vec2Math.sub(next.center, curr.center, Shape.vec2Cache[0]);
        const centerEndDelta = Vec2Math.sub(curr.end, curr.center, Shape.vec2Cache[1]);
        const dot = centerDelta[0] * centerEndDelta[1] - centerDelta[1] * centerEndDelta[0];
        const theta = Vec2Math.theta(centerDelta) + (dot >= 0 ? 0 : Math.PI);
        Transform2D.concat(vertex.transform, Shape.transformCache[0].toTranslation(-curr.center[0], -curr.center[1]), Shape.transformCache[1].toRotation(-theta));
        vertex.d = vertex.transform.apply(next.center, Shape.vec2Cache[0])[0];
        vertex.arcOffsetSign = this.windingOrder * (curr.isClockwise ? 1 : -1);
        vertex.arc2OffsetSign = this.windingOrder * (next.isClockwise ? 1 : -1);
        vertex.transform.invert();
    }
    /** @inheritdoc */
    renderLine(context, offset, lineWidth, strokeStyle, dash, stream) {
        stream !== null && stream !== void 0 ? stream : (stream = context);
        stream.beginPath();
        const startPoint = Vec2Math.set(0, 0, Shape.vec2Cache[0]);
        if (this.isClosed) {
            // if the shape is closed, we need to initialize the first start point to the end point of the last segment
            if (offset === 0) {
                Vec2Math.copy(this.segments[0].end, startPoint);
            }
            else {
                const lastIndex = this.length - 1;
                const result = this.calculateOffsetVertex(lastIndex, offset, startPoint);
                if (!result || Shape.isPointInSegmentBounds(this.segments[lastIndex], this.segments[lastIndex - 1].end, result)) {
                    this.calculateOffsetEndPoint(lastIndex, offset, startPoint);
                }
            }
            stream.moveTo(startPoint[0], startPoint[1]);
        }
        for (let i = this.isClosed ? 1 : 0; i < this.length; i++) {
            const segment = this.segments[i];
            let newStartPoint;
            switch (segment.type) {
                case 'start':
                    newStartPoint = this.pathStartSegment(stream, i, offset);
                    break;
                case 'line':
                    newStartPoint = this.pathLineSegment(stream, i, startPoint, offset);
                    break;
                case 'arc':
                    newStartPoint = this.pathArcSegment(stream, i, startPoint, offset);
                    break;
            }
            Vec2Math.copy(newStartPoint, startPoint);
        }
        context.lineWidth = lineWidth;
        context.strokeStyle = strokeStyle;
        context.setLineDash(dash);
        context.stroke();
    }
    /**
     * Loads a path for a start segment to a canvas rendering context.
     * @param stream The path stream to which to load the path.
     * @param index The index of the start segment.
     * @param offset The offset of the path from the segment, in pixels.
     * @returns The end point of the loaded path.
     */
    pathStartSegment(stream, index, offset) {
        const segment = this.segments[index];
        if (offset === 0) {
            stream.moveTo(segment.end[0], segment.end[1]);
            return segment.end;
        }
        else {
            const offsetEnd = this.calculateOffsetVertex(index, offset, Shape.vec2Cache[1]);
            if (offsetEnd) {
                stream.moveTo(offsetEnd[0], offsetEnd[1]);
                return offsetEnd;
            }
            else {
                stream.moveTo(segment.end[0], segment.end[1]);
                return segment.end;
            }
        }
    }
    /**
     * Loads a path for a line segment to a canvas rendering context.
     * @param stream The path stream to which to load the path.
     * @param index The index of the line segment.
     * @param start The start point of the line segment.
     * @param offset The offset of the path from the segment, in pixels.
     * @returns The end point of the loaded path.
     */
    pathLineSegment(stream, index, start, offset) {
        const segment = this.segments[index];
        if (offset !== 0 && !Shape.isPointInSegmentBounds(segment, this.segments[index - 1].end, start)) {
            const startPoint = this.calculateOffsetStartPoint(index, offset, Shape.vec2Cache[1]);
            stream.moveTo(startPoint[0], startPoint[1]);
        }
        if (offset === 0) {
            stream.lineTo(segment.end[0], segment.end[1]);
            return segment.end;
        }
        else {
            const offsetEnd = this.calculateOffsetVertex(index, offset, Shape.vec2Cache[1]);
            if (offsetEnd && Shape.isPointInSegmentBounds(segment, this.segments[index - 1].end, offsetEnd)) {
                stream.lineTo(offsetEnd[0], offsetEnd[1]);
                return offsetEnd;
            }
            else {
                const endPoint = this.calculateOffsetEndPoint(index, offset, Shape.vec2Cache[1]);
                stream.lineTo(endPoint[0], endPoint[1]);
                const nextStartPoint = this.calculateOffsetStartPoint(segment.vertex.toIndex, offset, Shape.vec2Cache[1]);
                stream.moveTo(nextStartPoint[0], nextStartPoint[1]);
                return nextStartPoint;
            }
        }
    }
    /**
     * Loads a path for an arc segment to a canvas rendering context.
     * @param stream The path stream to which to load the path.
     * @param index The index of the arc segment.
     * @param start The start point of the arc segment.
     * @param offset The offset of the path from the segment, in pixels.
     * @returns The end point of the loaded path.
     */
    pathArcSegment(stream, index, start, offset) {
        const segment = this.segments[index];
        let startAngle;
        if (offset !== 0 && !Shape.isPointInSegmentBounds(segment, this.segments[index - 1].end, start)) {
            const startPoint = this.calculateOffsetStartPoint(index, offset, Shape.vec2Cache[1]);
            stream.moveTo(startPoint[0], startPoint[1]);
            startAngle = Math.atan2(startPoint[1] - segment.center[1], startPoint[0] - segment.center[0]);
        }
        else {
            startAngle = Math.atan2(start[1] - segment.center[1], start[0] - segment.center[0]);
        }
        if (offset === 0) {
            const endAngle = Vec2Math.theta(segment.endNormal);
            const angularWidth = Shape.getAngularWidth(startAngle, endAngle, segment.isClockwise, true);
            stream.arc(segment.center[0], segment.center[1], segment.radius, startAngle, startAngle + angularWidth * (segment.isClockwise ? 1 : -1), !segment.isClockwise);
            return segment.end;
        }
        else {
            const baseEndAngle = Vec2Math.theta(segment.endNormal);
            const baseAngularWidth = Shape.getAngularWidth(startAngle, baseEndAngle, segment.isClockwise, true);
            const sign = this.windingOrder * (segment.isClockwise ? 1 : -1);
            const radius = segment.radius + offset * sign;
            const offsetEnd = this.calculateOffsetVertex(index, offset, Shape.vec2Cache[1]);
            if (offsetEnd && Shape.isPointInSegmentBounds(segment, this.segments[index - 1].end, offsetEnd)) {
                const endAngle = Math.atan2(offsetEnd[1] - segment.center[1], offsetEnd[0] - segment.center[0]);
                const angularWidth = Shape.getAngularWidth(startAngle, endAngle, segment.isClockwise, true);
                const angularWidthDiff = Math.abs(angularWidth - baseAngularWidth);
                stream.arc(segment.center[0], segment.center[1], radius, startAngle, startAngle + angularWidth * (segment.isClockwise ? 1 : -1), angularWidthDiff < Math.PI ? !segment.isClockwise : segment.isClockwise);
                return offsetEnd;
            }
            else {
                if (radius > 0) {
                    const endPoint = this.calculateOffsetEndPoint(index, offset, Shape.vec2Cache[1]);
                    const endAngle = Math.atan2(endPoint[1] - segment.center[1], endPoint[0] - segment.center[0]);
                    const angularWidth = Shape.getAngularWidth(startAngle, endAngle, segment.isClockwise, true);
                    const angularWidthDiff = Math.abs(angularWidth - baseAngularWidth);
                    stream.arc(segment.center[0], segment.center[1], radius, startAngle, startAngle + angularWidth * (segment.isClockwise ? 1 : -1), angularWidthDiff < Math.PI ? !segment.isClockwise : segment.isClockwise);
                    const nextStartPoint = this.calculateOffsetStartPoint(segment.vertex.toIndex, offset, Shape.vec2Cache[1]);
                    stream.moveTo(nextStartPoint[0], nextStartPoint[1]);
                    return nextStartPoint;
                }
                else {
                    stream.moveTo(segment.center[0], segment.center[1]);
                    return segment.center;
                }
            }
        }
    }
    /**
     * Calculates an offset point for a vertex.
     * @param index The index of the segment leading to the vertex to offset.
     * @param offset The offset to apply, in pixels.
     * @param out The vector to which to write the result.
     * @returns The offset vertex point, or undefined if one could not be calculated.
     */
    calculateOffsetVertex(index, offset, out) {
        const vertex = this.segments[index].vertex;
        switch (vertex.type) {
            case 'line-start':
            case 'arc-start':
            case 'line-line':
                return this.calculateOffsetVertexFromNormal(index, offset, out);
            case 'line-arc':
                return this.calculateOffsetLineArcVertex(index, offset, out);
            case 'arc-arc':
                return this.calculateOffsetArcArcVertex(index, offset, out);
            default:
                return Vec2Math.copy(this.segments[vertex.fromIndex].end, out);
        }
    }
    /**
     * Calculates an offset point for a vertex which defines a normal vector.
     * @param index The index of the segment leading to the vertex to offset.
     * @param offset The offset to apply, in pixels.
     * @param out The vector to which to write the result.
     * @returns The offset vertex point, or undefined if one could not be calculated.
     */
    calculateOffsetVertexFromNormal(index, offset, out) {
        const segment = this.segments[index];
        const vertex = segment.vertex;
        return Vec2Math.add(segment.end, Vec2Math.multScalar(vertex.normal, offset, out), out);
    }
    /**
     * Calculates an offset point for a vertex which connects a line segment with an arc segment.
     * @param index The index of the segment leading to the vertex to offset.
     * @param offset The offset to apply, in pixels.
     * @param out The vector to which to write the result.
     * @returns The offset vertex point, or undefined if one could not be calculated.
     */
    calculateOffsetLineArcVertex(index, offset, out) {
        const vertex = this.segments[index].vertex;
        const radius = vertex.r0 + offset * vertex.arcOffsetSign;
        if (radius <= 0) {
            return undefined;
        }
        const y = vertex.y0 + offset * vertex.lineOffsetSign;
        const xSq = radius * radius - y * y;
        if (xSq < 0) {
            return undefined;
        }
        const x = Math.sqrt(xSq);
        return vertex.transform.apply(Vec2Math.set(x, y, out), out);
    }
    /**
     * Calculates an offset point for a vertex which connects two arc segments.
     * @param index The index of the segment leading to the vertex to offset.
     * @param offset The offset to apply, in pixels.
     * @param out The vector to which to write the result.
     * @returns The offset vertex point, or undefined if one could not be calculated.
     */
    calculateOffsetArcArcVertex(index, offset, out) {
        const vertex = this.segments[index].vertex;
        if (vertex.d === 0) {
            return undefined;
        }
        const segment1 = this.segments[vertex.fromIndex];
        const segment2 = this.segments[vertex.toIndex];
        const radius1 = segment1.radius + offset * vertex.arcOffsetSign;
        const radius2 = segment2.radius + offset * vertex.arc2OffsetSign;
        if (radius1 <= 0 || radius2 <= 0) {
            return undefined;
        }
        const dSq = vertex.d * vertex.d;
        const radius1Sq = radius1 * radius1;
        const radius2Sq = radius2 * radius2;
        const x = (dSq - radius2Sq + radius1Sq) / (2 * vertex.d);
        const ySq = radius1Sq - x * x;
        if (ySq < 0) {
            return undefined;
        }
        const y = Math.sqrt(ySq);
        return vertex.transform.apply(Vec2Math.set(x, y, out), out);
    }
    /**
     * Calculates an offset start point for a segment.
     * @param index The index of the segment to offset.
     * @param offset The offset to apply, in pixels.
     * @param out The vector to which to write the result.
     * @returns The offset start point.
     */
    calculateOffsetStartPoint(index, offset, out) {
        const prevSegment = this.segments[index - 1];
        const segment = this.segments[index];
        switch (segment.type) {
            case 'start':
                return Vec2Math.copy(segment.end, out);
            case 'line':
                return Vec2Math.set(prevSegment.end[0] + segment.endNormal[0] * this.windingOrder * offset, prevSegment.end[1] + segment.endNormal[1] * this.windingOrder * offset, out);
            case 'arc': {
                const sign = this.windingOrder * (segment.isClockwise ? 1 : -1);
                return Vec2Math.set(prevSegment.end[0] + segment.startNormal[0] * sign * offset, prevSegment.end[1] + segment.startNormal[1] * sign * offset, out);
            }
        }
    }
    /**
     * Calculates an offset end point for a segment.
     * @param index The index of the segment to offset.
     * @param offset The offset to apply, in pixels.
     * @param out The vector to which to write the result.
     * @returns The offset end point.
     */
    calculateOffsetEndPoint(index, offset, out) {
        const segment = this.segments[index];
        switch (segment.type) {
            case 'start':
                return Vec2Math.copy(segment.end, out);
            case 'line':
                return Vec2Math.set(segment.end[0] + segment.endNormal[0] * this.windingOrder * offset, segment.end[1] + segment.endNormal[1] * this.windingOrder * offset, out);
            case 'arc': {
                const sign = this.windingOrder * (segment.isClockwise ? 1 : -1);
                return Vec2Math.set(segment.end[0] + segment.endNormal[0] * sign * offset, segment.end[1] + segment.endNormal[1] * sign * offset, out);
            }
        }
    }
    /**
     * Checks whether a point lies within the bounds of a segment. If the segment is a start segment, all points are
     * considered to be in bounds. If the segment is a line or arc segment, a point is in bounds if and only if its
     * projection on the line or arc lies within the start and end points of the segment.
     * @param segment A segment.
     * @param start The start point of the segment.
     * @param point The query point.
     * @returns Whether the point lies within the bounds of the segment.
     */
    static isPointInSegmentBounds(segment, start, point) {
        if (segment.type === 'start') {
            return true;
        }
        if (segment.type === 'line') {
            const lineDeltaX = segment.end[0] - start[0];
            const lineDeltaY = segment.end[1] - start[1];
            const startDeltaX = point[0] - start[0];
            const startDeltaY = point[1] - start[1];
            const endDeltaX = point[0] - segment.end[0];
            const endDeltaY = point[1] - segment.end[1];
            const startDot = startDeltaX * lineDeltaX + startDeltaY * lineDeltaY;
            const endDot = endDeltaX * lineDeltaX + endDeltaY * lineDeltaY;
            return startDot >= 0 && endDot <= 0;
        }
        // arc
        const startAngle = Vec2Math.theta(segment.startNormal);
        const endAngle = Vec2Math.theta(segment.endNormal);
        const angularWidth = Shape.getAngularWidth(startAngle, endAngle, segment.isClockwise, true);
        const pointAngle = Math.atan2(point[1] - segment.center[1], point[0] - segment.center[0]);
        const angleDiff = Shape.getAngularWidth(startAngle, pointAngle, segment.isClockwise);
        return angleDiff <= angularWidth;
    }
    /**
     * Gets the angle subtended by an arc.
     * @param startAngle The radial angle of the arc's start point.
     * @param endAngle The radial angle of the arc's end point.
     * @param isClockwise Whether the arc runs clockwise.
     * @param zeroIsCircle Whether to consider a zero-angular-width arc to be a full circle. False by default.
     * @param zeroTolerance The tolerance of the zero-angular-width check used when `zeroIsCircle` is true. Defaults to
     * 1e-6.
     * @returns The angle subtended by the arc, in radians.
     */
    static getAngularWidth(startAngle, endAngle, isClockwise, zeroIsCircle = false, zeroTolerance = 1e-6) {
        const width = ((isClockwise ? endAngle - startAngle : startAngle - endAngle) + 2 * Math.PI) % (2 * Math.PI);
        return zeroIsCircle && Math.min(width, 2 * Math.PI - width) < zeroTolerance ? 2 * Math.PI : width;
    }
    /**
     * Creates a new segment.
     * @returns A new segment.
     */
    static createSegment() {
        return {
            type: 'arc',
            center: new Float64Array(2),
            radius: 0,
            isClockwise: false,
            end: new Float64Array(2),
            endNormal: new Float64Array(2),
            startNormal: new Float64Array(2),
            vertex: {
                type: 'null',
                fromIndex: -1,
                toIndex: -1,
                normal: new Float64Array(2),
                transform: new Transform2D(),
                r0: 0,
                y0: 0,
                lineOffsetSign: 1,
                arcOffsetSign: 1,
                arc2OffsetSign: 1,
                d: 0
            }
        };
    }
}
Shape.geoPointCache = [new GeoPoint(0, 0)];
Shape.vec2Cache = [new Float64Array(2), new Float64Array(2), new Float64Array(2), new Float64Array(2)];
Shape.vec3Cache = [new Float64Array(3)];
Shape.transformCache = [new Transform2D(), new Transform2D()];
