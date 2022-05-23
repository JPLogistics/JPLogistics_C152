import { GeoPoint } from '../../../geo';
import { BitFlags, UnitType } from '../../../math';
import { TCASAlertLevel, TCASOperatingMode } from '../../../traffic';
import { FSComponent } from '../../FSComponent';
import { MapLayer, MapProjectionChangeType, MapSyncedCanvasLayer } from '../../map';
import { MapOwnshipModule } from '../modules/MapOwnshipModule';
import { MapTrafficAlertLevelVisibility, MapTrafficModule } from '../modules/MapTrafficModule';
/**
 * A map layer which displays traffic intruders.
 */
export class MapSystemTrafficLayer extends MapLayer {
    constructor() {
        super(...arguments);
        this.iconLayerRef = FSComponent.createRef();
        this.trafficModule = this.props.model.getModule(MapTrafficModule.name);
        this.ownshipModule = this.props.model.getModule(MapOwnshipModule.name);
        this.intruderViews = {
            [TCASAlertLevel.None]: new Map(),
            [TCASAlertLevel.ProximityAdvisory]: new Map(),
            [TCASAlertLevel.TrafficAdvisory]: new Map(),
            [TCASAlertLevel.ResolutionAdvisory]: new Map()
        };
        this.isInit = false;
    }
    /** @inheritdoc */
    onVisibilityChanged(isVisible) {
        if (!isVisible) {
            if (this.isInit) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                this.iconLayerRef.instance.display.clear();
            }
        }
    }
    /** @inheritdoc */
    onAttached() {
        this.iconLayerRef.instance.onAttached();
        this.trafficModule.operatingMode.sub(this.updateVisibility.bind(this));
        this.trafficModule.show.sub(this.updateVisibility.bind(this), true);
        this.initCanvasStyles();
        this.initIntruders();
        this.initTCASHandlers();
        this.isInit = true;
    }
    /**
     * Initializes canvas styles.
     */
    initCanvasStyles() {
        this.props.initCanvasStyles && this.props.initCanvasStyles(this.iconLayerRef.instance.display.context);
    }
    /**
     * Initializes all currently existing TCAS intruders.
     */
    initIntruders() {
        const intruders = this.trafficModule.tcas.getIntruders();
        const len = intruders.length;
        for (let i = 0; i < len; i++) {
            this.onIntruderAdded(intruders[i]);
        }
    }
    /**
     * Initializes handlers to respond to TCAS events.
     */
    initTCASHandlers() {
        const tcasSub = this.props.bus.getSubscriber();
        tcasSub.on('tcas_intruder_added').handle(this.onIntruderAdded.bind(this));
        tcasSub.on('tcas_intruder_removed').handle(this.onIntruderRemoved.bind(this));
        tcasSub.on('tcas_intruder_alert_changed').handle(this.onIntruderAlertLevelChanged.bind(this));
    }
    /** @inheritdoc */
    onMapProjectionChanged(mapProjection, changeFlags) {
        this.iconLayerRef.instance.onMapProjectionChanged(mapProjection, changeFlags);
        if (BitFlags.isAll(changeFlags, MapProjectionChangeType.ProjectedSize)) {
            this.initCanvasStyles();
        }
    }
    /** @inheritdoc */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onUpdated(time, elapsed) {
        if (!this.isVisible()) {
            return;
        }
        this.redrawIntruders();
    }
    /**
     * Redraws all tracked intruders.
     */
    redrawIntruders() {
        const alertLevelVisFlags = this.trafficModule.alertLevelVisibility.get();
        const offScaleRange = this.trafficModule.offScaleRange.get();
        const iconDisplay = this.iconLayerRef.instance.display;
        iconDisplay.clear();
        if (BitFlags.isAll(alertLevelVisFlags, MapTrafficAlertLevelVisibility.Other)) {
            this.intruderViews[TCASAlertLevel.None].forEach(view => {
                view.draw(this.props.mapProjection, iconDisplay.context, offScaleRange);
            });
        }
        if (BitFlags.isAll(alertLevelVisFlags, MapTrafficAlertLevelVisibility.ProximityAdvisory)) {
            this.intruderViews[TCASAlertLevel.ProximityAdvisory].forEach(view => {
                view.draw(this.props.mapProjection, iconDisplay.context, offScaleRange);
            });
        }
        if (BitFlags.isAll(alertLevelVisFlags, MapTrafficAlertLevelVisibility.TrafficAdvisory)) {
            this.intruderViews[TCASAlertLevel.TrafficAdvisory].forEach(view => {
                view.draw(this.props.mapProjection, iconDisplay.context, offScaleRange);
            });
        }
        if (BitFlags.isAll(alertLevelVisFlags, MapTrafficAlertLevelVisibility.ResolutionAdvisory)) {
            this.intruderViews[TCASAlertLevel.ResolutionAdvisory].forEach(view => {
                view.draw(this.props.mapProjection, iconDisplay.context, offScaleRange);
            });
        }
    }
    /**
     * Updates this layer's visibility.
     */
    updateVisibility() {
        this.setVisible(this.trafficModule.tcas.getOperatingMode() !== TCASOperatingMode.Standby && this.trafficModule.show.get());
    }
    /**
     * A callback which is called when a TCAS intruder is added.
     * @param intruder The new intruder.
     */
    onIntruderAdded(intruder) {
        const icon = this.props.iconFactory(intruder, this.trafficModule, this.ownshipModule);
        this.intruderViews[intruder.alertLevel.get()].set(intruder, icon);
    }
    /**
     * A callback which is called when a TCAS intruder is removed.
     * @param intruder The removed intruder.
     */
    onIntruderRemoved(intruder) {
        this.intruderViews[intruder.alertLevel.get()].delete(intruder);
    }
    /**
     * A callback which is called when the alert level of a TCAS intruder is changed.
     * @param intruder The intruder.
     */
    onIntruderAlertLevelChanged(intruder) {
        let oldAlertLevel;
        let view = this.intruderViews[oldAlertLevel = TCASAlertLevel.None].get(intruder);
        view !== null && view !== void 0 ? view : (view = this.intruderViews[oldAlertLevel = TCASAlertLevel.ProximityAdvisory].get(intruder));
        view !== null && view !== void 0 ? view : (view = this.intruderViews[oldAlertLevel = TCASAlertLevel.TrafficAdvisory].get(intruder));
        view !== null && view !== void 0 ? view : (view = this.intruderViews[oldAlertLevel = TCASAlertLevel.ResolutionAdvisory].get(intruder));
        if (view) {
            this.intruderViews[oldAlertLevel].delete(intruder);
            this.intruderViews[intruder.alertLevel.get()].set(intruder, view);
        }
    }
    /** @inheritdoc */
    render() {
        return (FSComponent.buildComponent(MapSyncedCanvasLayer, { ref: this.iconLayerRef, model: this.props.model, mapProjection: this.props.mapProjection }));
    }
}
/**
 *
 */
