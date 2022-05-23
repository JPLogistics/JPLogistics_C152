import { MapCanvasLayer, MapCanvasLayerProps } from './MapCanvasLayer';
import { MapProjection } from '../MapProjection';
import { ReadonlyFloat64Array } from '../../../math';
/**
 * A canvas map layer whose size and position is synced with the map projection window.
 */
export declare class MapSyncedCanvasLayer<P extends MapCanvasLayerProps<any> = MapCanvasLayerProps<any>> extends MapCanvasLayer<P> {
    onAttached(): void;
    /**
     * Updates this layer according to the current size of the projected map window.
     * @param projectedSize The size of the projected map window.
     */
    protected updateFromProjectedSize(projectedSize: ReadonlyFloat64Array): void;
    onMapProjectionChanged(mapProjection: MapProjection, changeFlags: number): void;
}
//# sourceMappingURL=MapSyncedCanvasLayer.d.ts.map