/// <reference types="msfstypes/JS/Avionics" />

import {
  BitFlags, FSComponent, GeoPoint, GeoPointInterface, NumberUnitInterface, Subject, Subscribable, UnitFamily, UnitType,
  Vec2Math, Vec2Subject, VecNSubject, VNode
} from 'msfssdk';
import { FlightPlanner } from 'msfssdk/flightplan';
import {
  MapProjection, MapComponent, MapModel, MapComponentProps, MapOwnAirplaneLayer, MapProjectionChangeType,
  MapCullableTextLayer, MapCullableTextLabelManager, MapAirspaceLayer
} from 'msfssdk/components/map';
import { UserSettingManager } from 'msfssdk/settings';

import { LodBoundaryCache } from '../../Navigation/LodBoundaryCache';
import { NavMapModelModules } from './NavMapModel';
import { MapAirspaceRenderManager } from '../../Map/MapAirspaceRenderManager';
import { MapWaypointRenderer } from '../../Map/MapWaypointRenderer';
import { MapBingLayer } from '../../Map/Layers/MapBingLayer';
import { MapWaypointsLayer } from '../../Map/Layers/MapWaypointsLayer';
import { MapFlightPlanLayer } from '../../Map/Layers/MapFlightPlanLayer';
import { MapActiveFlightPlanDataProvider } from '../../Map/MapActiveFlightPlanDataProvider';
import { MapDetailIndicator } from '../../Map/Indicators/MapDetailIndicator';
import { MapTrafficIntruderOffScaleIndicator, MapTrafficIntruderOffScaleIndicatorMode } from '../../Map/Indicators/MapTrafficOffScaleIndicator';
import { MapTrafficIntruderLayer } from '../../Map/Layers/MapTrafficIntruderLayer';
import { MapPointerLayer } from '../../Map/Layers/MapPointerLayer';
import { MapCrosshairLayer } from '../../Map/Layers/MapCrosshairLayer';
import { MapTrackVectorLayer } from '../../Map/Layers/MapTrackVectorLayer';
import { MapAltitudeArcLayer } from '../../Map/Layers/MapAltitudeArcLayer';
import { MapOrientation } from '../../Map/Modules/MapOrientationModule';
import { MapWaypointFlightPlanStyles, MapWaypointNormalStyles, MapWaypointStyles } from '../../Map/MapWaypointStyles';
import { MapRangeDisplay } from '../../Map/MapRangeDisplay';
import { MapTrafficStatusIndicator } from '../../Map/Indicators/MapTrafficStatusIndicator';
import { MapOrientationSettingMode, MapUserSettingTypes } from '../../Map/MapUserSettings';
import { MapRangeSettings, MapRangeSettingTypes } from '../../Map/MapRangeSettings';
import { MapDeclutterController } from '../../Map/Controllers/MapDeclutterController';
import { MapTerrainController } from '../../Map/Controllers/MapTerrainController';
import { MapWaypointsVisController } from '../../Map/Controllers/MapWaypointsVisController';
import { MapAirspaceVisController } from '../../Map/Controllers/MapAirspaceVisController';
import { MapNexradController } from '../../Map/Controllers/MapNexradController';
import { MapOrientationIndicator } from '../../Map/Indicators/MapOrientationIndicator';
import { TrafficUserSettings } from '../../Traffic/TrafficUserSettings';
import { NavMapTrafficController } from './NavMapTrafficController';
import { MapCrosshairController } from '../../Map/Controllers/MapCrosshairController';
import { MapTrackVectorController } from '../../Map/Controllers/MapTrackVectorController';
import { MapAltitudeArcController } from '../../Map/Controllers/MapAltitudeArcController';
import { MapWaypointHighlightLayer } from '../../Map/Layers/MapWaypointHighlightLayer';
import { MapHighlightLineLayer } from '../../Map/Layers/MapHighlightLineLayer';
import { MapNoGpsPositionMessage } from '../../Map/Indicators/MapNoGpsPositionMessage';
import { AHRSSystemEvents, AvionicsComputerSystemEvents, AvionicsSystemState } from '../../Systems';

import './NavMapComponent.css';

/**
 * Properties to pass to the own airplane layer.
 */
export interface NavMapOwnAirplaneLayerProps {
  /** The path to the icon's image file. */
  imageFilePath: string;

  /** The path to the icon to display when the heading is invalid. */
  invalidHeadingImageFilePath: string;

  /** The size of the airplane icon, in pixels. */
  iconSize: number;

  /**
   * The point on the icon which is anchored to the airplane's position, expressed relative to the icon's width and
   * height, with [0, 0] at the top left and [1, 1] at the bottom right.
   */
  iconAnchor: Float64Array;

  /**
   * The point on the invalid heading icon which is anchored to the airplane's position, expressed relative to the icon's width and
   * height, with [0, 0] at the top left and [1, 1] at the bottom right.
   */
  invalidHeadingIconAnchor: Float64Array;
}

/**
 * Properties to pass to the traffic intruder layer.
 */
export interface NavMapTrafficIntruderLayerProps {
  /** The font size of the intruder labels, in pixels. */
  fontSize: number;

  /** The size of the intruder icons, in pixels. */
  iconSize: number;
}

/**
 * Properties on the NavMap component.
 */
export interface NavMapComponentProps<M extends NavMapModelModules = NavMapModelModules> extends MapComponentProps<M> {
  /** A subscribable which provides the update frequency for the data the map uses. */
  dataUpdateFreq: Subscribable<number>;

  /** The unique ID for this map instance. */
  id: string;

  /**
   * The initial size of the dead zone around each edge of the map projection window, which is displayed but excluded
   * in map range calculations. Expressed as [left, top, right, bottom] in pixels. Defaults to 0 on all sides.
   */
  deadZone?: Float64Array;

