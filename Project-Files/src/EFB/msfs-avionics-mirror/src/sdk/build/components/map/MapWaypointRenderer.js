import { BitFlags } from '../..';
/**
 * A renderer that draws waypoints to a map. For the renderer to draw a waypoint, the waypoint must first be registered
 * with the renderer. Waypoints may be registered under multiple render roles. Each render role is represented as a bit
 * flag. During each render cycle, a specific role is chosen for each waypoint by a selector function. Once the role is
 * chosen, the waypoint will be rendered in that role.
 */
export class MapWaypointRenderer {
    /**
     * Constructor.
     * @param textManager The text manager to use for waypoint labels.
     * @param selectRoleToRender A function which selects roles under which to render waypoints. Defaults to
     * {@link MapWaypointRenderer.DEFAULT_RENDER_ROLE_SELECTOR}.
     */
    constructor(textManager, selectRoleToRender = MapWaypointRenderer.DEFAULT_RENDER_ROLE_SELECTOR) {
        this.textManager = textManager;
        this.selectRoleToRender = selectRoleToRender;
        this.registered = new Map();
        this.toCleanUp = new Set();
        /**
         * This renderer's render role definitions. Waypoints assigned to be rendered under a role or combination of roles
         * with no definition will not be rendered.
         */
        this.roleDefinitions = new Map();
    }
    /**
     * Checks whether a render role has been added to this renderer.
     * @param role The render role to check.
     * @returns Whether the render role has been added to this renderer.
     */
    hasRenderRole(role) {
        return this.roleDefinitions.has(role);
    }
    /**
     * Adds a render role to this renderer. If the role has already been added to this renderer, this method does
     * nothing.
     * @param role The render role to add.
     * @param def The render role's definition. If undefined, the new role will be assigned a default definition with
     * no defined rendering context, icon, or label factories, and a visibility handler which always returns true.
     * @returns Whether the render role was successfully added.
     */
    addRenderRole(role, def) {
        if (this.roleDefinitions.has(role)) {
            return false;
        }
        this.roleDefinitions.set(role, Object.assign({}, def !== null && def !== void 0 ? def : MapWaypointRenderer.NULL_ROLE_DEF));
        return true;
    }
    /**
     * Removes a render role from this renderer.
     * @param role The render role to remove.
     * @returns Whether the render role was successfully removed.
     */
    removeRenderRole(role) {
        return this.roleDefinitions.delete(role);
    }
    /**
     * Gets the definition for a render role.
     * @param role A render role.
     * @returns The definition for the specified render role, or undefined if no such role has been added to this
     * renderer.
     */
    getRenderRoleDefinition(role) {
        return this.roleDefinitions.get(role);
    }
    /**
     * Gets an iterable of render roles added to this renderer. The iterable will return the roles in the order in which
     * they were added.
     * @returns An iterable of render roles added to this renderer.
     */
    renderRoles() {
        return this.roleDefinitions.keys();
    }
    /**
     * Removes all render roles from this renderer.
     */
    clearRenderRoles() {
        this.roleDefinitions.clear();
    }
    /**
     * Sets the factory to use to create waypoint icons for a render role. If the render role has not been added to this
     * renderer, this method does nothing.
     * @param role A render role.
     * @param factory A waypoint icon factory.
     * @returns Whether the factory was set.
     */
    setIconFactory(role, factory) {
        const roleDef = this.roleDefinitions.get(role);
        if (!roleDef) {
            return false;
        }
        roleDef.iconFactory = factory;
        return true;
    }
    /**
     * Sets the factory to use to create waypoint labels for a render role. If the render role has not been added to this
     * renderer, this method does nothing.
     * @param role A render role.
     * @param factory A waypoint label factory.
     * @returns Whether the factory was set.
     */
    setLabelFactory(role, factory) {
        const roleDef = this.roleDefinitions.get(role);
        if (!roleDef) {
            return false;
        }
        roleDef.labelFactory = factory;
        return true;
    }
    /**
     * Sets the canvas rendering context for a render role. If the render role has not been added to this renderer, this
     * method does nothing.
     * @param role A render role.
     * @param context A canvas 2D rendering context.
     * @returns Whether the context was set.
     */
    setCanvasContext(role, context) {
        const roleDef = this.roleDefinitions.get(role);
        if (!roleDef) {
            return false;
        }
        roleDef.canvasContext = context;
        return true;
    }
    /**
     * Sets the handler that determines if a waypoint should visible for a render role. If the render role has not been
     * added to this renderer, this method does nothing.
     * @param role A render role.
     * @param handler A function that determines if a waypoint should be visible.
     * @returns Whether the handler was set.
     */
    setVisibilityHandler(role, handler) {
        const roleDef = this.roleDefinitions.get(role);
        if (!roleDef) {
            return false;
        }
        roleDef.visibilityHandler = handler;
        return true;
    }
    /**
     * Checks if a waypoint is registered with this renderer. A role or roles can be optionally specified such that the
     * method will only return true if the waypoint is registered under those specific roles.
     * @param waypoint A waypoint.
     * @param role The specific role(s) to check.
     * @returns whether the waypoint is registered with this renderer.
     */
    isRegistered(waypoint, role) {
        if (!waypoint) {
            return false;
        }
        const entry = this.registered.get(waypoint.uid);
        if (!entry) {
            return false;
        }
        if (role === undefined) {
            return true;
        }
        return entry.isAllRoles(role);
    }
    /**
     * Registers a waypoint with this renderer under a specific role or roles. Registered waypoints will be drawn as
     * appropriate the next time this renderer's update() method is called. Registering a waypoint under a role under
     * which it is already registered has no effect unless the source of the registration is different.
     * @param waypoint The waypoint to register.
     * @param role The role(s) under which the waypoint should be registered.
     * @param sourceId A unique string ID for the source of the registration.
     */
    register(waypoint, role, sourceId) {
        if (role === 0 || sourceId === '') {
            return;
        }
        let entry = this.registered.get(waypoint.uid);
        if (!entry) {
            entry = new MapWaypointRendererEntry(waypoint, this.textManager, this.roleDefinitions, this.selectRoleToRender);
            this.registered.set(waypoint.uid, entry);
        }
        entry.addRole(role, sourceId);
    }
    /**
     * Removes a registration for a waypoint for a specific role or roles. Once all of a waypoint's registrations for a
     * role are removed, it will no longer be rendered in that role the next this renderer's update() method is called.
     * @param waypoint The waypoint to deregister.
     * @param role The role(s) from which the waypoint should be deregistered.
     * @param sourceId The unique string ID for the source of the registration to remove.
     */
    deregister(waypoint, role, sourceId) {
        if (role === 0 || sourceId === '') {
            return;
        }
        const entry = this.registered.get(waypoint.uid);
        if (!entry) {
            return;
        }
        entry.removeRole(role, sourceId);
        if (entry.roles === 0) {
            this.deleteEntry(entry);
        }
    }
    /**
     * Deletes and cleans up a registered waypoint entry.
     * @param entry The entry to delete.
     */
    deleteEntry(entry) {
        this.registered.delete(entry.waypoint.uid);
        this.toCleanUp.add(entry);
    }
    /**
     * Redraws waypoints registered with this renderer.
     * @param mapProjection The map projection to use.
     */
    update(mapProjection) {
        var _a;
        this.toCleanUp.forEach(entry => {
            entry.destroy();
        });
        this.toCleanUp.clear();
        const entriesToDrawIcon = [];
        this.registered.forEach(entry => {
            entry.update();
            if (entry.icon) {
                entriesToDrawIcon.push(entry);
            }
        });
        const projectedSize = mapProjection.getProjectedSize();
        for (const roleDef of this.roleDefinitions.values()) {
            const context = roleDef.canvasContext;
            if (context) {
                context.clearRect(0, 0, projectedSize[0], projectedSize[1]);
            }
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        entriesToDrawIcon.sort((a, b) => a.icon.priority - b.icon.priority);
        const len2 = entriesToDrawIcon.length;
        for (let i = 0; i < len2; i++) {
            const entry = entriesToDrawIcon[i];
            const icon = entry.icon;
            const context = (_a = this.roleDefinitions.get(entry.lastRenderedRole)) === null || _a === void 0 ? void 0 : _a.canvasContext;
            if (context) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                icon.draw(context, mapProjection);
            }
        }
    }
}
/** A null render role definition. Icons rendered under this role are never visible. */
MapWaypointRenderer.NULL_ROLE_DEF = {
    iconFactory: null,
    labelFactory: null,
    canvasContext: null,
    visibilityHandler: () => true
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
MapWaypointRenderer.DEFAULT_RENDER_ROLE_SELECTOR = (entry, roleDefinitions) => {
    for (const role of roleDefinitions.keys()) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (entry.isAllRoles(role) && roleDefinitions.get(role).visibilityHandler(entry.waypoint)) {
            return role;
        }
    }
    return 0;
};
/**
 * An entry for a waypoint registered with {@link MapWaypointRenderer}.
 */
