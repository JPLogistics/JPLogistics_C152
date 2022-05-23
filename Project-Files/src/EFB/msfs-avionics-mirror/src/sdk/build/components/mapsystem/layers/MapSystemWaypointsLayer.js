import { FacilitySearchType, FacilityWaypoint, WaypointTypes } from '../../../navigation';
import { UnitType } from '../../../math';
import { FSComponent } from '../../FSComponent';
import { MapAbstractNearestWaypointsLayer, MapSyncedCanvasLayer } from '../../map';
import { MapWaypointDisplayModule } from '../modules/MapWaypointDisplayModule';
import { MapSystemWaypointRoles } from '../MapSystemWaypointRoles';
/**
 * A class that renders waypoints into a layer.
 */
export class MapSystemWaypointsLayer extends MapAbstractNearestWaypointsLayer {
    constructor() {
        super(...arguments);
        this.canvasLayer = FSComponent.createRef();
        this.displayModule = this.props.model.getModule(MapWaypointDisplayModule.name);
    }
    /** @inheritdoc */
    onAttached() {
        this.canvasLayer.instance.onAttached();
        this.initEventHandlers();
        super.onAttached();
    }
    /** @inheritdoc */
    onUpdated(time, elapsed) {
        if (this.isVisible()) {
            super.onUpdated(time, elapsed);
            this.props.waypointRenderer.update(this.props.mapProjection);
        }
        this.canvasLayer.instance.onUpdated(time, elapsed);
    }
    /** @inheritdoc */
    initEventHandlers() {
        this.displayModule.numAirports.sub(num => this.searchItemLimits[FacilitySearchType.Airport] = num, true);
        this.displayModule.numIntersections.sub(num => this.searchItemLimits[FacilitySearchType.Intersection] = num, true);
        this.displayModule.numVors.sub(num => this.searchItemLimits[FacilitySearchType.Vor] = num, true);
        this.displayModule.numNdbs.sub(num => this.searchItemLimits[FacilitySearchType.Ndb] = num, true);
        this.displayModule.airportsRange.sub(num => this.searchRadiusLimits[FacilitySearchType.Airport] = num.asUnit(UnitType.GA_RADIAN), true);
        this.displayModule.intersectionsRange.sub(num => this.searchRadiusLimits[FacilitySearchType.Intersection] = num.asUnit(UnitType.GA_RADIAN), true);
        this.displayModule.vorsRange.sub(num => this.searchRadiusLimits[FacilitySearchType.Vor] = num.asUnit(UnitType.GA_RADIAN), true);
        this.displayModule.ndbsRange.sub(num => this.searchRadiusLimits[FacilitySearchType.Ndb] = num.asUnit(UnitType.GA_RADIAN), true);
        this.props.waypointRenderer.onRolesAdded.on(() => this.initWaypointRenderer());
    }
    /** @inheritdoc */
    initWaypointRenderer() {
        let hasDefaultId = false;
        const groupRoles = this.props.waypointRenderer.getRoleNamesByGroup(MapSystemWaypointRoles.Normal);
        groupRoles.forEach(id => {
            const roleId = this.props.waypointRenderer.getRoleFromName(id);
            if (roleId !== undefined) {
                this.props.waypointRenderer.setCanvasContext(roleId, this.canvasLayer.instance.display.context);
                this.props.waypointRenderer.setIconFactory(roleId, this.props.iconFactory);
                this.props.waypointRenderer.setLabelFactory(roleId, this.props.labelFactory);
                this.props.waypointRenderer.setVisibilityHandler(roleId, this.isWaypointVisible.bind(this));
                if (!hasDefaultId) {
                    this.defaultRenderRole = roleId;
                    hasDefaultId = true;
                }
            }
        });
    }
    /** @inheritdoc */
    setVisible(val) {
        super.setVisible(val);
        this.canvasLayer.instance.setVisible(val);
    }
    /**
     * Checks to see if a waypoint should be visible.
     * @param waypoint The waypoint to check.
     * @returns True if visible, false otherwise.
     */
    isWaypointVisible(waypoint) {
        if (waypoint instanceof FacilityWaypoint) {
            switch (waypoint.type) {
                case WaypointTypes.Airport:
                    return this.displayModule.showAirports.get()(waypoint);
                case WaypointTypes.Intersection:
                    return this.displayModule.showIntersections.get()(waypoint);
                case WaypointTypes.VOR:
                    return this.displayModule.showVors.get()(waypoint);
                case WaypointTypes.NDB:
                    return this.displayModule.showNdbs.get()(waypoint);
            }
        }
        return false;
    }
    /** @inheritdoc */
    render() {
        return (FSComponent.buildComponent(MapSyncedCanvasLayer, { ref: this.canvasLayer, model: this.props.model, mapProjection: this.props.mapProjection }));
    }
}