  /** An instance of the flight planner. */
  flightPlanner: FlightPlanner;

  /** The settings manager to use. */
  settingManager: UserSettingManager<MapUserSettingTypes>;

  /** Properties to pass to the own airplane layer. */
  ownAirplaneLayerProps: NavMapOwnAirplaneLayerProps;

  /** Properties to pass to the traffic intruder layer. */
  trafficIntruderLayerProps: NavMapTrafficIntruderLayerProps;

  /**
   * A subscribable which provides whether the layer should draw the entire active flight plan instead of only from the
   * active lateral leg.
   */
  drawEntireFlightPlan: Subscribable<boolean>;

  /** The unique ID for this map's Bing component. Defaults to this map's ID. */
  bingId?: string;

  /** The CSS class to apply to this component. */
  class?: string;
}

/**
 * A G1000 navigation map component.
 */
export abstract class NavMapComponent<P extends NavMapComponentProps = NavMapComponentProps> extends MapComponent<P> {
  protected readonly rootRef = FSComponent.createRef<HTMLDivElement>();
  protected readonly bingLayerRef = FSComponent.createRef<MapBingLayer>();
  protected readonly airspaceLayerRef = FSComponent.createRef<MapAirspaceLayer>();
  protected readonly flightPlanLayerRef = FSComponent.createRef<MapFlightPlanLayer>();
  protected readonly navAidsLayerRef = FSComponent.createRef<MapWaypointsLayer>();
  protected readonly textLayerRef = FSComponent.createRef<MapCullableTextLayer>();
  protected readonly crosshairLayerRef = FSComponent.createRef<MapCrosshairLayer>();
  protected readonly trackVectorLayerRef = FSComponent.createRef<MapTrackVectorLayer>();
  protected readonly altitudeArcLayerRef = FSComponent.createRef<MapAltitudeArcLayer>();
  protected readonly trafficIntruderLayerRef = FSComponent.createRef<MapTrafficIntruderLayer>();
  protected readonly ownAirplaneLayerRef = FSComponent.createRef<MapOwnAirplaneLayer<NavMapModelModules>>();
  protected readonly pointerLayerRef = FSComponent.createRef<MapPointerLayer>();
  protected readonly highlightLayerRef = FSComponent.createRef<MapWaypointHighlightLayer>();
  protected readonly highlightLineLayerRef = FSComponent.createRef<MapHighlightLineLayer>();

  protected readonly deadZone = new Float64Array(4);
  protected readonly pointerBoundsSub = VecNSubject.createFromVector(new Float64Array([0, 0, this.props.projectedWidth, this.props.projectedHeight]));

  protected readonly rangeTargetRotationController: NavMapRangeTargetRotationController;

  protected readonly textManager = new MapCullableTextLabelManager();
  protected readonly waypointRenderer = new MapWaypointRenderer(this.textManager);
  protected readonly trafficOffScaleModeSub = Subject.create(MapTrafficIntruderOffScaleIndicatorMode.Off);

  protected readonly rangeSettingManager = MapRangeSettings.getManager(this.props.bus);

  protected readonly declutterController = new MapDeclutterController(this.props.model.getModule('declutter'), this.props.settingManager);
  protected readonly terrainColorController = new MapTerrainController(this.props.model, this.props.settingManager);
  protected readonly waypointsVisController = new MapWaypointsVisController(this.props.model, this.props.settingManager);
  protected readonly airspaceVisController = new MapAirspaceVisController(this.props.model, this.props.settingManager);
  protected readonly trafficController = new NavMapTrafficController(this.props.model, TrafficUserSettings.getManager(this.props.bus), this.props.settingManager);
  protected readonly nexradController = new MapNexradController(this.props.model, this.props.settingManager);
  protected readonly crosshairController = new MapCrosshairController(this.props.model);
  protected readonly trackVectorController = new MapTrackVectorController(this.props.model, this.props.settingManager);
  protected readonly altitudeArcController = new MapAltitudeArcController(this.props.model, this.props.settingManager);

  protected readonly ownAirplaneIconPath = Subject.create<string>(this.props.ownAirplaneLayerProps.imageFilePath);
  protected readonly ownAirplaneIconAnchor = Vec2Subject.createFromVector(this.props.ownAirplaneLayerProps.iconAnchor);

  /**
   * Creates an instance of a NavMap.
   * @param props The properties of the nav map.
   */
  constructor(props: P) {
    super(props);

    if (this.props.deadZone) {
      this.deadZone.set(this.props.deadZone);
    }
    this.updatePointerBounds();

    this.rangeTargetRotationController = this.createRangeTargetRotationController();
  }

  /**
   * Creates a map range/target/rotation controller.
   * @returns a map range/target/rotation controller.
   */
  protected abstract createRangeTargetRotationController(): NavMapRangeTargetRotationController;

  /**
   * Gets the size of the dead zone around this map's projected window, which is displayed but excluded in map range
   * calculations. Expressed as [left, top, right, bottom] in pixels.
   * @returns the size of the dead zone around this map's projected window.
   */
  public getDeadZone(): Float64Array {
    return this.deadZone;
  }

  /**
   * Sets the size of the dead zone around this map's projected window. The dead zone is displayed but excluded in map
   * range calculations.
   * @param deadZone The new dead zone, expressed as [left, top, right, bottom] in pixels.
   */
  public setDeadZone(deadZone: Float64Array): void {
    if (this.deadZone.every((value, index) => value === deadZone[index])) {
      return;
    }

    this.deadZone.set(deadZone);
    this.onDeadZoneChanged();
  }

  /**
   * This method is called when the size of this map's dead zone changes.
   */
  protected onDeadZoneChanged(): void {
    this.rangeTargetRotationController.setDeadZone(this.deadZone);
    this.updatePointerBounds();
  }