export class MapWaypointRendererEntry {
    /**
     * Constructor.
     * @param waypoint The waypoint associated with this entry.
     * @param textManager The text manager to which to register this entry's labels.
     * @param roleDefinitions A map of all valid render roles to their definitions.
     * @param selectRoleToRender A function to use to select roles under which to render this entry.
     */
    constructor(waypoint, textManager, roleDefinitions, selectRoleToRender) {
        this.waypoint = waypoint;
        this.textManager = textManager;
        this.roleDefinitions = roleDefinitions;
        this.selectRoleToRender = selectRoleToRender;
        this.registrations = {};
        this._roles = 0;
        this._icon = null;
        this._label = null;
        this._lastRenderedRole = 0;
    }
    // eslint-disable-next-line jsdoc/require-returns
    /** The render role(s) assigned to this entry. */
    get roles() {
        return this._roles;
    }
    // eslint-disable-next-line jsdoc/require-returns
    /** The role under which this entry was last rendered, or 0 if this entry has not yet been rendered. */
    get lastRenderedRole() {
        return this._lastRenderedRole;
    }
    // eslint-disable-next-line jsdoc/require-returns
    /** This entry's waypoint icon. */
    get icon() {
        return this._icon;
    }
    // eslint-disable-next-line jsdoc/require-returns
    /** This entry's waypoint label. */
    get label() {
        return this._label;
    }
    /**
     * Checks whether this entry is assigned any of the specified render roles. Optionally, this method can also check
     * if this entry was last rendered in any of the specified roles instead.
     * @param roles The render roles against which to check.
     * @param useLastRendered Whether to check the role(s) in which this entry was last rendered instead of the current
     * roles assigned to this entry. False by default.
     * @returns whether the check passed.
     */
    isAnyRole(roles, useLastRendered = false) {
        let toCompare;
        if (useLastRendered) {
            toCompare = this.lastRenderedRole;
        }
        else {
            toCompare = this.roles;
        }
        return BitFlags.isAny(toCompare, roles);
    }
    /**
     * Checks whether this entry is assigned only the specified render role(s). Optionally, this method can also check
     * if this entry was last rendered in only the specified role(s) instead.
     * @param roles The render roles against which to check.
     * @param useLastRendered Whether to check the role(s) in which this entry was last rendered instead of the current
     * roles assigned to this entry. False by default.
     * @returns whether the check passed.
     */
    isOnlyRole(roles, useLastRendered = false) {
        let toCompare;
        if (useLastRendered) {
            toCompare = this.lastRenderedRole;
        }
        else {
            toCompare = this.roles;
        }
        return toCompare === roles;
    }
    /**
     * Checks whether this entry is assigned all the specified render role(s). Optionally, this method can also check
     * if this entry was last rendered in all the specified role(s) instead.
     * @param roles - the render role(s) against which to check.
     * @param useLastRendered Whether to check the role(s) in which this entry was last rendered instead of the current
     * roles assigned to this entry. False by default.
     * @returns whether the check passed.
     */
    isAllRoles(roles, useLastRendered = false) {
        let toCompare;
        if (useLastRendered) {
            toCompare = this.lastRenderedRole;
        }
        else {
            toCompare = this.roles;
        }
        return BitFlags.isAll(toCompare, roles);
    }
    /**
     * Assigns one or more render roles to this entry.
     * @param roles The render role(s) to assign.
     * @param sourceId The unique string ID of the source of the assignment.
     */
    addRole(roles, sourceId) {
        BitFlags.forEach(roles, (value, index) => {
            var _a;
            var _b, _c;
            ((_a = (_b = this.registrations)[_c = 1 << index]) !== null && _a !== void 0 ? _a : (_b[_c] = new Set())).add(sourceId);
        }, true);
        this._roles = this._roles | roles;
    }
    /**
     * Removes one or more render roles from this entry.
     * @param roles The render role(s) to remove.
     * @param sourceId The unique string ID of the soruce of the de-assignment.
     */
    removeRole(roles, sourceId) {
        BitFlags.forEach(roles, (value, index) => {
            const role = 1 << index;
            const registrations = this.registrations[role];
            if (registrations) {
                registrations.delete(sourceId);
                if (registrations.size === 0) {
                    this._roles = this._roles & ~role;
                }
            }
        }, true);
    }
    /**
     * Prepares this entry for rendering.
     * @param showRole The role in which this entry should be rendered.
     * @param iconFactory The factory to use to get a waypoint icon.
     * @param labelFactory The factory to use to get a waypoint label.
     */
    prepareRender(showRole, iconFactory, labelFactory) {
        var _a, _b;
        if (showRole === this._lastRenderedRole) {
            return;
        }
        this._icon = (_a = iconFactory === null || iconFactory === void 0 ? void 0 : iconFactory.getIcon(showRole, this.waypoint)) !== null && _a !== void 0 ? _a : null;
        const label = (_b = labelFactory === null || labelFactory === void 0 ? void 0 : labelFactory.getLabel(showRole, this.waypoint)) !== null && _b !== void 0 ? _b : null;
        if (this._label && this._label !== label) {
            this.textManager.deregister(this._label);
        }
        if (label && label !== this._label) {
            this.textManager.register(label);
        }
        this._label = label;
        this._lastRenderedRole = showRole;
    }
    /**
     * Updates this entry. An appropriate render role is selected, then the icon and label are updated as appropriate
     * for the chosen role. If the waypoint's label should be visible, it is added to the appropriate text manager.
     * Of note, this method will not draw the waypoint icon to a canvas element; it will simply ensure the .showIcon
     * property contains the correct value depending on whether the icon should be visible.
     */
    update() {
        var _a, _b;
        const showRole = this.selectRoleToRender(this, this.roleDefinitions);
        const roleDef = this.roleDefinitions.get(showRole);
        const iconFactory = (_a = roleDef === null || roleDef === void 0 ? void 0 : roleDef.iconFactory) !== null && _a !== void 0 ? _a : null;
        const labelFactory = (_b = roleDef === null || roleDef === void 0 ? void 0 : roleDef.labelFactory) !== null && _b !== void 0 ? _b : null;
        this.prepareRender(showRole, iconFactory, labelFactory);
    }
    /**
     * Destroys this entry. Any label from this entry currently registered with the text manager will be deregistered.
     */
    destroy() {
        if (this._label) {
            this.textManager.deregister(this._label);
        }
    }
}
