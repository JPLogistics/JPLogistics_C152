import { MapCanvasLayer } from './MapCanvasLayer';
import { MapProjectionChangeType } from '../MapProjection';
import { BitFlags } from '../../../utils/BitFlags';
/**
 * A canvas map layer whose size and position is synced with the map projection window.
 */
export class MapSyncedCanvasLayer extends MapCanvasLayer {
    // eslint-disable-next-line jsdoc/require-jsdoc
    onAttached() {
        super.onAttached();
        this.updateFromProjectedSize(this.props.mapProjection.getProjectedSize());
    }
    /**
     * Updates this layer according to the current size of the projected map window.
     * @param projectedSize The size of the projected map window.
     */
    updateFromProjectedSize(projectedSize) {
        this.setWidth(projectedSize[0]);
        this.setHeight(projectedSize[1]);
        const displayCanvas = this.display.canvas;
        displayCanvas.style.left = '0px';
        displayCanvas.style.top = '0px';
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    onMapProjectionChanged(mapProjection, changeFlags) {
        if (BitFlags.isAll(changeFlags, MapProjectionChangeType.ProjectedSize)) {
            this.updateFromProjectedSize(mapProjection.getProjectedSize());
        }
    }
}
