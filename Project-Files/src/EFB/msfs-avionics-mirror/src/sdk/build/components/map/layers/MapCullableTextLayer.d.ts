import { MapCullableTextLabelManager } from '../MapCullableTextLabel';
import { MapLayerProps } from '../MapLayer';
import { MapSyncedCanvasLayer } from './MapSyncedCanvasLayer';
/**
 * Component props for MapTextLayer.
 */
export interface MapTextLayerProps extends MapLayerProps<any> {
    /** The text manager to use. */
    manager: MapCullableTextLabelManager;
}
/**
 * A layer which displays text which can be culled to avoid overlap.
 */
export declare class MapCullableTextLayer extends MapSyncedCanvasLayer<MapTextLayerProps> {
    onUpdated(time: number, elapsed: number): void;
    /**
     * Clears this layer's canvas and redraws the currently visible labels registered to this layer's text manager.
     */
    private redrawLabels;
}
//# sourceMappingURL=MapCullableTextLayer.d.ts.map