  /** @inheritdoc */
  public onAfterRender(): void {
    super.onAfterRender();

    this.setRootSize(this.mapProjection.getProjectedSize());

    this.initEventBusHandlers();

    this.rangeTargetRotationController.init();
    this.initControllers();
    this.initLayers();

    const sub = this.props.bus.getSubscriber<AvionicsComputerSystemEvents & AHRSSystemEvents>();
    sub.on('avionicscomputer_state_1').handle(state => {
      if (state.current === AvionicsSystemState.On) {
        this.setValidGpsSignal(true);
      } else {
        this.setValidGpsSignal(false);
      }
    });

    sub.on('ahrs_state').handle(state => {
      if (state.current === AvionicsSystemState.On) {
        this.setValidHeading(true);
      } else {
        this.setValidHeading(false);
      }
    });
  }

  /**
   * Sets the size of this map's root HTML element.
   * @param size The new size, in pixels.
   */
  private setRootSize(size: Float64Array): void {
    this.rootRef.instance.style.width = `${size[0]}px`;
    this.rootRef.instance.style.height = `${size[1]}px`;
  }

  /**
   * Initializes event bus handlers.
   */
  protected initEventBusHandlers(): void {
    this.props.dataUpdateFreq.sub(freq => {
      this.props.model.getModule('ownAirplaneProps').beginSync(this.props.bus, freq);
      this.props.model.getModule('autopilot').beginSync(this.props.bus, freq);
    }, true);
  }

  /**
   * Initializes model controllers.
   */
  protected initControllers(): void {
    this.declutterController.init();
    this.terrainColorController.init();
    this.waypointsVisController.init();
    this.airspaceVisController.init();
    this.trafficController.init();
    this.nexradController.init();
    this.crosshairController.init();
    this.trackVectorController.init();
    this.altitudeArcController.init();
  }

