import { MapCullableTextLabel, MapCullableTextLabelManager } from './MapCullableTextLabel';
import { MapProjection } from './MapProjection';
import { MapWaypoint } from './MapWaypoint';
import { MapWaypointIcon } from './MapWaypointIcon';
/**
 * A waypoint icon factory.
 */
export interface MapWaypointRendererIconFactory<W extends MapWaypoint> {
    /**
     * Gets an icon for a waypoint.
     * @param role The role that was selected for the waypoint for rendering.
     * @param waypoint A waypoint.
     * @returns a waypoint icon.
     */
    getIcon<T extends W>(role: number, waypoint: T): MapWaypointIcon<T>;
}
/**
 * A waypoint label factory.
 */
export interface MapWaypointRendererLabelFactory<W extends MapWaypoint> {
    /**
     * Gets a label for a waypoint.
     * @param role The role that was selected for the waypoint for rendering.
     * @param waypoint A waypoint.
     * @returns a waypoint label.
     */
    getLabel<T extends W>(role: number, waypoint: T): MapCullableTextLabel;
}
/**
 * A render role definition.
 */
export declare type MapWaypointRenderRoleDef<W extends MapWaypoint> = {
    /** The icon factory used to create icons for the render role. */
    iconFactory: MapWaypointRendererIconFactory<W> | null;
    /** The label factory used to create labels for the render role. */
    labelFactory: MapWaypointRendererLabelFactory<W> | null;
    /** The canvas rendering context used to draw icons and labels for the render role. */
    canvasContext: CanvasRenderingContext2D | null;
    /** A function which determines whether a waypoint is visible under the render role. */
    visibilityHandler: (waypoint: W) => boolean;
};
/**
 * A function which selects roles under which to render waypoints.
 */
export declare type MapWaypointRenderRoleSelector<W extends MapWaypoint> = (entry: MapWaypointRendererEntry<W>, roleDefinitions: ReadonlyMap<number, Readonly<MapWaypointRenderRoleDef<W>>>) => number;
/**
 * A renderer that draws waypoints to a map. For the renderer to draw a waypoint, the waypoint must first be registered
 * with the renderer. Waypoints may be registered under multiple render roles. Each render role is represented as a bit
 * flag. During each render cycle, a specific role is chosen for each waypoint by a selector function. Once the role is
 * chosen, the waypoint will be rendered in that role.
 */
