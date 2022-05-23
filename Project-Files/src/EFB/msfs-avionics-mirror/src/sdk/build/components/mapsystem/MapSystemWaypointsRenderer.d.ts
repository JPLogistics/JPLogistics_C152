import { Waypoint } from '../../navigation';
import { SubEvent } from '../../sub/SubEvent';
import { MapWaypointRenderer, MapCullableLocationTextLabel, MapCullableTextLabel, MapWaypointIcon, MapWaypointRendererIconFactory, MapWaypointRendererLabelFactory, MapWaypointRenderRoleDef, MapCullableTextLabelManager } from '../map';
/**
 * A waypoint renderer for the MapSystem API. Supports addition of string-keyed render roles. Each render role is
 * assigned a position in an ordered list that determines the priority of being chosen when roles are selected for
 * rendering waypoints. For each waypoint, the renderer iterates through all render roles in the priority order list
 * and selects the first role under which the waypoint is registered and is visible.
 */
export declare class MapSystemWaypointsRenderer extends MapWaypointRenderer<Waypoint> {
    /** The default render role group. */
    static readonly DefaultGroup = "DEFAULT_GROUP";
    protected readonly rolePriorityOrder: number[];
    protected readonly rolesByGroup: Map<string, string[]>;
    protected readonly roleIdMap: Map<string, number>;
    protected currentBit: number;
    /** An event that fires when any roles are added. */
    readonly onRolesAdded: SubEvent<this, void>;
    /**
     * Constructor.
     * @param textManager The text manager to use for waypoint labels.
     */
    constructor(textManager: MapCullableTextLabelManager);
    /**
     * This method is disabled. Please use the `addRenderRole(name: string, def: MapWaypointRenderRoleDef<Waypoint>, group?: string)`
     * overload to add render roles to this renderer.
     * @param role The render role to add.
     * @param def The render role's definition.
     * @returns `false`.
     */
    addRenderRole(role: number, def?: MapWaypointRenderRoleDef<Waypoint>): false;
    /**
     * Adds a new named render role to this renderer. The new render role will be placed at the end of this renderer's
     * render role selection priority order. Roles positioned earlier in the order have a higher priority for being
     * chosen when roles are selected for rendering waypoints.
     * @param name The name of the render role to add.
     * @param def The render role's definition. If undefined, the new role will be assigned a default definition with
     * no defined rendering context, icon, or label factories, and a visibility handler which always returns true.
     * @param group The group in which to include the new render role, if any. Defaults to
     * {@link MapSystemWaypointsRenderer.DefaultGroup}.
     * @returns Whether the role was successfully added.
     */
    addRenderRole(name: string, def?: MapWaypointRenderRoleDef<Waypoint>, group?: string): boolean;
    /**
     * Adds a new named render role to this renderer and inserts it before an existing render role in this renderer's
     * render role selection priority order. Roles positioned earlier in the order have a higher priority for being
     * chosen when roles are selected for rendering waypoints.
     * @param name The name of the render role to add.
     * @param insertBefore The name of the role before which to insert the new role in this renderer's render role
     * selection priority order. If the name does not match any of this renderer's existing render roles, the new role
     * will be placed at the end of the priority order.
     * @param def The render role's definition. If undefined, the new role will be assigned a default definition with
     * no defined rendering context, icon, or label factories, and a visibility handler which always returns true.
     * @param group The group in which to include the new render role, if any. Defaults to
     * {@link MapSystemWaypointsRenderer.DefaultGroup}.
     * @returns Whether the role was successfully inserted.
     */
    insertRenderRole(name: string, insertBefore: string, def?: MapWaypointRenderRoleDef<Waypoint>, group?: string): boolean;
    /**
     * Gets a render role associated with a name.
     * @param name The name of the role.
     * @returns The render role associated with the specified name, or undefined if there is no such role.
     */
    getRoleFromName(name: string): number | undefined;
    /**
     * Gets the names of roles in a specified group.
     * @param group A render role group.
     * @returns An array of the names of all render roles belonging to the specified group.
     */
    getRoleNamesByGroup(group: string): readonly string[];
}
/**
 * A class that creates icons for the map system waypoint renderer.
 */
export declare class MapSystemIconFactory implements MapWaypointRendererIconFactory<Waypoint> {
    private readonly cache;
    private readonly iconFactories;
    private readonly defaultIconFactories;
    /**
     * Adds an icon factory to the container.
     * @param role The role that this icon factory will be assigned to.
     * @param iconType The unique string type name of the icon.
     * @param factory The factory that will produce the icon.
     */
    addIconFactory<T extends Waypoint>(role: number, iconType: string, factory: (waypoint: T) => MapWaypointIcon<T>): void;
    /**
     * Adds a default icon factory for a role.
     * @param role The role to add a default icon factory for.
     * @param factory The factory that will produce the icons.
     */
    addDefaultIconFactory<T extends Waypoint>(role: number, factory: (waypoint: T) => MapWaypointIcon<T>): void;
    /** @inheritdoc */
    getIcon<T extends Waypoint>(role: number, waypoint: T): MapWaypointIcon<T>;
    /**
     * Creates a new icon for a waypoint.
     * @param role The role that has been selected to render.
     * @param waypoint The waypoint for which to create an icon.
     * @returns a waypoint icon.
     */
    private createIcon;
}
/**
 * A class that create labels for the map system waypoint renderer.
 */
export declare class MapSystemLabelFactory implements MapWaypointRendererLabelFactory<Waypoint> {
    private readonly cache;
    private readonly labelFactories;
    private readonly defaultLabelFactories;
    /**
     * Adds an label factory to the container.
     * @param role The role to add this label factory for.
     * @param iconType The unique string type name of the waypoint.
     * @param factory The factory that will produce the waypoint label.
     */
    addLabelFactory<T extends Waypoint>(role: number, iconType: string, factory: (waypoint: T) => MapCullableLocationTextLabel): void;
    /**
     * Adds a default label factory for a role.
     * @param role The role to add a default label factory for.
     * @param factory The factory that will produce the labels.
     */
    addDefaultLabelFactory<T extends Waypoint>(role: number, factory: (waypoint: T) => MapCullableLocationTextLabel): void;
    /** @inheritdoc */
    getLabel<T extends Waypoint>(role: number, waypoint: T): MapCullableTextLabel;
    /**
     * Creates a new label for a waypoint.
     * @param role The role that has been selected to render.
     * @param waypoint The waypoint to create a label for.
     * @returns A new waypoint label.
     */
    createLabel(role: number, waypoint: Waypoint): MapCullableLocationTextLabel;
}
//# sourceMappingURL=MapSystemWaypointsRenderer.d.ts.map