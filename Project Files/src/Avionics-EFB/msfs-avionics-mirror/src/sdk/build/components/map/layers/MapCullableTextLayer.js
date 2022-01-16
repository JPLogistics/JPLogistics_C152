import { MapSyncedCanvasLayer } from './MapSyncedCanvasLayer';
/**
 * A layer which displays text which can be culled to avoid overlap.
 */
export class MapCullableTextLayer extends MapSyncedCanvasLayer {
    // eslint-disable-next-line jsdoc/require-jsdoc
    onUpdated(time, elapsed) {
        super.onUpdated(time, elapsed);
        this.props.manager.update(this.props.mapProjection);
        this.redrawLabels();
    }
    /**
     * Clears this layer's canvas and redraws the currently visible labels registered to this layer's text manager.
     */
    redrawLabels() {
        const labels = this.props.manager.visibleLabels;
        const display = this.display;
        display.clear();
        for (let i = labels.length - 1; i >= 0; i--) {
            labels[i].draw(display.context, this.props.mapProjection);
        }
    }
}