  /**
   * Initializes this map's layers.
   */
  protected initLayers(): void {
    this.attachLayer(this.bingLayerRef.instance);
    this.attachLayer(this.airspaceLayerRef.instance);
    this.attachLayer(this.navAidsLayerRef.instance);
    this.attachLayer(this.flightPlanLayerRef.instance);
    this.attachLayer(this.textLayerRef.instance);
    this.attachLayer(this.crosshairLayerRef.instance);
    this.attachLayer(this.trackVectorLayerRef.instance);
    this.attachLayer(this.altitudeArcLayerRef.instance);
    this.attachLayer(this.ownAirplaneLayerRef.instance);
    this.attachLayer(this.trafficIntruderLayerRef.instance);
    this.attachLayer(this.pointerLayerRef.instance);
    this.attachLayer(this.highlightLayerRef.instance);
    this.attachLayer(this.highlightLineLayerRef.instance);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected onProjectedSizeChanged(): void {
    this.setRootSize(this.mapProjection.getProjectedSize());
    this.updatePointerBounds();
  }

  /**
   * Updates this map's pointer bounds.
   */
  protected updatePointerBounds(): void {
    const size = this.mapProjection.getProjectedSize();
    const minX = this.deadZone[0];
    const minY = this.deadZone[1];
    const maxX = size[0] - this.deadZone[2];
    const maxY = size[1] - this.deadZone[3];
    const width = maxX - minX;
    const height = maxY - minY;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    this.pointerBoundsSub.set(
      Math.min(centerX, minX + width * 0.1),
      Math.min(centerY, minY + height * 0.1),
      Math.max(centerX, maxX - height * 0.1),
      Math.max(centerY, maxY - height * 0.1)
    );
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected onUpdated(time: number, elapsed: number): void {
    this.updateRangeTargetRotationController();
    this.waypointRenderer.update(this.mapProjection);
    super.onUpdated(time, elapsed);
  }

  /**
   * Updates this map's range/target/rotation controller.
   */
  protected updateRangeTargetRotationController(): void {
    this.rangeTargetRotationController.update();
  }

  /** @inheritdoc */
  public render(): VNode {
    let className = 'nav-map-container';
    if (this.props.class !== undefined) {
      className += ` ${this.props.class}`;
    }

    return (
      <div ref={this.rootRef} class={className}>
        <MapBingLayer
          ref={this.bingLayerRef} model={this.props.model} mapProjection={this.mapProjection}
          bingId={this.props.bingId ?? this.props.id}
        />
        <MapAirspaceLayer
          ref={this.airspaceLayerRef} model={this.props.model} mapProjection={this.mapProjection}
          bus={this.props.bus}
          lodBoundaryCache={LodBoundaryCache.getCache()}
          airspaceRenderManager={new MapAirspaceRenderManager()}
          maxSearchRadius={Subject.create(UnitType.NMILE.createNumber(10))}
          maxSearchItemCount={Subject.create(100)}
        />
        <MapWaypointsLayer
          ref={this.navAidsLayerRef} model={this.props.model} mapProjection={this.mapProjection}
          bus={this.props.bus}
          waypointRenderer={this.waypointRenderer} textManager={this.textManager}
          styles={this.getWaypointsLayerStyles()}
        />
        <MapWaypointHighlightLayer waypointRenderer={this.waypointRenderer} textManager={this.textManager} model={this.props.model}
          styles={MapWaypointStyles.getHighlightStyles(1, 20)} mapProjection={this.mapProjection} ref={this.highlightLayerRef}
        />
        <MapHighlightLineLayer
          model={this.props.model} mapProjection={this.mapProjection} ref={this.highlightLineLayerRef}
        />
        {this.renderFlightPlanLayer()}
        <MapCullableTextLayer
          ref={this.textLayerRef} model={this.props.model} mapProjection={this.mapProjection}
          manager={this.textManager}
        />
        {this.renderRangeRingLayer()}
        {this.renderRangeCompassLayer()}
        <MapTrackVectorLayer
          ref={this.trackVectorLayerRef} model={this.props.model} mapProjection={this.mapProjection}
        />
        <MapAltitudeArcLayer
          ref={this.altitudeArcLayerRef} model={this.props.model} mapProjection={this.mapProjection}
        />
        <MapCrosshairLayer
          ref={this.crosshairLayerRef} model={this.props.model} mapProjection={this.mapProjection}
        />
        <MapTrafficIntruderLayer
          ref={this.trafficIntruderLayerRef} model={this.props.model} mapProjection={this.mapProjection}
          bus={this.props.bus}
          fontSize={this.props.trafficIntruderLayerProps.fontSize} iconSize={this.props.trafficIntruderLayerProps.iconSize}
          useOuterRangeMaxScale={false} offScaleIndicatorMode={this.trafficOffScaleModeSub}
        />
        <MapOwnAirplaneLayer
          ref={this.ownAirplaneLayerRef} model={this.props.model} mapProjection={this.mapProjection}
          imageFilePath={this.ownAirplaneIconPath} iconSize={this.props.ownAirplaneLayerProps.iconSize}
          iconAnchor={this.ownAirplaneIconAnchor}
        />
        {this.renderMiniCompassLayer()}
        {this.renderPointerInfoLayer()}
        {this.renderIndicatorGroups()}
        <MapPointerLayer
          ref={this.pointerLayerRef} model={this.props.model} mapProjection={this.mapProjection}
        />
      </div>
    );
  }

  /**
   * Gets styles for the waypoints layer.
   * @returns styles for the waypoints layer.
   */
  protected getWaypointsLayerStyles(): MapWaypointNormalStyles {
    return MapWaypointStyles.getNormalStyles(1, 10);
  }

  /**
   * Gets inactive waypoint styles for the flight plan layer.
   * @returns inactive waypoint styles for the flight plan layer.
   */
  protected getFlightPlanLayerInactiveWaypointsStyles(): MapWaypointFlightPlanStyles {
    return MapWaypointStyles.getFlightPlanStyles(false, 1, 20);
  }

  /**
   * Gets active waypoint styles for the flight plan layer.
   * @returns active waypoint styles for the flight plan layer.
   */
  protected getFlightPlanLayerActiveWaypointsStyles(): MapWaypointFlightPlanStyles {
    return MapWaypointStyles.getFlightPlanStyles(true, 2, 21);
  }

  /**
   * Renders this map's indicator groups.
   * @returns an array of this map's indicator groups.
   */
  protected renderIndicatorGroups(): (VNode | null)[] {
    return [
      this.renderTopLeftIndicatorGroup(),
      this.renderCenterIndicatorGroup(),
      this.renderBottomLeftIndicatorGroup(),
      this.renderBottomRightIndicatorGroup()
    ];
  }

  /**
   * Renders the top-left indicator group.
   * @returns the top-left indicator group.
   */
  protected renderTopLeftIndicatorGroup(): VNode | null {
    return (
      <div class='navmap-indicators-top-left'>
        {this.renderTopLeftIndicators()}
      </div>
    );
  }

  /**
   * Renders indicators in the top-left indicator group.
   * @returns indicators in the top-left indicator group.
   */
  protected renderTopLeftIndicators(): (VNode | null)[] {
    return [
      this.renderOrientationIndicator()
    ];
  }

  /**
   * Renders the center indicator group.
   * @returns the center indicator group.
   */
  protected renderCenterIndicatorGroup(): VNode | null {
    return (
      <div class='navmap-indicators-center'>
        {this.renderCenterIndicators()}
      </div>
    );
  }

  /**
   * Renders indicators in the center indicator group.
   * @returns indicators in the center indicator group.
   */
  protected renderCenterIndicators(): (VNode | null)[] {
    return [
      this.renderNoGpsPositionIndicator()
    ];
  }

  /**
   * Renders the bottom-left indicator group.
   * @returns the bottom-left indicator group.
   */
  protected renderBottomLeftIndicatorGroup(): VNode | null {
    return (
      <div class='navmap-indicators-bottom-left'>
        {this.renderBottomLeftIndicators()}
      </div>
    );
  }

  /**
   * Renders indicators in the bottom-left indicator group.
   * @returns indicators in the bottom-left indicator group.
   */
  protected renderBottomLeftIndicators(): (VNode | null)[] {
    return [
      this.renderDetailIndicator(),
      this.renderTrafficOffScaleIndicator()
    ];
  }

  /**
   * Renders the bottom-right indicator group.
   * @returns the bottom-right indicator group.
   */
  protected renderBottomRightIndicatorGroup(): VNode | null {
    return (
      <div class='navmap-indicators-bottom-right'>
        {this.renderBottomRightIndicators()}
      </div>
    );
  }

  /**
   * Renders indicators in the bottom-right indicator group.
   * @returns indicators in the bottom-right indicator group.
   */
  protected renderBottomRightIndicators(): (VNode | null)[] {
    return [
      this.renderTrafficStatusIndicator(true),
      this.renderTerrainScaleIndicator()
    ];
  }

  /**
   * Renders the flight plan layer.
   * @returns The rendered flight plan layer, as a VNode.
   */
  protected renderFlightPlanLayer(): VNode {
    return (
      <MapFlightPlanLayer
        ref={this.flightPlanLayerRef} model={this.props.model} mapProjection={this.mapProjection}
        bus={this.props.bus} dataProvider={new MapActiveFlightPlanDataProvider(this.props.bus, this.props.flightPlanner)}
        drawEntirePlan={this.props.drawEntireFlightPlan}
        waypointRenderer={this.waypointRenderer} textManager={this.textManager}
        inactiveWaypointStyles={this.getFlightPlanLayerInactiveWaypointsStyles()}
        activeWaypointStyles={this.getFlightPlanLayerActiveWaypointsStyles()}
      />
    );
  }

  /**
   * Renders the mini compass layer.
   * @returns The rendered mini compass layer, as a VNode, or null if no mini compass layer should be shown.
   */
  protected abstract renderMiniCompassLayer(): VNode | null;

  /**
   * Renders the range ring layer.
   * @returns The rendered range ring layer, as a VNode, or null if no range ring layer should be shown.
   */
  protected abstract renderRangeRingLayer(): VNode | null;

  /**
   * Renders the range compass layer.
   * @returns The rendered range compass layer, as a VNode, or null if no range compass layer should be shown.
   */
  protected abstract renderRangeCompassLayer(): VNode | null;

  /**
   * Renders the pointer info layer.
   * @returns The rendered pointer info layer, as a VNode, or null if no pointer info layer should be shown.
   */
  protected abstract renderPointerInfoLayer(): VNode | null;

  /**
   * Renders the range indicator.
   * @returns The range indicator.
   */
  protected renderRangeIndicator(): VNode | null {
    // TODO: Add customizable display unit support.
    const rangeModule = this.props.model.getModule('range');
    return (
      <MapRangeDisplay range={rangeModule.nominalRange} displayUnit={this.props.model.getModule('units').distanceLarge} />
    );
  }

  /**
   * Renders the orientation indicator.
   * @returns The orientation indicator.
   */
  protected renderOrientationIndicator(): VNode | null {
    const orientationModule = this.props.model.getModule('orientation');
    return (
      <MapOrientationIndicator
        orientation={orientationModule.orientation}
        text={{
          [MapOrientation.NorthUp]: 'NORTH UP',
          [MapOrientation.TrackUp]: 'TRK UP',
          [MapOrientation.HeadingUp]: 'HDG UP'
        }}
        isVisible={this.props.model.getModule('pointer').isActive.map(isActive => !isActive)}
      />
    );
  }

  /**
   * Renders the detail indicator.
   * @returns The detail indicator.
   */
  protected renderDetailIndicator(): VNode | null {
    return (
      <MapDetailIndicator declutterMode={this.props.model.getModule('declutter').mode} showTitle={true} />
    );
  }

  /**
   * Renders the terrain scale indicator.
   */
  protected abstract renderTerrainScaleIndicator(): VNode | null;

  /**
   * Renders the traffic status indicator.
   * @param showAltitudeRestrictionMode Whether the indicator should show the altitude restriction mode.
   * @returns The traffic status indicator.
   */
  protected renderTrafficStatusIndicator(showAltitudeRestrictionMode: boolean): VNode | null {
    const trafficModule = this.props.model.getModule('traffic');
    return (
      <MapTrafficStatusIndicator
        showAltitudeRestrictionMode={showAltitudeRestrictionMode}
        show={trafficModule.show} operatingMode={trafficModule.operatingMode} altitudeRestrictionMode={trafficModule.altitudeRestrictionMode}
      />
    );
  }

  /**
   * Renders the traffic off-scale indicator.
   * @returns The traffic off-scale indicator.
   */
  protected renderTrafficOffScaleIndicator(): VNode | null {
    return (
      <MapTrafficIntruderOffScaleIndicator mode={this.trafficOffScaleModeSub} />
    );
  }

  /**
   * Renders the no gps position message indicator.
   * @returns The no gps position indicator.
   */
  protected renderNoGpsPositionIndicator(): VNode | null {
    return (
      <MapNoGpsPositionMessage hasGpsSignal={this.props.model.getModule('dataIntegrity').gpsSignalValid} />
    );
  }

  /**
   * Sets the map component to switch modes based on GPS signal validity.
   * @param isValid Whether or not the GPS signal is valid.
   */
  public setValidGpsSignal(isValid: boolean): void {
    if (isValid) {
      this.ownAirplaneLayerRef.instance.setVisible(true);
    } else {
      this.ownAirplaneLayerRef.instance.setVisible(false);
    }

    this.props.model.getModule('dataIntegrity').gpsSignalValid.set(isValid);
  }

  /**
   * Sets whether or not the map is receiving a valid heading.
   * @param isValid True if valid, false otherwise.
   */
  public setValidHeading(isValid: boolean): void {
    this.props.model.getModule('dataIntegrity').headingSignalValid.set(isValid);

    if (isValid) {
      this.ownAirplaneIconPath.set(this.props.ownAirplaneLayerProps.imageFilePath);
      this.ownAirplaneIconAnchor.set(this.props.ownAirplaneLayerProps.iconAnchor);
    } else {
      this.ownAirplaneIconPath.set(this.props.ownAirplaneLayerProps.invalidHeadingImageFilePath);
      this.ownAirplaneIconAnchor.set(this.props.ownAirplaneLayerProps.invalidHeadingIconAnchor);
    }
  }
}

/**
 * A controller for handling map range, target, and rotation changes.
 */
export abstract class NavMapRangeTargetRotationController<M extends NavMapModelModules = NavMapModelModules> {
  public static readonly DEFAULT_MAP_RANGE_INDEX = 11;

  private static readonly vec2Cache = [new Float64Array(2)];

  protected readonly deadZone = new Float64Array(4);

  protected currentMapRangeIndex = NavMapRangeTargetRotationController.DEFAULT_MAP_RANGE_INDEX;

  private needUpdateProjection = false;
  private needUpdatePointerScroll = false;

  protected currentMapParameters = {
    range: 0,
    target: new GeoPoint(0, 0),
    targetProjectedOffset: new Float64Array(2),
    rotation: 0
  };

  protected readonly airplanePropsModule = this.mapModel.getModule('ownAirplaneProps');
  protected readonly orientationModule = this.mapModel.getModule('orientation');
  protected readonly pointerModule = this.mapModel.getModule('pointer');
  protected readonly dataIntegrityModule = this.mapModel.getModule('dataIntegrity');

  protected readonly rangeSetting = this.rangeSettingManager.getSetting(this.rangeSettingName);
  protected readonly orientationSetting = this.settingManager.getSetting('mapOrientation');
  protected readonly autoNorthUpActiveSetting = this.settingManager.getSetting('mapAutoNorthUpActive');
  protected readonly autoNorthUpRangeIndexSetting = this.settingManager.getSetting('mapAutoNorthUpRangeIndex');

  protected readonly airplanePositionChangedHandler = this.onAirplanePositionChanged.bind(this);
  protected readonly airplaneOnGroundChangedHandler = this.onAirplaneOnGroundChanged.bind(this);
  protected readonly airplaneRotationChangedHandler = this.onAirplaneRotationChanged.bind(this);
  protected readonly pointerPositionChangedHandler = this.onPointerPositionChanged.bind(this);
  protected readonly pointerTargetChangedHandler = this.onPointerTargetChanged.bind(this);
  protected readonly pointerBoundsChangedHandler = this.onPointerBoundsChanged.bind(this);

  private hasGpsSignal = true;
  private forceNorthUp = false;
  private areAirplanePositionListenersActive = false;
  private currentAirplaneRotationSub: Subscribable<number> | null = null;

  /**
   * Creates an instance of a MapRangeController.
   * @param mapModel The map model.
   * @param mapProjection The map projection.
   * @param deadZone The dead zone around the edge of the map projection window.
   * @param settingManager This controller's map settings manager.
   * @param rangeSettingManager This controller's map range settings manager.
   * @param rangeSettingName The name of this controller's map range setting.
   * @param rangeArray A subscribable which provides an array of valid map ranges.
   * @param pointerBounds A subscribable which provides the bounds of the area accessible to the map pointer. The
   * bounds should be expressed as `[left, top, right, bottom]` in pixels.
   */
  constructor(
    protected readonly mapModel: MapModel<M>,
    protected readonly mapProjection: MapProjection,
    deadZone: Float64Array,
    protected readonly settingManager: UserSettingManager<MapUserSettingTypes>,
    protected readonly rangeSettingManager: UserSettingManager<MapRangeSettingTypes>,
    protected readonly rangeSettingName: keyof MapRangeSettingTypes,
    protected readonly rangeArray: Subscribable<readonly NumberUnitInterface<UnitFamily.Distance>[]>,
    protected readonly pointerBounds: Subscribable<Float64Array>
  ) {
    this.deadZone.set(deadZone);
  }

  /**
   * Executes this controller's first-run initialization code.
   */
  public init(): void {
    this.rangeArray.sub(this.onRangeArrayChanged.bind(this), true);
    this.mapProjection.addChangeListener(this.onMapProjectionChanged.bind(this));
    this.initSettingsListeners();
    this.initModuleListeners();
    this.initState();
    this.scheduleProjectionUpdate();
  }

  /**
   * Initializes settings listeners.
   */
  protected initSettingsListeners(): void {
    this.rangeSettingManager.whenSettingChanged(this.rangeSettingName).handle(this.onRangeSettingChanged.bind(this));
    this.settingManager.whenSettingChanged('mapOrientation').handle(this.onOrientationSettingChanged.bind(this));
    this.settingManager.whenSettingChanged('mapAutoNorthUpActive').handle(this.onAutoNorthUpSettingChanged.bind(this));
    this.settingManager.whenSettingChanged('mapAutoNorthUpRangeIndex').handle(this.onAutoNorthUpSettingChanged.bind(this));
  }

  /**
   * Initializes module listeners.
   */
  protected initModuleListeners(): void {
    this.orientationModule.orientation.sub(this.onOrientationChanged.bind(this), true);
    this.pointerModule.isActive.sub(this.onPointerActiveChanged.bind(this), true);

    this.dataIntegrityModule.gpsSignalValid.sub(this.onGpsSignalValidChanged.bind(this), true);
    this.dataIntegrityModule.headingSignalValid.sub(this.onHeadingSignalValidChanged.bind(this), true);
  }

  /**
   * Initializes this controller's state.
   */
  protected initState(): void {
    this.updateTargetFromPPos();
    this.updateTargetOffset();
  }

  /**
   * Sets the size of this controller's dead zone. The dead zone is the area around the edges of the map excluded in
   * range calculations.
   * @param deadZone The new dead zone, expressed as [left, top, right, bottom] in pixels.
   */
  public setDeadZone(deadZone: Float64Array): void {
    if (this.deadZone.every((value, index) => value === deadZone[index])) {
      return;
    }

    this.deadZone.set(deadZone);
    this.onDeadZoneChanged();
  }

  /**
   * This method is called when the size of the dead zone changes.
   */
  protected onDeadZoneChanged(): void {
    this.updateRangeFromIndex();
    this.updateTargetOffset();
    this.scheduleProjectionUpdate();
  }

  /**
   * Updates the array of valid map ranges.
   */
  protected updateRangeArray(): void {
    this.mapModel.getModule('range').nominalRanges.set(this.rangeArray.get());
    this.updateRangeFromIndex();
    this.scheduleProjectionUpdate();
  }

  /**
   * Updates the range index.
   */
  protected updateRangeIndex(): void {
    const newIndex = Utils.Clamp(this.rangeSetting.value, 0, this.rangeArray.get().length - 1);
    if (newIndex !== this.currentMapRangeIndex) {
      this.currentMapRangeIndex = newIndex;
      if (this.autoNorthUpActiveSetting.value) {
        this.updateOrientation();
      }
      this.updateRangeFromIndex();

      this.scheduleProjectionUpdate();
    }
  }

  /**
   * Updates the current range from the current range index.
   */
  protected updateRangeFromIndex(): void {
    const nominalRange = this.rangeArray.get()[this.currentMapRangeIndex];
    this.currentMapParameters.range = this.convertToTrueRange(nominalRange);
  }

  /**
   * Converts a nominal range to a true map range.
   * @param nominalRange The nominal range to convert.
   * @returns the true map range for the given nominal range, in great-arc radians.
   */
  protected abstract convertToTrueRange(nominalRange: NumberUnitInterface<UnitFamily.Distance>): number;

  /**
   * Updates the map target based on the airplane's present position.
   */
  protected updateTargetFromPPos(): void {
    const ppos = this.mapModel.getModule('ownAirplaneProps').position.get();
    this.currentMapParameters.target.set(ppos);
  }

  /**
   * Updates the target offset.
   */
  protected updateTargetOffset(): void {
    this.currentMapParameters.targetProjectedOffset.set(this.getDesiredTargetOffset());
  }

  /**
   * Gets the current desired target offset.
   * @returns The current desired target offset.
   */
  protected abstract getDesiredTargetOffset(): Float64Array;

  /**
   * Updates the map orientation.
   */
  protected updateOrientation(): void {
    const orientationSettingMode = this.orientationSetting.value;
    let orientation: MapOrientation;

    if (this.forceNorthUp === true) {
      orientation = MapOrientation.NorthUp;
    } else {
      if (
        orientationSettingMode === MapOrientationSettingMode.NorthUp
        || (this.autoNorthUpActiveSetting.value && this.currentMapRangeIndex > this.autoNorthUpRangeIndexSetting.value)
      ) {
        orientation = MapOrientation.NorthUp;
      } else if (orientationSettingMode === MapOrientationSettingMode.TrackUp && !this.airplanePropsModule.isOnGround.get()) {
        orientation = MapOrientation.TrackUp;
      } else {
        orientation = MapOrientation.HeadingUp;
      }
    }

    this.orientationModule.orientation.set(orientation);
  }

  /**
   * Responds to changes in the array of valid map ranges.
   */
  private onRangeArrayChanged(): void {
    this.updateRangeArray();
  }

  /**
   * Responds to map projection changes.
   * @param mapProjection The map projection that changed.
   * @param changeFlags The types of changes made to the projection.
   */
  private onMapProjectionChanged(mapProjection: MapProjection, changeFlags: number): void {
    if (BitFlags.isAll(changeFlags, MapProjectionChangeType.ProjectedSize)) {
      this.onProjectedSizeChanged();
    }
  }

  /**
   * Responds to projected map window size changes.
   */
  protected onProjectedSizeChanged(): void {
    this.updateRangeFromIndex();
    this.updateTargetOffset();
    this.scheduleProjectionUpdate();
  }

  /**
   * Responds to range setting changes.
   */
  private onRangeSettingChanged(): void {
    this.updateRangeIndex();
  }

  /**
   * Responds to orientation setting changes.
   */
  private onOrientationSettingChanged(): void {
    this.updateOrientation();
  }

  /**
   * Responds to auto north up setting changes.
   */
  private onAutoNorthUpSettingChanged(): void {
    this.updateOrientation();
  }

  /**
   * Responds to airplane position changes.
   */
  private onAirplanePositionChanged(): void {
    if (this.hasGpsSignal) {
      this.updateTargetFromPPos();
      this.scheduleProjectionUpdate();
    }
  }

  /**
   * Responds to airplane rotation changes.
   * @param angle The airplane rotation angle, in degrees.
   */
  private onAirplaneRotationChanged(angle: number): void {
    this.currentMapParameters.rotation = -angle * Avionics.Utils.DEG2RAD;
    this.scheduleProjectionUpdate();
  }

  /**
   * Responds to when the airplane is on the ground changes.
   */
  private onAirplaneOnGroundChanged(): void {
    this.updateOrientation();
  }

  /**
   * Responds to map orientation changes.
   * @param orientation The map orientation.
   */
  private onOrientationChanged(orientation: MapOrientation): void {
    if (orientation === MapOrientation.NorthUp) {
      this.currentMapParameters.rotation = 0;
    }

    this.updateAirplaneRotationListeners();
    this.updateRangeFromIndex();
    this.updateTargetOffset();
    this.scheduleProjectionUpdate();
  }

  /**
   * Responds to map pointer activation changes.
   * @param isActive Whether the map pointer is active.
   */
  private onPointerActiveChanged(isActive: boolean): void {
    this.updateAirplanePositionListeners();
    this.updateAirplaneRotationListeners();
    this.updatePointerListeners();
    this.scheduleProjectionUpdate();

    if (isActive) {
      this.onPointerActivated();
    } else {
      this.onPointerDeactivated();
    }
  }

  /**
   * Responds to map pointer activation.
   */
  protected onPointerActivated(): void {
    // noop
  }

  /**
   * Responds to map pointer deactivation.
   */
  protected onPointerDeactivated(): void {
    // noop
  }

  /**
   * Responds to map pointer position changes.
   */
  private onPointerPositionChanged(): void {
    this.schedulePointerScrollUpdate();
  }

  /**
   * Responds to map pointer desired target changes.
   * @param target The desired target.
   */
  private onPointerTargetChanged(target: GeoPointInterface): void {
    this.currentMapParameters.target.set(target);
    this.scheduleProjectionUpdate();
  }

  /**
   * Responds to map pointer bounds changes.
   */
  private onPointerBoundsChanged(): void {
    const position = this.pointerModule.position.get();
    const bounds = this.pointerBounds.get();

    const clampedPositionX = Utils.Clamp(position[0], bounds[0], bounds[2]);
    const clampedPositionY = Utils.Clamp(position[1], bounds[1], bounds[3]);

    this.pointerModule.position.set(clampedPositionX, clampedPositionY);
  }

  /**
   * Handles when the GPS signal validity changes.
   * @param isValid Whether or not the GPS position signal is valid.
   */
  private onGpsSignalValidChanged(isValid: boolean): void {
    this.hasGpsSignal = isValid;

    if (isValid && this.areAirplanePositionListenersActive) {
      this.updateTargetFromPPos();
      this.scheduleProjectionUpdate();
    }
  }

  /**
   * Handles when the heading signal validity changes.
   * @param isValid Whether or not the heading signal is valid.
   */
  private onHeadingSignalValidChanged(isValid: boolean): void {
    this.forceNorthUp = !isValid;
    this.updateOrientation();
  }

  /**
   * Updates listeners for airplane position and on ground status.
   */
  protected updateAirplanePositionListeners(): void {
    this.setAirplanePositionListenersActive(!this.pointerModule.isActive.get());
  }

  /**
   * Activates or deactivates airplane position listeners.
   * @param value Whether to activate airplane position listeners.
   */
  protected setAirplanePositionListenersActive(value: boolean): void {
    if (value === this.areAirplanePositionListenersActive) {
      return;
    }

    if (value) {
      this.airplanePropsModule.position.sub(this.airplanePositionChangedHandler, true);
      this.airplanePropsModule.isOnGround.sub(this.airplaneOnGroundChangedHandler, true);
    } else {
      this.airplanePropsModule.position.unsub(this.airplanePositionChangedHandler);
      this.airplanePropsModule.isOnGround.unsub(this.airplaneOnGroundChangedHandler);
    }

    this.areAirplanePositionListenersActive = value;
  }

  /**
   * Sets whether or not the controller is in force north up mode.
   * @param forced True for forced north up, false otherwise.
   */
  public setForceNorthUp(forced: boolean): void {
    this.forceNorthUp = forced;
    this.updateOrientation();
  }

  /**
   * Updates listeners for airplane heading and ground track.
   */
  protected updateAirplaneRotationListeners(): void {
    if (this.currentAirplaneRotationSub) {
      this.currentAirplaneRotationSub.unsub(this.airplaneRotationChangedHandler);
      this.currentAirplaneRotationSub = null;
    }

    if (!this.pointerModule.isActive.get()) {
      const orientation = this.orientationModule.orientation.get();
      switch (orientation) {
        case MapOrientation.TrackUp:
          this.currentAirplaneRotationSub = this.airplanePropsModule.trackTrue;
          break;
        case MapOrientation.HeadingUp:
          this.currentAirplaneRotationSub = this.airplanePropsModule.hdgTrue;
          break;
      }

      this.currentAirplaneRotationSub?.sub(this.airplaneRotationChangedHandler, true);
    }
  }

  /**
   * Updates the pointer position listener.
   */
  private updatePointerListeners(): void {
    if (this.pointerModule.isActive.get()) {
      this.pointerBounds.sub(this.pointerBoundsChangedHandler);
      this.pointerModule.position.sub(this.pointerPositionChangedHandler);
      this.pointerModule.target.sub(this.pointerTargetChangedHandler, true);
    } else {
      this.pointerBounds.unsub(this.pointerBoundsChangedHandler);
      this.pointerModule.position.unsub(this.pointerPositionChangedHandler);
      this.pointerModule.target.unsub(this.pointerTargetChangedHandler);
    }
  }

  /**
   * Schedules an update to the map projection.
   */
  protected scheduleProjectionUpdate(): void {
    this.needUpdateProjection = true;
  }

  /**
   * Schedules an update to scrolling due to the pointer.
   */
  protected schedulePointerScrollUpdate(): void {
    this.needUpdatePointerScroll = true;
  }

  /**
   * Updates this controller.
   */
  public update(): void {
    this.updateModules();
    this.updatePointerScroll();
    this.updateMapProjection();
  }

  /**
   * Updates map model modules.
   */
  protected updateModules(): void {
    this.mapModel.getModule('range').setNominalRangeIndex(this.currentMapRangeIndex);
  }

  /**
   * Updates the map projection with the latest range, target, and rotation values.
   */
  protected updateMapProjection(): void {
    if (!this.needUpdateProjection) {
      return;
    }

    this.mapProjection.set(this.currentMapParameters);

    this.needUpdateProjection = false;
  }

  /**
   * Updates scrolling due to the pointer.
   */
  protected updatePointerScroll(): void {
    if (!this.needUpdatePointerScroll) {
      return;
    }

    const position = this.pointerModule.position.get();
    const bounds = this.pointerBounds.get();

    const clampedPositionX = Utils.Clamp(position[0], bounds[0], bounds[2]);
    const clampedPositionY = Utils.Clamp(position[1], bounds[1], bounds[3]);

    const scrollDeltaX = position[0] - clampedPositionX;
    const scrollDeltaY = position[1] - clampedPositionY;

    if (scrollDeltaX === 0 && scrollDeltaY === 0) {
      return;
    }

    this.pointerModule.position.set(clampedPositionX, clampedPositionY);

    const newTargetProjected = Vec2Math.add(
      this.mapProjection.getTargetProjected(),
      Vec2Math.set(scrollDeltaX, scrollDeltaY, NavMapRangeTargetRotationController.vec2Cache[0]),
      NavMapRangeTargetRotationController.vec2Cache[0]
    );

    this.mapProjection.invert(newTargetProjected, this.currentMapParameters.target);
    this.scheduleProjectionUpdate();

    this.needUpdatePointerScroll = false;
  }
}