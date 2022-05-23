import { Waypoint } from '../../../navigation';
import { VNode } from '../../FSComponent';
import { MapAbstractNearestWaypointsLayer, MapAbstractNearestWaypointsLayerProps, MapSyncedCanvasLayer } from '../../map';
import { MapSystemIconFactory, MapSystemLabelFactory, MapSystemWaypointsRenderer } from '../MapSystemWaypointsRenderer';
import { MapWaypointDisplayModule } from '../modules/MapWaypointDisplayModule';
/**
 * Props on the MapSystemWaypointsLayer component.
 */
export interface MapSystemWaypointsLayerProps extends MapAbstractNearestWaypointsLayerProps<any, MapSystemWaypointsRenderer> {
    /** The icon factory to use with this component. */
    iconFactory: MapSystemIconFactory;
    /** The label factory to use with this component. */
    labelFactory: MapSystemLabelFactory;
}
/**
 * A class that renders waypoints into a layer.
 */
export declare class MapSystemWaypointsLayer extends MapAbstractNearestWaypointsLayer<any, MapSystemWaypointsRenderer, MapSystemWaypointsLayerProps> {
    protected readonly canvasLayer: import("../../FSComponent").NodeReference<MapSyncedCanvasLayer<import("../../map").MapCanvasLayerProps<any>>>;
    protected readonly displayModule: MapWaypointDisplayModule;
    protected currentRole: number | undefined;
    /** @inheritdoc */
    onAttached(): void;
    /** @inheritdoc */
    onUpdated(time: number, elapsed: number): void;
    /** @inheritdoc */
    protected initEventHandlers(): void;
    /** @inheritdoc */
    protected initWaypointRenderer(): void;
    /** @inheritdoc */
    setVisible(val: boolean): void;
    /**
     * Checks to see if a waypoint should be visible.
     * @param waypoint The waypoint to check.
     * @returns True if visible, false otherwise.
     */
    protected isWaypointVisible(waypoint: Waypoint): boolean;
    /** @inheritdoc */
    render(): VNode;
}
//# sourceMappingURL=MapSystemWaypointsLayer.d.ts.map