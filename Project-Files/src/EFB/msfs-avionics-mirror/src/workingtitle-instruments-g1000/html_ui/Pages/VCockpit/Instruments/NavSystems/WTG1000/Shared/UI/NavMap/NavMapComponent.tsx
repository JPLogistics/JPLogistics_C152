/// <reference types="msfstypes/JS/Avionics" />

import { FSComponent, NumberUnitInterface, ReadonlyFloat64Array, Subject, Subscribable, UnitFamily, UnitType, Vec2Subject, VNode } from 'msfssdk';
import { MapAirspaceLayer, MapCullableTextLabelManager, MapCullableTextLayer, MapModel, MapOwnAirplaneLayer, MapProjection } from 'msfssdk/components/map';
import { FlightPlanner } from 'msfssdk/flightplan';
import { DefaultLodBoundaryCache } from 'msfssdk/navigation';
import { UserSettingManager } from 'msfssdk/settings';

import {
  MapActiveFlightPlanDataProvider, MapAirspaceRenderManager, MapOrientationSettingMode, MapRangeDisplay, MapRangeSettings, MapRangeSettingTypes,
  MapUserSettingTypes, MapWaypointFlightPlanStyles, MapWaypointNormalStyles, MapWaypointRenderer, MapWaypointStyles, PointerMapComponent,
  PointerMapComponentProps, PointerMapRangeTargetRotationController
} from '../../Map';
import {
  MapAirspaceVisController, MapAltitudeArcController, MapCrosshairController, MapDeclutterController, MapNexradController, MapTerrainController,
  MapTrackVectorController, MapWaypointsVisController
} from '../../Map/Controllers';
import {
  MapDetailIndicator, MapNoGpsPositionMessage, MapOrientationIndicator, MapTrafficIntruderOffScaleIndicator, MapTrafficIntruderOffScaleIndicatorMode,
  MapTrafficStatusIndicator
} from '../../Map/Indicators';
import {
  MapAltitudeArcLayer, MapBingLayer, MapCrosshairLayer, MapFlightPlanLayer, MapHighlightLineLayer, MapPointerLayer, MapTrackVectorLayer,
  MapTrafficIntruderLayer, MapWaypointHighlightLayer, MapWaypointsLayer
} from '../../Map/Layers';
import { MapOrientation } from '../../Map/Modules/MapOrientationModule';
import { AHRSSystemEvents, AvionicsComputerSystemEvents, AvionicsSystemState } from '../../Systems';
import { TrafficUserSettings } from '../../Traffic/TrafficUserSettings';
import { NavMapModelModules } from './NavMapModel';
import { NavMapTrafficController } from './NavMapTrafficController';

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
export interface NavMapComponentProps<M extends NavMapModelModules = NavMapModelModules> extends PointerMapComponentProps<M> {
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

  /** The unique ID for this map's Bing component. */
  bingId: string;
}

/**
 * A G1000 navigation map component.
 */