export class AbstractMapTrafficIntruderIcon {
    /**
     * Constructor.
     * @param intruder This icon's associated intruder.
     * @param trafficModule The traffic module for this icon's parent map.
     * @param ownshipModule The ownship module for this icon's parent map.
     */
    constructor(intruder, trafficModule, ownshipModule) {
        this.intruder = intruder;
        this.trafficModule = trafficModule;
        this.ownshipModule = ownshipModule;
        this.projectedPos = new Float64Array(2);
        this.isOffScale = false;
    }
    /**
     * Draws this icon.
     * @param projection The map projection.
     * @param context The canvas rendering context to which to draw this icon.
     * @param offScaleRange The distance from the own airplane to this icon's intruder beyond which the intruder is
     * considered off-scale. If the value is `NaN`, the intruder is never considered off-scale.
     */
    draw(projection, context, offScaleRange) {
        this.updatePosition(projection, offScaleRange);
        this.drawIcon(projection, context, this.projectedPos, this.isOffScale);
    }
    /**
     * Updates this icon's intruder's projected position and off-scale status.
     * @param projection The map projection.
     * @param offScaleRange The distance from the own airplane to this icon's intruder beyond which the intruder is
     * considered off-scale. If the value is `NaN`, the intruder is never considered off-scale.
     */
    updatePosition(projection, offScaleRange) {
        const ownAirplanePos = this.ownshipModule.position.get();
        if (offScaleRange.isNaN()) {
            projection.project(this.intruder.position, this.projectedPos);
            this.isOffScale = false;
        }
        else {
            this.handleOffScaleRange(projection, ownAirplanePos, offScaleRange);
        }
    }
    /**
     * Updates this icon's intruder's projected position and off-scale status using a specific range from the own
     * airplane to define off-scale.
     * @param projection The map projection.
     * @param ownAirplanePos The position of the own airplane.
     * @param offScaleRange The distance from the own airplane to this icon's intruder beyond which the intruder is
     * considered off-scale.
     */
    handleOffScaleRange(projection, ownAirplanePos, offScaleRange) {
        const intruderPos = this.intruder.position;
        const horizontalSeparation = intruderPos.distance(ownAirplanePos);
        const offscaleRangeRad = offScaleRange.asUnit(UnitType.GA_RADIAN);
        if (horizontalSeparation > offscaleRangeRad) {
            this.isOffScale = true;
            projection.project(ownAirplanePos.offset(ownAirplanePos.bearingTo(intruderPos), offscaleRangeRad, AbstractMapTrafficIntruderIcon.geoPointCache[0]), this.projectedPos);
        }
        else {
            this.isOffScale = false;
            projection.project(intruderPos, this.projectedPos);
        }
    }
}
AbstractMapTrafficIntruderIcon.geoPointCache = [new GeoPoint(0, 0)];
