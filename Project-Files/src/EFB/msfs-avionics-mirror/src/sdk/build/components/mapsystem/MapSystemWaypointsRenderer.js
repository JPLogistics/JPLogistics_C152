import { FacilityWaypoint, ICAO } from '../../navigation';
import { GeoPoint } from '../../geo';
import { SubEvent } from '../../sub/SubEvent';
import { MapWaypointRenderer, MapCullableLocationTextLabel, MapWaypointImageIcon } from '../map';
/**
 * A waypoint renderer for the MapSystem API. Supports addition of string-keyed render roles. Each render role is
 * assigned a position in an ordered list that determines the priority of being chosen when roles are selected for
 * rendering waypoints. For each waypoint, the renderer iterates through all render roles in the priority order list
 * and selects the first role under which the waypoint is registered and is visible.
 */
export class MapSystemWaypointsRenderer extends MapWaypointRenderer {
    /**
     * Constructor.
     * @param textManager The text manager to use for waypoint labels.
     */
    constructor(textManager) {
        super(textManager, (entry, roleDefinitions) => {
            var _a;
            for (let i = 0; i < this.rolePriorityOrder.length; i++) {
                const role = this.rolePriorityOrder[i];
                if (entry.isAllRoles(role) && ((_a = roleDefinitions.get(role)) === null || _a === void 0 ? void 0 : _a.visibilityHandler(entry.waypoint))) {
                    return role;
                }
            }
            return 0;
        });
        this.rolePriorityOrder = [];
        this.rolesByGroup = new Map();
        this.roleIdMap = new Map();
        this.currentBit = 1;
        /** An event that fires when any roles are added. */
        this.onRolesAdded = new SubEvent();
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    addRenderRole(arg1, def, group = MapSystemWaypointsRenderer.DefaultGroup) {
        if (typeof arg1 === 'number') {
            return false;
        }
        this.roleIdMap.set(arg1, this.currentBit);
        super.addRenderRole(this.currentBit, def);
        this.rolePriorityOrder.push(this.currentBit);
        let roleGroup = this.rolesByGroup.get(group);
        if (roleGroup === undefined) {
            roleGroup = [];
            this.rolesByGroup.set(group, roleGroup);
        }
        roleGroup.push(arg1);
        this.currentBit *= 2;
        this.onRolesAdded.notify(this);
        return true;
    }
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
    insertRenderRole(name, insertBefore, def, group = MapSystemWaypointsRenderer.DefaultGroup) {
        const role = this.currentBit;
        this.addRenderRole(name, def, group);
        const roleToInsertBefore = this.roleIdMap.get(insertBefore);
        if (roleToInsertBefore !== undefined) {
            const indexToInsertBefore = this.rolePriorityOrder.indexOf(roleToInsertBefore);
            if (indexToInsertBefore >= 0 && indexToInsertBefore < this.rolePriorityOrder.length - 1) {
                this.rolePriorityOrder.pop();
                this.rolePriorityOrder.splice(indexToInsertBefore, 0, role);
            }
        }
        return true;
    }
    /**
     * Gets a render role associated with a name.
     * @param name The name of the role.
     * @returns The render role associated with the specified name, or undefined if there is no such role.
     */
    getRoleFromName(name) {
        return this.roleIdMap.get(name);
    }
    /**
     * Gets the names of roles in a specified group.
     * @param group A render role group.
     * @returns An array of the names of all render roles belonging to the specified group.
     */
    getRoleNamesByGroup(group) {
        const roleNames = this.rolesByGroup.get(group);
        if (roleNames !== undefined) {
            return roleNames;
        }
        return [];
    }
}
/** The default render role group. */
MapSystemWaypointsRenderer.DefaultGroup = 'DEFAULT_GROUP';
/**
 * A class that creates icons for the map system waypoint renderer.
 */
export class MapSystemIconFactory {
    constructor() {
        this.cache = new Map();
        this.iconFactories = new Map();
        this.defaultIconFactories = new Map();
    }
    /**
     * Adds an icon factory to the container.
     * @param role The role that this icon factory will be assigned to.
     * @param iconType The unique string type name of the icon.
     * @param factory The factory that will produce the icon.
     */
    addIconFactory(role, iconType, factory) {
        if (!this.iconFactories.has(role)) {
            this.iconFactories.set(role, new Map());
        }
        const roleFactories = this.iconFactories.get(role);
        roleFactories.set(iconType, factory);
    }
    /**
     * Adds a default icon factory for a role.
     * @param role The role to add a default icon factory for.
     * @param factory The factory that will produce the icons.
     */
    addDefaultIconFactory(role, factory) {
        this.defaultIconFactories.set(role, factory);
    }
    /** @inheritdoc */
    getIcon(role, waypoint) {
        if (!this.cache.has(role)) {
            this.cache.set(role, new Map());
        }
        const roleCache = this.cache.get(role);
        let icon = roleCache.get(waypoint.uid);
        if (icon === undefined) {
            icon = this.createIcon(role, waypoint);
            roleCache.set(waypoint.uid, icon);
        }
        return icon;
    }
    /**
     * Creates a new icon for a waypoint.
     * @param role The role that has been selected to render.
     * @param waypoint The waypoint for which to create an icon.
     * @returns a waypoint icon.
     */
    createIcon(role, waypoint) {
        if (!this.iconFactories.has(role)) {
            this.iconFactories.set(role, new Map());
        }
        const roleFactories = this.iconFactories.get(role);
        const factory = roleFactories.get(waypoint.type);
        if (factory !== undefined) {
            return factory(waypoint);
        }
        else {
            const defaultFactory = this.defaultIconFactories.get(role);
            if (defaultFactory !== undefined) {
                return defaultFactory(waypoint);
            }
        }
        const imageEl = document.createElement('img');
        imageEl.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAFjSURBVFhHvZarTsVAEIa3qCMQCAxPgEEikDwGAkGCAIFAIHgQHgGJ4C0Q4AiBN8CQQAIJuOGfs9N0d3p62tlLv+RPd2fFNrNfLy4Lov1lMtiQayqnyJkfzg3RAvlEfpEtqZrJ6cARwhsvkGMuzAvRA0KSZ6nOBNFesHmbA1k1kXoEq8SbScZOPt2BJBlTOtDKx7whT344l4yxfFfIeTCvLGMsH7d8G9lEvqXGMcloPYJQtHvXNB/ID8a3vrSkkox9+Q5lhdf4m9DWs96MwxCdBJu8SrWD6DFYv5BqQbR8mqoyrpJPkyjjVAn78mmqybhOPk0VGcfk0xSXcUw+TVEZp8inMco4JuG4fJpiMlrk0xSR0SqfJltGq3yaLBlT5NNMlHFIQrt8mokyNnLtYPmce0dace6QFz80s4vwLxzzh+zgxr78dIhYvtK5lF3WEMtXOr2nKT4C3/5rP6nGTZJTdXDuH4TJQyPZ/x+gAAAAAElFTkSuQmCC';
        return new MapWaypointImageIcon(waypoint, 0, imageEl, 24, 24);
    }
}
/**
 * A class that create labels for the map system waypoint renderer.
 */
export class MapSystemLabelFactory {
    constructor() {
        this.cache = new Map();
        this.labelFactories = new Map();
        this.defaultLabelFactories = new Map();
    }
    /**
     * Adds an label factory to the container.
     * @param role The role to add this label factory for.
     * @param iconType The unique string type name of the waypoint.
     * @param factory The factory that will produce the waypoint label.
     */
    addLabelFactory(role, iconType, factory) {
        if (!this.labelFactories.has(role)) {
            this.labelFactories.set(role, new Map());
        }
        const roleFactories = this.labelFactories.get(role);
        roleFactories.set(iconType, factory);
    }
    /**
     * Adds a default label factory for a role.
     * @param role The role to add a default label factory for.
     * @param factory The factory that will produce the labels.
     */
    addDefaultLabelFactory(role, factory) {
        this.defaultLabelFactories.set(role, factory);
    }
    /** @inheritdoc */
    getLabel(role, waypoint) {
        if (!this.cache.has(role)) {
            this.cache.set(role, new Map());
        }
        const roleCache = this.cache.get(role);
        let label = roleCache.get(waypoint.uid);
        if (label === undefined) {
            label = this.createLabel(role, waypoint);
            roleCache.set(waypoint.uid, label);
        }
        return label;
    }
    /**
     * Creates a new label for a waypoint.
     * @param role The role that has been selected to render.
     * @param waypoint The waypoint to create a label for.
     * @returns A new waypoint label.
     */
    createLabel(role, waypoint) {
        if (!this.labelFactories.has(role)) {
            this.labelFactories.set(role, new Map());
        }
        const roleFactories = this.labelFactories.get(role);
        const factory = roleFactories.get(waypoint.type);
        if (factory !== undefined) {
            return factory(waypoint);
        }
        else {
            const defaultFactory = this.defaultLabelFactories.get(role);
            if (defaultFactory !== undefined) {
                return defaultFactory(waypoint);
            }
        }
        if (waypoint instanceof FacilityWaypoint) {
            const facility = waypoint.facility;
            return new MapCullableLocationTextLabel(ICAO.getIdent(waypoint.facility.icao), 0, new GeoPoint(facility.lat, facility.lon), false, { fontSize: 22, font: 'monospace', anchor: new Float64Array([-0.25, 0.4]) });
        }
        return new MapCullableLocationTextLabel('', 0, new GeoPoint(0, 0), false);
    }
}
