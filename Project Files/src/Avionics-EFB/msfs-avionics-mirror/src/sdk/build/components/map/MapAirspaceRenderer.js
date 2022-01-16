/**
 * An airspace renderer which does not draw any graphics.
 */
export class NullAirspaceRenderer {
    /** @inheritdoc */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    render(airspace, projection, context, lod = 0, stream) {
        // noop
    }
}
/**
 * An abstract implementation of MapAirspaceRenderer.
 */
export class MapAbstractAirspaceRenderer {
    /** @inheritdoc */
    render(airspace, projection, context, lod = 0, stream) {
        const shapes = airspace.lods[lod];
        const len = shapes.length;
        for (let i = 0; i < len; i++) {
            this.renderShape(shapes[i], projection, context, stream);
        }
    }
}
