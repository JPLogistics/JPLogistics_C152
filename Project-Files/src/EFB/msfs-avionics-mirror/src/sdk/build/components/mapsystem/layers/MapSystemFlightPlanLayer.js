import { NullPathStream } from '../../../graphics/path';
import { FacilityLoader, FacilityRepository, FacilityWaypointCache, FlightPathWaypoint, ICAO, LegType } from '../../../navigation';
import { FSComponent } from '../../FSComponent';
import { MapCachedCanvasLayer } from '../../map/layers/MapCachedCanvasLayer';
import { MapSyncedCanvasLayer } from '../../map/layers/MapSyncedCanvasLayer';
import { MapLayer } from '../../map/MapLayer';
import { GeoProjectionPathStreamStack } from '../../map/GeoProjectionPathStreamStack';
import { MapSystemWaypointRoles } from '../MapSystemWaypointRoles';
import { MapFlightPlanModule } from '../modules/MapFlightPlanModule';
/**
 * A map system layer that draws the flight plan.
 */
export class MapSystemFlightPlanLayer extends MapLayer {
    constructor() {
        var _a;
        super(...arguments);
        this.flightPathLayerRef = FSComponent.createRef();
        this.waypointLayerRef = FSComponent.createRef();
        this.defaultRoleId = (_a = this.props.waypointRenderer.getRoleFromName(MapSystemWaypointRoles.FlightPlan)) !== null && _a !== void 0 ? _a : 0;
        this.planModule = this.props.model.getModule(MapFlightPlanModule.name);
        this.legWaypoints = new Map();
        this.waypointsUpdating = false;
        this.facLoader = new FacilityLoader(FacilityRepository.getRepository(this.props.bus));
        this.facWaypointCache = FacilityWaypointCache.getCache();
        this.pathStreamStack = new GeoProjectionPathStreamStack(NullPathStream.INSTANCE, this.props.mapProjection.getGeoProjection(), Math.PI / 12, 0.25, 8);
        this.updateScheduled = false;
    }
    /** @inheritdoc */
    onAttached() {
        this.flightPathLayerRef.instance.onAttached();
        this.waypointLayerRef.instance.onAttached();
        this.pathStreamStack.setConsumer(this.flightPathLayerRef.instance.display.context);
        this.initWaypointRenderer();
        this.planModule.getPlanSubjects(this.props.planIndex).flightPlan.sub(() => this.updateScheduled = true);
        this.planModule.getPlanSubjects(this.props.planIndex).planCalculated.on(() => this.updateScheduled = true);
        this.planModule.getPlanSubjects(this.props.planIndex).planChanged.on(() => this.updateScheduled = true);
        this.planModule.getPlanSubjects(this.props.planIndex).activeLeg.sub(() => this.updateScheduled = true);
        this.props.waypointRenderer.onRolesAdded.on(() => this.initWaypointRenderer());
        super.onAttached();
    }
    /**
     * Initializes the waypoint renderer for this layer.
     */
    initWaypointRenderer() {
        let hasDefaultRole = false;
        const flightPlanRoles = this.props.waypointRenderer.getRoleNamesByGroup(`${MapSystemWaypointRoles.FlightPlan}_${this.props.planIndex}`);
        for (let i = 0; i < flightPlanRoles.length; i++) {
            const roleId = this.props.waypointRenderer.getRoleFromName(flightPlanRoles[i]);
            if (roleId !== undefined) {
                this.props.waypointRenderer.setCanvasContext(roleId, this.waypointLayerRef.instance.display.context);
                this.props.waypointRenderer.setIconFactory(roleId, this.props.iconFactory);
                this.props.waypointRenderer.setLabelFactory(roleId, this.props.labelFactory);
                if (!hasDefaultRole) {
                    this.props.flightPathRenderer.defaultRoleId = roleId;
                    hasDefaultRole = true;
                }
            }
        }
    }
    /** @inheritdoc */
    onUpdated(time, elapsed) {
        this.flightPathLayerRef.instance.onUpdated(time, elapsed);
        this.waypointLayerRef.instance.onUpdated(time, elapsed);
        if (this.isVisible()) {
            const display = this.flightPathLayerRef.instance.display;
            if (display.isInvalid) {
                display.clear();
                display.syncWithMapProjection(this.props.mapProjection);
                this.updateScheduled = true;
            }
            if (this.updateScheduled) {
                if (!this.waypointsUpdating) {
                    this.updateWaypoints();
                }
                const context = display.context;
                display.clear();
                const plan = this.planModule.getPlanSubjects(this.props.planIndex).flightPlan.get();
                if (plan !== undefined) {
                    this.pathStreamStack.setProjection(display.geoProjection);
                    this.props.flightPathRenderer.render(plan, undefined, undefined, context, this.pathStreamStack);
                }
            }
        }
    }
    /** @inheritdoc */
    onMapProjectionChanged(mapProjection, changeFlags) {
        this.flightPathLayerRef.instance.onMapProjectionChanged(mapProjection, changeFlags);
        this.waypointLayerRef.instance.onMapProjectionChanged(mapProjection, changeFlags);
    }
    /** @inheritdoc */
    setVisible(val) {
        super.setVisible(val);
        this.waypointLayerRef.instance.setVisible(val);
        this.flightPathLayerRef.instance.setVisible(val);
    }
    /**
     * Updates waypoints for the flight plan.
     * @throws An error if the waypoints are already updating.
     */
    async updateWaypoints() {
        if (this.waypointsUpdating) {
            throw new Error('A flight plan waypoint update is already in progress.');
        }
        this.waypointsUpdating = true;
        const flightPlan = this.planModule.getPlanSubjects(this.props.planIndex).flightPlan.get();
        const activeLegIndex = this.planModule.getPlanSubjects(this.props.planIndex).activeLeg.get();
        if (flightPlan === undefined) {
            for (const legWaypoint of this.legWaypoints.values()) {
                const [waypoint, roleId] = legWaypoint;
                this.props.waypointRenderer.deregister(waypoint, roleId, MapSystemWaypointRoles.FlightPlan);
            }
            this.legWaypoints.clear();
            this.waypointsUpdating = false;
            return;
        }
        const activeLeg = flightPlan.tryGetLeg(activeLegIndex);
        const legsToDisplay = new Map();
        let legIndex = 0;
        for (const leg of flightPlan.legs()) {
            let roleId = this.defaultRoleId;
            const handler = this.props.flightPathRenderer.legWaypointHandlers.get(this.props.planIndex);
            if (handler !== undefined) {
                roleId = handler(flightPlan, leg, activeLeg, legIndex, activeLegIndex);
            }
            if (roleId !== 0) {
                legsToDisplay.set(leg, roleId);
            }
            legIndex++;
        }
        // Remove records of legs that are no longer in the set of legs to display.
        for (const leg of this.legWaypoints) {
            const [legDefinition, legWaypoint] = leg;
            const [waypoint, roleId] = legWaypoint;
            if (!legsToDisplay.has(legDefinition)) {
                this.props.waypointRenderer.deregister(waypoint, roleId, MapSystemWaypointRoles.FlightPlan);
                this.legWaypoints.delete(legDefinition);
            }
        }
        const waypointRefreshes = [];
        // Create or refresh waypoints to display
        for (const leg of legsToDisplay) {
            waypointRefreshes.push(this.buildPlanWaypoint(leg[0], leg[1]));
        }
        await Promise.all(waypointRefreshes);
        this.waypointsUpdating = false;
    }
    /**
     * Builds or refreshes a flight plan waypoint.
     * @param leg The leg to build the waypoint for.
     * @param roleId The role ID to assign to the waypoint.
     */
    async buildPlanWaypoint(leg, roleId) {
        switch (leg.leg.type) {
            case LegType.CD:
            case LegType.VD:
            case LegType.CR:
            case LegType.VR:
            case LegType.FC:
            case LegType.FD:
            case LegType.FA:
            case LegType.CA:
            case LegType.VA:
            case LegType.FM:
            case LegType.VM:
            case LegType.CI:
            case LegType.VI:
                await this.buildTerminatorWaypoint(leg, roleId);
                break;
            case LegType.Discontinuity:
            case LegType.ThruDiscontinuity:
                break;
            default:
                await this.buildFixWaypoint(leg, roleId);
                break;
        }
    }
    /**
     * Builds a flight path terminator based waypoint.
     * @param leg The leg to build the waypoint for.
     * @param roleId The role ID to assign to the waypoint.
     */
    async buildTerminatorWaypoint(leg, roleId) {
        var _a, _b, _c, _d, _e, _f;
        const currentLeg = this.legWaypoints.get(leg);
        if (currentLeg !== undefined) {
            const [waypoint, currentRoleId] = currentLeg;
            const lastVector = (_a = leg.calculated) === null || _a === void 0 ? void 0 : _a.flightPath[((_b = leg.calculated) === null || _b === void 0 ? void 0 : _b.flightPath.length) - 1];
            if (lastVector !== undefined) {
                if (!waypoint.location.equals(lastVector.endLat, lastVector.endLon)) {
                    this.props.waypointRenderer.deregister(waypoint, currentRoleId, MapSystemWaypointRoles.FlightPlan);
                    const newWaypoint = new FlightPathWaypoint(lastVector.endLat, lastVector.endLon, (_c = leg.name) !== null && _c !== void 0 ? _c : '');
                    this.legWaypoints.set(leg, [newWaypoint, roleId]);
                    this.props.waypointRenderer.register(newWaypoint, roleId, MapSystemWaypointRoles.FlightPlan);
                }
                else if (currentRoleId !== roleId) {
                    this.props.waypointRenderer.deregister(waypoint, currentRoleId, MapSystemWaypointRoles.FlightPlan);
                    this.props.waypointRenderer.register(waypoint, roleId, MapSystemWaypointRoles.FlightPlan);
                    this.legWaypoints.set(leg, [waypoint, roleId]);
                }
            }
            else {
                this.props.waypointRenderer.deregister(waypoint, currentRoleId, MapSystemWaypointRoles.FlightPlan);
            }
        }
        else {
            const lastVector = (_d = leg.calculated) === null || _d === void 0 ? void 0 : _d.flightPath[((_e = leg.calculated) === null || _e === void 0 ? void 0 : _e.flightPath.length) - 1];
            if (lastVector !== undefined) {
                const newWaypoint = new FlightPathWaypoint(lastVector.endLat, lastVector.endLon, (_f = leg.name) !== null && _f !== void 0 ? _f : '');
                this.legWaypoints.set(leg, [newWaypoint, roleId]);
                this.props.waypointRenderer.register(newWaypoint, roleId, MapSystemWaypointRoles.FlightPlan);
            }
        }
    }
    /**
     * Builds a standard facility fix waypoint for flight plan waypoint display.
     * @param leg The leg to build the waypoint for.
     * @param roleId The role ID to assign to the waypoint.
     */
    async buildFixWaypoint(leg, roleId) {
        const legWaypoint = this.legWaypoints.get(leg);
        if (legWaypoint === undefined) {
            const facIcao = leg.leg.fixIcao;
            let facility;
            try {
                facility = await this.facLoader.getFacility(ICAO.getFacilityType(facIcao), facIcao);
            }
            catch (err) {
                /* continue */
            }
            if (facility !== undefined) {
                const waypoint = this.facWaypointCache.get(facility);
                this.props.waypointRenderer.register(waypoint, roleId, MapSystemWaypointRoles.FlightPlan);
                this.legWaypoints.set(leg, [waypoint, roleId]);
            }
        }
        else {
            const [waypoint, currentRoleId] = legWaypoint;
            if (currentRoleId !== roleId) {
                this.props.waypointRenderer.deregister(waypoint, currentRoleId, MapSystemWaypointRoles.FlightPlan);
                this.props.waypointRenderer.register(waypoint, roleId, MapSystemWaypointRoles.FlightPlan);
                this.legWaypoints.set(leg, [waypoint, roleId]);
            }
        }
    }
    /** @inheritdoc */
    render() {
        return (FSComponent.buildComponent(FSComponent.Fragment, null,
            FSComponent.buildComponent(MapCachedCanvasLayer, { ref: this.flightPathLayerRef, model: this.props.model, mapProjection: this.props.mapProjection, useBuffer: true, overdrawFactor: Math.SQRT2 }),
            FSComponent.buildComponent(MapSyncedCanvasLayer, { ref: this.waypointLayerRef, model: this.props.model, mapProjection: this.props.mapProjection })));
    }
}