export abstract class NavMapComponent
  <
  M extends NavMapModelModules = NavMapModelModules,
  P extends NavMapComponentProps<M> = NavMapComponentProps<M>,
  R extends NavMapRangeTargetRotationController<M> = NavMapRangeTargetRotationController<M>
  >
  extends PointerMapComponent<M, P, R> {

  protected readonly ownAirplaneLayerRef = FSComponent.createRef<MapOwnAirplaneLayer<NavMapModelModules>>();

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


  /** @inheritdoc */
  public onAfterRender(thisNode: VNode): void {
    super.onAfterRender(thisNode);

    this.initEventBusHandlers();
    this.initControllers();

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

  /** @inheritdoc */
  protected onUpdated(time: number, elapsed: number): void {
    this.updateRangeTargetRotationController();
    this.waypointRenderer.update(this.mapProjection);
    super.onUpdated(time, elapsed);
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
          model={this.props.model} mapProjection={this.mapProjection}
          bingId={this.props.bingId}
        />
        <MapAirspaceLayer
          model={this.props.model} mapProjection={this.mapProjection}
          bus={this.props.bus}
          lodBoundaryCache={DefaultLodBoundaryCache.getCache()}
          airspaceRenderManager={new MapAirspaceRenderManager()}
          maxSearchRadius={Subject.create(UnitType.NMILE.createNumber(10))}
          maxSearchItemCount={Subject.create(100)}
        />
        <MapWaypointsLayer
          model={this.props.model} mapProjection={this.mapProjection}
          bus={this.props.bus}
          waypointRenderer={this.waypointRenderer} textManager={this.textManager}
          styles={this.getWaypointsLayerStyles()}
        />
        <MapWaypointHighlightLayer waypointRenderer={this.waypointRenderer} textManager={this.textManager} model={this.props.model}
          styles={MapWaypointStyles.getHighlightStyles(1, 20)} mapProjection={this.mapProjection}
        />
        <MapHighlightLineLayer
          model={this.props.model} mapProjection={this.mapProjection}
        />
        {this.renderFlightPlanLayer()}
        <MapCullableTextLayer
          model={this.props.model} mapProjection={this.mapProjection}
          manager={this.textManager}
        />
        {this.renderRangeRingLayer()}
        {this.renderRangeCompassLayer()}
        <MapTrackVectorLayer
          model={this.props.model} mapProjection={this.mapProjection}
        />
        <MapAltitudeArcLayer
          model={this.props.model} mapProjection={this.mapProjection}
        />
        <MapCrosshairLayer
          model={this.props.model} mapProjection={this.mapProjection}
        />
        <MapTrafficIntruderLayer
          model={this.props.model} mapProjection={this.mapProjection}
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
          model={this.props.model} mapProjection={this.mapProjection}
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
        model={this.props.model} mapProjection={this.mapProjection}
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
export abstract class NavMapRangeTargetRotationController<M extends NavMapModelModules = NavMapModelModules> extends PointerMapRangeTargetRotationController<M> {
  public static readonly DEFAULT_MAP_RANGE_INDEX = 11;

  protected readonly airplanePropsModule = this.mapModel.getModule('ownAirplaneProps');
  protected readonly orientationModule = this.mapModel.getModule('orientation');
  protected readonly dataIntegrityModule = this.mapModel.getModule('dataIntegrity');

  protected readonly rangeSetting = this.rangeSettingManager.getSetting(this.rangeSettingName);
  protected readonly orientationSetting = this.settingManager.getSetting('mapOrientation');
  protected readonly autoNorthUpActiveSetting = this.settingManager.getSetting('mapAutoNorthUpActive');
  protected readonly autoNorthUpRangeIndexSetting = this.settingManager.getSetting('mapAutoNorthUpRangeIndex');

  protected readonly airplanePositionChangedHandler = this.onAirplanePositionChanged.bind(this);
  protected readonly airplaneOnGroundChangedHandler = this.onAirplaneOnGroundChanged.bind(this);
  protected readonly airplaneRotationChangedHandler = this.onAirplaneRotationChanged.bind(this);

  private hasGpsSignal = false;
  private forceNorthUp = false;
  private areAirplanePositionListenersActive = false;
  private currentAirplaneRotationSub: Subscribable<number> | null = null;

  /**
   * Constructor.
   * @param mapModel The map model.
   * @param mapProjection The map projection.
   * @param deadZone A subscribable which provides the dead zone around the edge of the map projection window.
   * @param rangeArray A subscribable which provides an array of valid map ranges.
   * @param pointerBounds A subscribable which provides the bounds of the area accessible to the map pointer. The
   * bounds should be expressed as `[left, top, right, bottom]` in pixels.
   * @param settingManager This controller's map settings manager.
   * @param rangeSettingManager This controller's map range settings manager.
   * @param rangeSettingName The name of this controller's map range setting.
   */
  constructor(
    mapModel: MapModel<M>,
    mapProjection: MapProjection,
    deadZone: Subscribable<ReadonlyFloat64Array>,
    rangeArray: Subscribable<readonly NumberUnitInterface<UnitFamily.Distance>[]>,
    pointerBounds: Subscribable<ReadonlyFloat64Array>,
    protected readonly settingManager: UserSettingManager<MapUserSettingTypes>,
    protected readonly rangeSettingManager: UserSettingManager<MapRangeSettingTypes>,
    protected readonly rangeSettingName: keyof MapRangeSettingTypes
  ) {
    super(mapModel, mapProjection, deadZone, rangeArray, NavMapRangeTargetRotationController.DEFAULT_MAP_RANGE_INDEX, pointerBounds);
  }

  /** @inheritdoc */
  protected initListeners(): void {
    super.initListeners();

    this.rangeSettingManager.whenSettingChanged(this.rangeSettingName).handle(this.onRangeSettingChanged.bind(this));
    this.settingManager.whenSettingChanged('mapOrientation').handle(this.onOrientationSettingChanged.bind(this));
    this.settingManager.whenSettingChanged('mapAutoNorthUpActive').handle(this.onAutoNorthUpSettingChanged.bind(this));
    this.settingManager.whenSettingChanged('mapAutoNorthUpRangeIndex').handle(this.onAutoNorthUpSettingChanged.bind(this));

    this.orientationModule.orientation.sub(this.onOrientationChanged.bind(this));

    this.dataIntegrityModule.gpsSignalValid.sub(this.onGpsSignalValidChanged.bind(this));
    this.dataIntegrityModule.headingSignalValid.sub(this.onHeadingSignalValidChanged.bind(this));
  }

  /** @inheritdoc */
  protected initState(): void {
    super.initState();

    this.updateAirplaneRotationListeners();
    this.onGpsSignalValidChanged(this.dataIntegrityModule.gpsSignalValid.get());
    this.onHeadingSignalValidChanged(this.dataIntegrityModule.headingSignalValid.get());
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
   * Updates the map target based on the airplane's present position.
   */
  protected updateTargetFromPPos(): void {
    const ppos = this.mapModel.getModule('ownAirplaneProps').position.get();
    this.currentMapParameters.target.set(ppos);
  }

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
    this.updateRangeEndpoints();
    this.updateTargetOffset();
    this.scheduleProjectionUpdate();
  }

  /** @inheritdoc */
  protected onPointerActiveChanged(isActive: boolean): void {
    this.updateAirplanePositionListeners();
    this.updateAirplaneRotationListeners();

    super.onPointerActiveChanged(isActive);
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
}