export declare class MapWaypointRenderer<W extends MapWaypoint = MapWaypoint> {
    protected readonly textManager: MapCullableTextLabelManager;
    protected readonly selectRoleToRender: MapWaypointRenderRoleSelector<W>;
    /** A null render role definition. Icons rendered under this role are never visible. */
    protected static readonly NULL_ROLE_DEF: {
        iconFactory: null;
        labelFactory: null;
        canvasContext: null;
        visibilityHandler: () => boolean;
    };
    /**
     * The default render role selector. For each waypoint entry, iterates through all possible render roles in the order
     * they were originally added to the renderer and selects the first role under which the entry is registered and is
     * visible.
     * @param entry A waypoint entry.
     * @param roleDefinitions A map from all possible render roles to their definitions.
     * @returns The role under which the waypoint entry should be rendered, or 0 if the entry should not be rendered
     * under any role.
     */
    static readonly DEFAULT_RENDER_ROLE_SELECTOR: <T extends MapWaypoint>(entry: MapWaypointRendererEntry<T>, roleDefinitions: ReadonlyMap<number, Readonly<MapWaypointRenderRoleDef<T>>>) => number;
    protected readonly registered: Map<string, MapWaypointRendererEntry<W>>;
    protected readonly toCleanUp: Set<MapWaypointRendererEntry<W>>;
    /**
     * This renderer's render role definitions. Waypoints assigned to be rendered under a role or combination of roles
     * with no definition will not be rendered.
     */
    protected readonly roleDefinitions: Map<number, MapWaypointRenderRoleDef<W>>;
    /**
     * Constructor.
     * @param textManager The text manager to use for waypoint labels.
     * @param selectRoleToRender A function which selects roles under which to render waypoints. Defaults to
     * {@link MapWaypointRenderer.DEFAULT_RENDER_ROLE_SELECTOR}.
     */
    constructor(textManager: MapCullableTextLabelManager, selectRoleToRender?: MapWaypointRenderRoleSelector<W>);
    /**
     * Checks whether a render role has been added to this renderer.
     * @param role The render role to check.
     * @returns Whether the render role has been added to this renderer.
     */
    hasRenderRole(role: number): boolean;
    /**
     * Adds a render role to this renderer. If the role has already been added to this renderer, this method does
     * nothing.
     * @param role The render role to add.
     * @param def The render role's definition. If undefined, the new role will be assigned a default definition with
     * no defined rendering context, icon, or label factories, and a visibility handler which always returns true.
     * @returns Whether the render role was successfully added.
     */
    addRenderRole(role: number, def?: MapWaypointRenderRoleDef<W>): boolean;
    /**
     * Removes a render role from this renderer.
     * @param role The render role to remove.
     * @returns Whether the render role was successfully removed.
     */
    removeRenderRole(role: number): boolean;
    /**
     * Gets the definition for a render role.
     * @param role A render role.
     * @returns The definition for the specified render role, or undefined if no such role has been added to this
     * renderer.
     */
    getRenderRoleDefinition(role: number): Readonly<MapWaypointRenderRoleDef<W>> | undefined;
    /**
     * Gets an iterable of render roles added to this renderer. The iterable will return the roles in the order in which
     * they were added.
     * @returns An iterable of render roles added to this renderer.
     */
    renderRoles(): IterableIterator<number>;
    /**
     * Removes all render roles from this renderer.
     */
    clearRenderRoles(): void;
    /**
     * Sets the factory to use to create waypoint icons for a render role. If the render role has not been added to this
     * renderer, this method does nothing.
     * @param role A render role.
     * @param factory A waypoint icon factory.
     * @returns Whether the factory was set.
     */
    setIconFactory(role: number, factory: MapWaypointRendererIconFactory<W>): boolean;
    /**
     * Sets the factory to use to create waypoint labels for a render role. If the render role has not been added to this
     * renderer, this method does nothing.
     * @param role A render role.
     * @param factory A waypoint label factory.
     * @returns Whether the factory was set.
     */
    setLabelFactory(role: number, factory: MapWaypointRendererLabelFactory<W>): boolean;
    /**
     * Sets the canvas rendering context for a render role. If the render role has not been added to this renderer, this
     * method does nothing.
     * @param role A render role.
     * @param context A canvas 2D rendering context.
     * @returns Whether the context was set.
     */
    setCanvasContext(role: number, context: CanvasRenderingContext2D): boolean;
    /**
     * Sets the handler that determines if a waypoint should visible for a render role. If the render role has not been
     * added to this renderer, this method does nothing.
     * @param role A render role.
     * @param handler A function that determines if a waypoint should be visible.
     * @returns Whether the handler was set.
     */
    setVisibilityHandler(role: number, handler: (waypoint: W) => boolean): boolean;
    /**
     * Checks if a waypoint is registered with this renderer. A role or roles can be optionally specified such that the
     * method will only return true if the waypoint is registered under those specific roles.
     * @param waypoint A waypoint.
     * @param role The specific role(s) to check.
     * @returns whether the waypoint is registered with this renderer.
     */
    isRegistered(waypoint: W, role?: number): boolean;
    /**
     * Registers a waypoint with this renderer under a specific role or roles. Registered waypoints will be drawn as
     * appropriate the next time this renderer's update() method is called. Registering a waypoint under a role under
     * which it is already registered has no effect unless the source of the registration is different.
     * @param waypoint The waypoint to register.
     * @param role The role(s) under which the waypoint should be registered.
     * @param sourceId A unique string ID for the source of the registration.
     */
    register(waypoint: W, role: number, sourceId: string): void;
    /**
     * Removes a registration for a waypoint for a specific role or roles. Once all of a waypoint's registrations for a
     * role are removed, it will no longer be rendered in that role the next this renderer's update() method is called.
     * @param waypoint The waypoint to deregister.
     * @param role The role(s) from which the waypoint should be deregistered.
     * @param sourceId The unique string ID for the source of the registration to remove.
     */
    deregister(waypoint: W, role: number, sourceId: string): void;
    /**
     * Deletes and cleans up a registered waypoint entry.
     * @param entry The entry to delete.
     */
    private deleteEntry;
    /**
     * Redraws waypoints registered with this renderer.
     * @param mapProjection The map projection to use.
     */
    update(mapProjection: MapProjection): void;
}
/**
 * An entry for a waypoint registered with {@link MapWaypointRenderer}.
 */
