import { BitFlags } from 'msfssdk';
import { MapCullableTextLabel, MapCullableTextLabelManager, MapProjection } from 'msfssdk/components/map';

import { Waypoint } from '../Navigation/Waypoint';
import { MapWaypointIcon } from './MapWaypointIcon';

/**
 * Render roles for MapWaypointRenderer.
 */
export enum MapWaypointRenderRole {
  /** A highlighted waypoint. */
  Highlight = 1,

  /** A waypoint which is the active waypoint in a flight plan. */
  FlightPlanActive = 1 << 1,

  /** A waypoint in a flight plan which is not the active waypoint. */
  FlightPlanInactive = 1 << 2,

  /** A normally displayed waypoint. */
  Normal = 1 << 3,

  /** A waypoint in an airway. */
  Airway = 1 << 4,

  /** A VNAV waypoint. */
  VNav = 1 << 5
}

/**
 * A waypoint icon factory.
 */
export interface MapWaypointRendererIconFactory {
  /**
   * Gets an icon for a waypoint.
   * @param waypoint A waypoint.
   * @returns a waypoint icon.
   */
  getIcon<T extends Waypoint>(waypoint: T): MapWaypointIcon<T>;
}

/**
 * A waypoint icon factory.
 */
export interface MapWaypointRendererLabelFactory {
  /**
   * Gets a label for a waypoint.
   * @param waypoint A waypoint.
   * @returns a waypoint label.
   */
  getLabel(waypoint: Waypoint): MapCullableTextLabel;
}

/**
 * Information related to a render role.
 */
type MapWaypointRenderRoleInfo = {
  /** The icon factory used to create icons for the render role. */
  iconFactory: MapWaypointRendererIconFactory | null,

  /** The label factory used to create labels for the render role. */
  labelFactory: MapWaypointRendererLabelFactory | null,

  /** The canvas rendering context used to draw icons and labels for the render role. */
  canvasContext: CanvasRenderingContext2D | null,

  /** A function which determines whether a waypoint is visible under the render role */
  visibilityHandler: (waypoint: Waypoint) => boolean;
}

/**
 * A renderer that draws waypoints. Waypoints can be rendered in one of multiple roles: normal, as part of an airway,
 * as part of a flight plan, as the active waypoint in a flight plan, and as a highlighted waypoint. For the renderer
 * to draw a waypoint, the waypoint must first be registered with the renderer. Waypoints may be registered under
 * multiple render roles. However, a waypoint will only be rendered in one role at any point in time, chosen based on
 * the following order of precedence: highlighted > active flight plan > flight plan > normal > airway.
 */
export class MapWaypointRenderer {
  private static readonly DEFAULT_ROLE_INFO = {
    iconFactory: null,
    labelFactory: null,
    canvasContext: null,
    visibilityHandler: (): boolean => true
  };

  private readonly registered = new Map<string, MapWaypointRenderer.MapWaypointRendererEntry<Waypoint>>();
  private readonly toCleanUp = new Set<MapWaypointRenderer.MapWaypointRendererEntry<Waypoint>>();
  private readonly roleInfos: Record<MapWaypointRenderRole, MapWaypointRenderRoleInfo> = {
    [MapWaypointRenderRole.Highlight]: Object.assign({}, MapWaypointRenderer.DEFAULT_ROLE_INFO),
    [MapWaypointRenderRole.FlightPlanActive]: Object.assign({}, MapWaypointRenderer.DEFAULT_ROLE_INFO),
    [MapWaypointRenderRole.FlightPlanInactive]: Object.assign({}, MapWaypointRenderer.DEFAULT_ROLE_INFO),
    [MapWaypointRenderRole.Normal]: Object.assign({}, MapWaypointRenderer.DEFAULT_ROLE_INFO),
    [MapWaypointRenderRole.Airway]: Object.assign({}, MapWaypointRenderer.DEFAULT_ROLE_INFO),
    [MapWaypointRenderRole.VNav]: Object.assign({}, MapWaypointRenderer.DEFAULT_ROLE_INFO)
  };
  private readonly allRoles = Object.keys(this.roleInfos) as unknown as MapWaypointRenderRole[];

  /**
   * Constructor.
   * @param textManager The text manager to use for waypoint labels.
   */
  constructor(private readonly textManager: MapCullableTextLabelManager) {
  }

  /**
   * Sets the factory to use to create waypoint icons for a render role.
   * @param role A render role.
   * @param factory A waypoint icon factory.
   */
  public setIconFactory(role: MapWaypointRenderRole, factory: MapWaypointRendererIconFactory): void {
    this.roleInfos[role].iconFactory = factory;
  }

