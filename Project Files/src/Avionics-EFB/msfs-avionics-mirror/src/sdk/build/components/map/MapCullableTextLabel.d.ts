import { GeoPointInterface } from '../../utils/geo/GeoPoint';
import { MapProjection } from './MapProjection';
import { MapLocationTextLabel, MapLocationTextLabelOptions, MapTextLabel } from './MapTextLabel';
/**
 * A map text label which can be culled to prevent collision with other labels.
 */
export interface MapCullableTextLabel extends MapTextLabel {
    /** Whether this label is immune to culling. */
    readonly alwaysShow: boolean;
    /** The bounding box of this label. */
    readonly bounds: Float64Array;
    /**
     * Updates this label's bounding box.
     * @param mapProjection The map projection to use.
     */
    updateBounds(mapProjection: MapProjection): void;
}
/**
 * A cullable text label associated with a specific geographic location.
 */
export declare class MapCullableLocationTextLabel extends MapLocationTextLabel implements MapCullableTextLabel {
    readonly alwaysShow: boolean;
    readonly bounds: Float64Array;
    /**
     * Constructor.
     * @param text The text of this label.
     * @param priority The priority of this label.
     * @param location The geographic location of this label.
     * @param alwaysShow Whether this label is immune to culling.
     * @param options Options with which to initialize this label.
     */
    constructor(text: string, priority: number, location: GeoPointInterface, alwaysShow: boolean, options?: MapLocationTextLabelOptions);
    updateBounds(mapProjection: MapProjection): void;
}
/**
 * Manages a set of MapCullableTextLabels. Colliding labels will be culled based on their render priority. Labels with
 * lower priorities will be culled before labels with higher priorities.
 */
export declare class MapCullableTextLabelManager {
    static readonly ROTATION_UPDATE_THRESHOLD: number;
    private readonly registered;
    private _visibleLabels;
    /** An array of labels registered with this manager that are visible. */
    get visibleLabels(): readonly MapCullableTextLabel[];
    private needUpdate;
    private lastRange;
    private lastRotation;
    /**
     * Registers a label with this manager. Newly registered labels will be processed with the next manager update.
     * @param label The label to register.
     */
    register(label: MapCullableTextLabel): void;
    /**
     * Deregisters a label with this manager. Newly deregistered labels will be processed with the next manager update.
     * @param label The label to deregister.
     */
    deregister(label: MapCullableTextLabel): void;
    /**
     * Updates this manager.
     * @param mapProjection The projection of the map to which this manager's labels are to be drawn.
     */
    update(mapProjection: MapProjection): void;
    /**
     * Checks if two bounding boxes collide.
     * @param a The first bounding box, as a 4-tuple [left, top, right, bottom].
     * @param b The second bounding box, as a 4-tuple [left, top, right, bottom].
     * @returns whether the bounding boxes collide.
     */
    private static doesCollide;
}
//# sourceMappingURL=MapCullableTextLabel.d.ts.map