export declare class MapWaypointRendererEntry<W extends MapWaypoint> {
    readonly waypoint: W;
    private readonly textManager;
    private readonly roleDefinitions;
    private readonly selectRoleToRender;
    private readonly registrations;
    private _roles;
    private _icon;
    private _label;
    private _lastRenderedRole;
    /**
     * Constructor.
     * @param waypoint The waypoint associated with this entry.
     * @param textManager The text manager to which to register this entry's labels.
     * @param roleDefinitions A map of all valid render roles to their definitions.
     * @param selectRoleToRender A function to use to select roles under which to render this entry.
     */
    constructor(waypoint: W, textManager: MapCullableTextLabelManager, roleDefinitions: ReadonlyMap<number, Readonly<MapWaypointRenderRoleDef<W>>>, selectRoleToRender: MapWaypointRenderRoleSelector<W>);
    /** The render role(s) assigned to this entry. */
    get roles(): number;
    /** The role under which this entry was last rendered, or 0 if this entry has not yet been rendered. */
    get lastRenderedRole(): number;
    /** This entry's waypoint icon. */
    get icon(): MapWaypointIcon<W> | null;
    /** This entry's waypoint label. */
    get label(): MapCullableTextLabel | null;
    /**
     * Checks whether this entry is assigned any of the specified render roles. Optionally, this method can also check
     * if this entry was last rendered in any of the specified roles instead.
     * @param roles The render roles against which to check.
     * @param useLastRendered Whether to check the role(s) in which this entry was last rendered instead of the current
     * roles assigned to this entry. False by default.
     * @returns whether the check passed.
     */
    isAnyRole(roles: number, useLastRendered?: boolean): boolean;
    /**
     * Checks whether this entry is assigned only the specified render role(s). Optionally, this method can also check
     * if this entry was last rendered in only the specified role(s) instead.
     * @param roles The render roles against which to check.
     * @param useLastRendered Whether to check the role(s) in which this entry was last rendered instead of the current
     * roles assigned to this entry. False by default.
     * @returns whether the check passed.
     */
    isOnlyRole(roles: number, useLastRendered?: boolean): boolean;
    /**
     * Checks whether this entry is assigned all the specified render role(s). Optionally, this method can also check
     * if this entry was last rendered in all the specified role(s) instead.
     * @param roles - the render role(s) against which to check.
     * @param useLastRendered Whether to check the role(s) in which this entry was last rendered instead of the current
     * roles assigned to this entry. False by default.
     * @returns whether the check passed.
     */
    isAllRoles(roles: number, useLastRendered?: boolean): boolean;
    /**
     * Assigns one or more render roles to this entry.
     * @param roles The render role(s) to assign.
     * @param sourceId The unique string ID of the source of the assignment.
     */
    addRole(roles: number, sourceId: string): void;
    /**
     * Removes one or more render roles from this entry.
     * @param roles The render role(s) to remove.
     * @param sourceId The unique string ID of the soruce of the de-assignment.
     */
    removeRole(roles: number, sourceId: string): void;
    /**
     * Prepares this entry for rendering.
     * @param showRole The role in which this entry should be rendered.
     * @param iconFactory The factory to use to get a waypoint icon.
     * @param labelFactory The factory to use to get a waypoint label.
     */
    private prepareRender;
    /**
     * Updates this entry. An appropriate render role is selected, then the icon and label are updated as appropriate
     * for the chosen role. If the waypoint's label should be visible, it is added to the appropriate text manager.
     * Of note, this method will not draw the waypoint icon to a canvas element; it will simply ensure the .showIcon
     * property contains the correct value depending on whether the icon should be visible.
     */
    update(): void;
    /**
     * Destroys this entry. Any label from this entry currently registered with the text manager will be deregistered.
     */
    destroy(): void;
}
//# sourceMappingURL=MapWaypointRenderer.d.ts.map