  /**
   * Sets the factory to use to create waypoint labels for a render role.
   * @param role A render role.
   * @param factory A waypoint label factory.
   */
  public setLabelFactory(role: MapWaypointRenderRole, factory: MapWaypointRendererLabelFactory): void {
    this.roleInfos[role].labelFactory = factory;
  }

  /**
   * Sets the canvas rendering context for a render role.
   * @param role A render role.
   * @param context - a canvas 2D rendering context.
   */
  public setCanvasContext(role: MapWaypointRenderRole, context: CanvasRenderingContext2D): void {
    this.roleInfos[role].canvasContext = context;
  }

  /**
   * Sets the handler that determines if a waypoint should visible for a render role.
   * @param role A render role.
   * @param handler A function that determines if a waypoint should be visible.
   */
  public setVisibilityHandler(role: MapWaypointRenderRole, handler: (waypoint: Waypoint) => boolean): void {
    this.roleInfos[role].visibilityHandler = handler;
  }

  /**
   * Checks if a waypoint is registered with this renderer. A role or roles can be optionally specified such that the
   * method will only return true if the waypoint is registered under those specific roles.
   * @param waypoint A waypoint.
   * @param role The specific role(s) to check.
   * @returns whether the waypoint is registered with this renderer.
   */
  public isRegistered(waypoint: Waypoint, role?: number): boolean {
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
  public register(waypoint: Waypoint, role: number, sourceId: string): void {
    if (role === 0 || sourceId === '') {
      return;
    }

    let entry = this.registered.get(waypoint.uid);
    if (!entry) {
      entry = new MapWaypointRenderer.MapWaypointRendererEntry(this, waypoint);
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
  public deregister(waypoint: Waypoint, role: number, sourceId: string): void {
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
  private deleteEntry(entry: MapWaypointRenderer.MapWaypointRendererEntry<Waypoint>): void {
    this.registered.delete(entry.waypoint.uid);
    this.toCleanUp.add(entry);
  }

  /**
   * Redraws waypoints registered with this renderer.
   * @param mapProjection The map projection to use.
   */
  public update(mapProjection: MapProjection): void {
    this.toCleanUp.forEach(entry => {
      entry.destroy();
    });
    this.toCleanUp.clear();

    const entriesToDrawIcon: MapWaypointRenderer.MapWaypointRendererEntry<Waypoint>[] = [];
    this.registered.forEach(entry => {
      entry.update(mapProjection);
      if (entry.icon) {
        entriesToDrawIcon.push(entry);
      }
    });

    const projectedSize = mapProjection.getProjectedSize();
    const len = this.allRoles.length;
    for (let i = 0; i < len; i++) {
      const context = this.roleInfos[this.allRoles[i]].canvasContext;
      if (context) {
        context.clearRect(0, 0, projectedSize[0], projectedSize[1]);
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    entriesToDrawIcon.sort((a, b) => a.icon!.priority - b.icon!.priority);
    const len2 = entriesToDrawIcon.length;
    for (let i = 0; i < len2; i++) {
      const entry = entriesToDrawIcon[i];
      const icon = entry.icon;
      const context = this.roleInfos[entry.lastShownRole].canvasContext;
      if (context) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        icon!.draw(context, mapProjection);
      }
    }
  }

  /**
   * An entry for a waypoint registered with MapWaypointRenderer.
   */
  private static MapWaypointRendererEntry = class <T extends Waypoint> {
    private readonly registrations = {
      [MapWaypointRenderRole.Highlight]: new Set<string>(),
      [MapWaypointRenderRole.FlightPlanActive]: new Set<string>(),
      [MapWaypointRenderRole.FlightPlanInactive]: new Set<string>(),
      [MapWaypointRenderRole.Normal]: new Set<string>(),
      [MapWaypointRenderRole.Airway]: new Set<string>(),
      [MapWaypointRenderRole.VNav]: new Set<string>(),
    };

    private _roles = 0;
    private _icon: MapWaypointIcon<T> | null = null;
    private _label: MapCullableTextLabel | null = null;
    private _lastShownRole: MapWaypointRenderRole | 0 = 0;

    /**
     * Constructor.
     * @param renderer The renderer to which this entry belongs.
     * @param waypoint The waypoint associated with this entry.
     */
    constructor(private readonly renderer: MapWaypointRenderer, public readonly waypoint: T) {
    }

    // eslint-disable-next-line jsdoc/require-returns
    /** The render role(s) assigned to this entry. */
    public get roles(): number {
      return this._roles;
    }

    // eslint-disable-next-line jsdoc/require-returns
    /** The role under which this entry was last rendered, or 0 if this entry has not yet been rendered. */
    public get lastShownRole(): MapWaypointRenderRole | 0 {
      return this._lastShownRole;
    }

    // eslint-disable-next-line jsdoc/require-returns
    /** This entry's waypoint icon. */
    public get icon(): MapWaypointIcon<T> | null {
      return this._icon;
    }

    // eslint-disable-next-line jsdoc/require-returns
    /** This entry's waypoint label. */
    public get label(): MapCullableTextLabel | null {
      return this._label;
    }

    /**
     * Checks whether this entry is assigned any of the specified render roles. Optionally, this method can also check
     * if this entry was last rendered in any of the specified roles instead.
     * @param roles The render roles against which to check.
     * @param useLastShown Whether to check the role in which this entry was last rendered instead of the current roles
     * assigned to this entry. False by default.
     * @returns whether the check passed.
     */
    public isAnyRole(roles: number, useLastShown = false): boolean {
      let toCompare;
      if (useLastShown) {
        toCompare = this.lastShownRole;
      } else {
        toCompare = this.roles;
      }
      return BitFlags.isAny(toCompare, roles);
    }

    /**
     * Checks whether this entry is assigned only the specified render role(s). Optionally, this method can also check
     * if this entry was last rendered in only the specified role(s) instead.
     * @param roles The render roles against which to check.
     * @param lastShown Whether to check the role in which this entry was last rendered instead of the current roles
     * assigned to this entry. False by default.
     * @returns whether the check passed.
     */
    public isOnlyRole(roles: number, lastShown = false): boolean {
      let toCompare;
      if (lastShown) {
        toCompare = this.lastShownRole;
      } else {
        toCompare = this.roles;
      }
      return toCompare === roles;
    }

    /**
     * Checks whether this entry is assigned all the specified render role(s). Optionally, this method can also check
     * if this entry was last rendered in all the specified role(s) instead.
     * @param roles - the render role(s) against which to check.
     * @param lastShown Whether to check the role in which this entry was last rendered instead of the current roles
     * assigned to this entry. False by default.
     * @returns whether the check passed.
     */
    public isAllRoles(roles: number, lastShown = false): boolean {
      let toCompare;
      if (lastShown) {
        toCompare = this.lastShownRole;
      } else {
        toCompare = this.roles;
      }
      return BitFlags.isAll(toCompare, roles);
    }

    /**
     * Assigns one or more render roles to this entry.
     * @param roles The render role(s) to assign.
     * @param sourceId The unique string ID of the source of the assignment.
     */
    public addRole(roles: number, sourceId: string): void {
      BitFlags.forEach(roles, (value, index) => { this.registrations[1 << index].add(sourceId); }, true, 0, 6);
      this._roles = this._roles | roles;
    }

    /**
     * Removes one or more render roles from this entry.
     * @param roles The render role(s) to remove.
     * @param sourceId The unique string ID of the soruce of the de-assignment.
     */
    public removeRole(roles: number, sourceId: string): void {
      BitFlags.forEach(roles, (value, index) => {
        const role = 1 << index;
        const registrations = this.registrations[role];
        registrations.delete(sourceId);
        if (registrations.size === 0) {
          this._roles = this._roles & ~role;
        }
      }, true, 0, 6);
    }

    /**
     * Prepares this entry for rendering.
     * @param showRole The role in which this entry should be rendered.
     * @param iconFactory The factory to use to get a waypoint icon.
     * @param labelFactory The factory to use to get a waypoint label.
     */
    private prepareRender(
      showRole: MapWaypointRenderRole,
      iconFactory: MapWaypointRendererIconFactory | null,
      labelFactory: MapWaypointRendererLabelFactory | null
    ): void {
      if (showRole === this._lastShownRole) {
        return;
      }

      this._icon = iconFactory?.getIcon(this.waypoint) ?? null;

      const label = labelFactory?.getLabel(this.waypoint) ?? null;
      if (this._label && this._label !== label) {
        this.renderer.textManager.deregister(this._label);
      }
      if (label && label !== this._label) {
        this.renderer.textManager.register(label);
      }
      this._label = label;

      this._lastShownRole = showRole;
    }

    /**
     * Updates this entry. An appropriate render role is selected, then the icon and label are updated as appropriate
     * for the chosen role. If the waypoint's label should be visible, it is added to the appropriate text manager.
     * Of note, this method will not draw the waypoint icon to a canvas element; it will simply ensure the .showIcon
     * property contains the correct value depending on whether the icon should be visible.
     * @param mapProjection The map projection to use.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public update(mapProjection: MapProjection): void {
      let showRole: MapWaypointRenderRole | 0 = 0;

      if (
        this.isAnyRole(MapWaypointRenderRole.Highlight)
        && this.renderer.roleInfos[MapWaypointRenderRole.Highlight].visibilityHandler(this.waypoint)
      ) {
        showRole = MapWaypointRenderRole.Highlight;
      } else if (
        this.isAnyRole(MapWaypointRenderRole.FlightPlanActive)
        && this.renderer.roleInfos[MapWaypointRenderRole.FlightPlanActive].visibilityHandler(this.waypoint)
      ) {
        showRole = MapWaypointRenderRole.FlightPlanActive;
      } else if (
        this.isAnyRole(MapWaypointRenderRole.FlightPlanInactive)
        && this.renderer.roleInfos[MapWaypointRenderRole.FlightPlanInactive].visibilityHandler(this.waypoint)
      ) {
        showRole = MapWaypointRenderRole.FlightPlanInactive;
      } else if (
        this.isAnyRole(MapWaypointRenderRole.Normal)
        && this.renderer.roleInfos[MapWaypointRenderRole.Normal].visibilityHandler(this.waypoint)
      ) {
        showRole = MapWaypointRenderRole.Normal;
      } else if (
        this.isAnyRole(MapWaypointRenderRole.Airway)
        && this.renderer.roleInfos[MapWaypointRenderRole.Airway].visibilityHandler(this.waypoint)
      ) {
        showRole = MapWaypointRenderRole.Airway;
      } else if (
        this.isAnyRole(MapWaypointRenderRole.VNav)
        && this.renderer.roleInfos[MapWaypointRenderRole.VNav].visibilityHandler(this.waypoint)
      ) {
        showRole = MapWaypointRenderRole.VNav;
      }

      const iconFactory = this.renderer.roleInfos[showRole]?.iconFactory ?? null;
      const labelFactory = this.renderer.roleInfos[showRole]?.labelFactory ?? null;
      this.prepareRender(showRole, iconFactory, labelFactory);
    }

    /**
     * Destroys this entry. Any label from this entry currently registered with the text manager will be deregistered.
     */
    public destroy(): void {
      if (this._label) {
        this.renderer.textManager.deregister(this._label);
      }
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace MapWaypointRenderer {
  /** An entry for a waypoint registered with MapWaypointRenderer. */
  type MapWaypointRendererEntry<T extends Waypoint> = {
    /** The waypoint associated with this entry. */
    readonly waypoint: Waypoint;

    /** The render role(s) assigned to this entry. */
    readonly roles: number;

    /** The role under which this entry was last rendered, or 0 if this entry has not yet been rendered. */
    readonly lastShownRole: MapWaypointRenderRole | 0;

    /** This entry's waypoint icon. */
    readonly icon: MapWaypointIcon<T> | null;

    /** This entry's waypoint label. */
    readonly label: MapCullableTextLabel | null;

    /**
     * Checks whether this entry is assigned any of the specified render roles. Optionally, this method can also check
     * if this entry was last rendered in any of the specified roles instead.
     * @param roles The render roles against which to check.
     * @param useLastShown Whether to check the role in which this entry was last rendered instead of the current roles
     * assigned to this entry. False by default.
     * @returns whether the check passed.
     */
    isAnyRole(roles: number, useLastShown?: boolean): boolean;

    /**
     * Checks whether this entry is assigned only the specified render role(s). Optionally, this method can also check
     * if this entry was last rendered in only the specified role(s) instead.
     * @param roles The render roles against which to check.
     * @param lastShown Whether to check the role in which this entry was last rendered instead of the current roles
     * assigned to this entry. False by default.
     * @returns whether the check passed.
     */
    isOnlyRole(roles: number, useLastShown?: boolean): boolean;

    /**
     * Checks whether this entry is assigned all the specified render role(s). Optionally, this method can also check
     * if this entry was last rendered in all the specified role(s) instead.
     * @param roles - the render role(s) against which to check.
     * @param lastShown Whether to check the role in which this entry was last rendered instead of the current roles
     * assigned to this entry. False by default.
     * @returns whether the check passed.
     */
    isAllRoles(roles: number, useLastShown?: boolean): boolean;

    /**
     * Assigns one or more render roles to this entry.
     * @param roles The render role(s) to assign.
     * @param sourceId The unique string ID of the source of the assignment.
     */
    addRole(roles: number, sourceId: string): void;

    /**
     * Removes one or more render roles from this entry.
     * @param roles The render role(s) to remove.
     * @param sourceId The unique string ID of the source of the de-assignment.
     */
    removeRole(roles: number, sourceId: string): void;

    /**
     * Updates this entry. An appropriate render role is selected, then the icon and label are updated as appropriate
     * for the chosen role. If the waypoint's label should be visible, it is added to the appropriate text manager.
     * Of note, this method will not draw the waypoint icon to a canvas element; it will simply ensure the .showIcon
     * property contains the correct value depending on whether the icon should be visible.
     * @param mapProjection The map projection to use.
     */
    update(mapProjection: MapProjection): void;

    /**
     * Destroys this entry. Any label from this entry currently registered with the text manager will be deregistered.
     */
    destroy(): void;
  }
}