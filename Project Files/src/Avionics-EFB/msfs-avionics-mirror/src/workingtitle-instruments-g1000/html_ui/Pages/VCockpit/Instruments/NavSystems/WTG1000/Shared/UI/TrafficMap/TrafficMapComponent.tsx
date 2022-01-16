import { BitFlags, FSComponent, GeoPoint, NumberUnit, NumberUnitInterface, Subject, UnitFamily, Vec2Subject, VNode } from 'msfssdk';
import { FlightPlanner } from 'msfssdk/flightplan';
import {
  MapComponent, MapComponentProps, MapCullableTextLabelManager, MapCullableTextLayer, MapModel, MapOwnAirplaneLayer,
  MapProjection, MapProjectionChangeType
} from 'msfssdk/components/map';
import { UserSettingManager } from 'msfssdk/settings';

import { MapOrientationIndicator } from '../../Map/Indicators/MapOrientationIndicator';
import { MapFlightPlanLayer } from '../../Map/Layers/MapFlightPlanLayer';
import { MapActiveFlightPlanDataProvider } from '../../Map/MapActiveFlightPlanDataProvider';
import { MapMiniCompassLayer } from '../../Map/Layers/MapMiniCompassLayer';
import { MapTrafficIntruderLayer } from '../../Map/Layers/MapTrafficIntruderLayer';
import { MapWaypointRenderer } from '../../Map/MapWaypointRenderer';
import { MapWaypointFlightPlanStyles, MapWaypointStyles } from '../../Map/MapWaypointStyles';
import { MapOrientation } from '../../Map/Modules/MapOrientationModule';
import { MapRangeSettings, MapRangeSettingTypes } from '../../Map/MapRangeSettings';
import { MapTrafficController } from '../../Map/Controllers/MapTrafficController';
import { TrafficUserSettings } from '../../Traffic/TrafficUserSettings';
import { TrafficMapRangeLayer } from './TrafficMapRangeLayer';
import { TrafficMapModelModules } from './TrafficMapModel';
import { TrafficMapOperatingModeIndicator } from './TrafficMapOperatingModeIndicator';
import { TCASOperatingMode } from 'msfssdk/traffic';
import { TrafficMapAltitudeModeIndicator } from './TrafficMapAltitudeModeIndicator';
import { MapTrafficAltitudeRestrictionMode } from '../../Map/Modules/MapTrafficModule';
import { TrafficMapStandbyBannerIndicator } from './TrafficMapStandbyBannerIndicator';

import './TrafficMapComponent.css';

/**
 * Properties to pass to the own airplane layer.
 */
export interface TrafficMapOwnAirplaneLayerProps {
  /** The path to the icon's image file. */
  imageFilePath: string;

  /** The size of the airplane icon, in pixels. */
  iconSize: number;

  /**
   * The point on the icon which is anchored to the airplane's position, expressed relative to the icon's width and
   * height, with [0, 0] at the top left and [1, 1] at the bottom right.
   */
  iconAnchor: Float64Array;
}

/**
 * Properties to pass to the traffic intruder layer.
 */
export interface TrafficMapTrafficIntruderLayerProps {
  /** The font size of the intruder labels, in pixels. */
  fontSize: number;

  /** The size of the intruder icons, in pixels. */
  iconSize: number;
}

/**
 * Component props for TrafficMapComponent.
 */
export interface TrafficMapComponentProps extends MapComponentProps<TrafficMapModelModules> {
  /** The unique ID for this map instance. */
  id: string;

  /** An instance of the flight planner. */
  flightPlanner: FlightPlanner;

  /** Properties to pass to the own airplane layer. */
  ownAirplaneLayerProps: TrafficMapOwnAirplaneLayerProps;

  /** Properties to pass to the traffic intruder layer. */
  trafficIntruderLayerProps: TrafficMapTrafficIntruderLayerProps;

  /** The CSS class(es) to apply to this component. */
  class?: string;
}

/**
 * A traffic map component.
 */
export abstract class TrafficMapComponent extends MapComponent<TrafficMapComponentProps> {
  private static readonly tempGeoPoint_1 = new GeoPoint(0, 0);

  private readonly rootRef = FSComponent.createRef<HTMLDivElement>();
  private readonly flightPlanLayerRef = FSComponent.createRef<MapFlightPlanLayer>();
  private readonly textLayerRef = FSComponent.createRef<MapCullableTextLayer>();
  private readonly rangeLayerRef = FSComponent.createRef<TrafficMapRangeLayer>();
  private readonly intruderLayerRef = FSComponent.createRef<MapTrafficIntruderLayer>();
  private readonly ownAirplaneLayerRef = FSComponent.createRef<MapOwnAirplaneLayer<TrafficMapModelModules>>();
  private readonly miniCompassLayerRef = FSComponent.createRef<MapMiniCompassLayer>();

  protected readonly rangeTargetRotationController: TrafficMapRangeTargetRotationController;

  protected readonly textManager = new MapCullableTextLabelManager();
  protected readonly waypointRenderer = new MapWaypointRenderer(this.textManager);

  protected readonly trafficSettingManager = TrafficUserSettings.getManager(this.props.bus);

  protected readonly rangeSettingManager = MapRangeSettings.getManager(this.props.bus);

  protected readonly trafficController = new MapTrafficController(this.props.model, TrafficUserSettings.getManager(this.props.bus));

  /** @inheritdoc */
  constructor(props: TrafficMapComponentProps) {
    super(props);

    this.rangeTargetRotationController = this.createRangeTargetRotationController();
  }

  /**
   * Creates a map range/target/rotation controller.
   * @returns A map range/target/rotation controller.
   */
  protected abstract createRangeTargetRotationController(): TrafficMapRangeTargetRotationController;

  // eslint-disable-next-line jsdoc/require-jsdoc
  public onAfterRender(): void {
    super.onAfterRender();

    this.setRootSize(this.mapProjection.getProjectedSize());

    this.initEventBusHandlers();

    this.rangeTargetRotationController.init();
    this.initControllers();
    this.initLayers();
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
  private initEventBusHandlers(): void {
    this.props.updateFreq.sub(freq => {
      this.props.model.getModule('ownAirplaneProps').beginSync(this.props.bus, freq);
    }, true);
  }

  /**
   * Initializes model controllers.
   */
  private initControllers(): void {
    this.trafficController.init();
  }

  /**
   * Initializes this map's layers.
   */
  protected initLayers(): void {
    this.attachLayer(this.flightPlanLayerRef.instance);
    this.attachLayer(this.textLayerRef.instance);
    this.attachLayer(this.rangeLayerRef.instance);
    this.attachLayer(this.intruderLayerRef.instance);
    this.attachLayer(this.ownAirplaneLayerRef.instance);
    this.attachLayer(this.miniCompassLayerRef.instance);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected onProjectedSizeChanged(): void {
    this.setRootSize(this.mapProjection.getProjectedSize());
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
  private updateRangeTargetRotationController(): void {
    this.rangeTargetRotationController.update();
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public render(): VNode {
    return (
      <div ref={this.rootRef} class={`traffic-map ${this.props.class ?? ''}`}>
        <MapFlightPlanLayer
          ref={this.flightPlanLayerRef} model={this.props.model} mapProjection={this.mapProjection}
          bus={this.props.bus} dataProvider={new MapActiveFlightPlanDataProvider(this.props.bus, this.props.flightPlanner)}
          drawEntirePlan={Subject.create(false)}
          waypointRenderer={this.waypointRenderer} textManager={this.textManager}
          inactiveWaypointStyles={this.getFlightPlanLayerInactiveWaypointsStyles()}
          activeWaypointStyles={this.getFlightPlanLayerActiveWaypointsStyles()}
        />
        <MapCullableTextLayer
          ref={this.textLayerRef} model={this.props.model} mapProjection={this.mapProjection}
          manager={this.textManager}
        />
        <TrafficMapRangeLayer
          ref={this.rangeLayerRef} model={this.props.model} mapProjection={this.mapProjection}
          strokeWidth={2} strokeColor={'white'} strokeDash={[4, 4]}
          majorTickSize={10} minorTickSize={5}
        />
        <MapTrafficIntruderLayer
          ref={this.intruderLayerRef} model={this.props.model} mapProjection={this.mapProjection}
          bus={this.props.bus}
          fontSize={this.props.trafficIntruderLayerProps.fontSize} iconSize={this.props.trafficIntruderLayerProps.iconSize}
          useOuterRangeMaxScale={true}
        />
        <MapOwnAirplaneLayer
          ref={this.ownAirplaneLayerRef} model={this.props.model} mapProjection={this.mapProjection}
          imageFilePath={Subject.create(this.props.ownAirplaneLayerProps.imageFilePath)} iconSize={this.props.ownAirplaneLayerProps.iconSize}
          iconAnchor={Vec2Subject.createFromVector(this.props.ownAirplaneLayerProps.iconAnchor)}
        />
        <MapMiniCompassLayer
          ref={this.miniCompassLayerRef} class='minicompass-layer'
          model={this.props.model} mapProjection={this.mapProjection}
          imgSrc={'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG1000/Assets/map_mini_compass.png'}
        />
        <MapOrientationIndicator
          orientation={this.props.model.getModule('orientation').orientation}
          text={{
            [MapOrientation.NorthUp]: 'NORTH UP',
            [MapOrientation.TrackUp]: 'TRK UP',
            [MapOrientation.HeadingUp]: 'HDG UP'
          }}
          isVisible={Subject.create(true)}
        />
        {this.renderIndicatorGroups()}
        <TrafficMapStandbyBannerIndicator
          operatingMode={this.props.model.getModule('traffic').operatingMode}
          isOnGround={this.props.model.getModule('ownAirplaneProps').isOnGround}
        />
      </div>
    );
  }

  /**
   * Gets inactive waypoint styles for the flight plan layer.
   * @returns Inactive waypoint styles for the flight plan layer.
   */
  protected getFlightPlanLayerInactiveWaypointsStyles(): MapWaypointFlightPlanStyles {
    return MapWaypointStyles.getFlightPlanStyles(false, 1, 20);
  }

  /**
   * Gets active waypoint styles for the flight plan layer.
   * @returns Active waypoint styles for the flight plan layer.
   */
  protected getFlightPlanLayerActiveWaypointsStyles(): MapWaypointFlightPlanStyles {
    return MapWaypointStyles.getFlightPlanStyles(true, 2, 21);
  }

  /**
   * Renders this map's indicator groups.
   * @returns An array of this map's indicator groups.
   */
  protected renderIndicatorGroups(): (VNode | null)[] {
    return [
      this.renderTopRightIndicatorGroup()
    ];
  }

  /**
   * Renders the top-right indicator group.
   * @returns The top-right indicator group.
   */
  protected renderTopRightIndicatorGroup(): VNode | null {
    return (
      <div class='trafficmap-indicators-top-right'>
        {this.renderTopRightIndicators()}
      </div>
    );
  }

  /**
   * Renders indicators in the top-right indicator group.
   * @returns Indicators in the top-right indicator group.
   */
  protected renderTopRightIndicators(): (VNode | null)[] {
    return [
      this.renderOperatingModeIndicator(),
      this.renderAltitudeModeIndicator()
    ];
  }

  /**
   * Renders the traffic system operating mode indicator.
   * @returns The traffic system operating mode indicator.
   */
  protected renderOperatingModeIndicator(): VNode | null {
    const trafficModule = this.props.model.getModule('traffic');
    return (
      <TrafficMapOperatingModeIndicator
        operatingMode={trafficModule.operatingMode}
        text={{
          [TCASOperatingMode.Standby]: 'TAS: STANDBY',
          [TCASOperatingMode.TAOnly]: 'TAS: OPERATING',
          [TCASOperatingMode.TA_RA]: 'TAS: OPERATING'
        }}
      />
    );
  }

  /**
   * Renders the traffic altitude restriction mode indicator.
   * @returns The traffic altitude restriction mode indicator.
   */
  protected renderAltitudeModeIndicator(): VNode | null {
    const trafficModule = this.props.model.getModule('traffic');
    return (
      <TrafficMapAltitudeModeIndicator
        altitudeRestrictionMode={trafficModule.altitudeRestrictionMode}
        text={{
          [MapTrafficAltitudeRestrictionMode.Above]: 'ABOVE',
          [MapTrafficAltitudeRestrictionMode.Below]: 'BELOW',
          [MapTrafficAltitudeRestrictionMode.Normal]: 'NORMAL',
          [MapTrafficAltitudeRestrictionMode.Unrestricted]: 'UNRESTRICTED'
        }}
      />
    );
  }
}

/**
 * A controller for handling map range, target, and rotation changes.
 */
export abstract class TrafficMapRangeTargetRotationController {
  public static readonly DEFAULT_MAP_RANGE_INDEX = 11;

  protected readonly innerRangeIndexMap = this.mapRanges.map((range, index, array) => {
    while (--index >= 0) {
      if (array[index].compare(range) < 0) {
        return index;
      }
    }

    return -1;
  });

  protected currentMapRangeIndex = TrafficMapRangeTargetRotationController.DEFAULT_MAP_RANGE_INDEX;
  private needUpdate = false;

  protected readonly currentMapParameters = {
    range: 0,
    target: new GeoPoint(0, 0),
    rotation: 0
  };

  protected readonly rangeModule = this.mapModel.getModule('range');
  protected readonly airplanePropsModule = this.mapModel.getModule('ownAirplaneProps');
  protected readonly trafficModule = this.mapModel.getModule('traffic');

  protected readonly rangeSetting = this.rangeSettingManager.getSetting(this.rangeSettingName);

  /**
   * Creates an instance of a MapRangeController.
   * @param mapModel The map model.
   * @param mapProjection The map projection.
   * @param mapRanges An array of valid map ranges.
   * @param rangeSettingManager This controller's map range settings manager.
   * @param rangeSettingName The name of this controller's map range setting.
   */
  constructor(
    protected readonly mapModel: MapModel<TrafficMapModelModules>,
    protected readonly mapProjection: MapProjection,
    public readonly mapRanges: readonly NumberUnit<UnitFamily.Distance>[],
    protected readonly rangeSettingManager: UserSettingManager<MapRangeSettingTypes>,
    protected readonly rangeSettingName: keyof MapRangeSettingTypes
  ) {
  }

  /**
   * Executes this controller's first-run initialization code.
   */
  public init(): void {
    this.mapModel.getModule('range').nominalRanges.set(this.mapRanges);

    this.updateRangeFromIndex();
    this.mapProjection.addChangeListener(this.onMapProjectionChanged.bind(this));
    this.initSettingsListeners();
    this.initModuleListeners();
    this.initState();
    this.scheduleUpdate();
  }

  /**
   * Initializes settings listeners.
   */
  protected initSettingsListeners(): void {
    this.rangeSettingManager.whenSettingChanged(this.rangeSettingName).handle(this.onRangeSettingChanged.bind(this));
  }

  /**
   * Initializes module listeners.
   */
  protected initModuleListeners(): void {
    this.airplanePropsModule.position.sub(this.onAirplanePositionChanged.bind(this));
    this.airplanePropsModule.hdgTrue.sub(this.onAirplaneRotationChanged.bind(this));
  }

  /**
   * Initializes this controller's state.
   */
  protected initState(): void {
    this.updateTarget();
    this.updateRotation();
  }

  /**
   * Updates the range index.
   */
  protected updateRangeIndex(): void {
    const newIndex = Utils.Clamp(this.rangeSetting.value, 0, this.mapRanges.length - 1);
    if (newIndex !== this.currentMapRangeIndex) {
      this.currentMapRangeIndex = newIndex;
      this.updateRangeFromIndex();
      this.scheduleUpdate();
    }
  }

  /**
   * Updates the current range from the current range index.
   */
  protected updateRangeFromIndex(): void {
    const nominalRange = this.mapRanges[this.currentMapRangeIndex];
    this.currentMapParameters.range = this.convertToTrueRange(nominalRange);
  }

  /**
   * Converts a nominal range to a true map range.
   * @param nominalRange The nominal range to convert.
   * @returns the true map range for the given nominal range, in great-arc radians.
   */
  protected abstract convertToTrueRange(nominalRange: NumberUnitInterface<UnitFamily.Distance>): number;

  /**
   * Updates the map target.
   */
  protected updateTarget(): void {
    const ppos = this.airplanePropsModule.position.get();
    this.currentMapParameters.target.set(ppos);
  }

  /**
   * Updates the map rotation.
   */
  protected updateRotation(): void {
    this.currentMapParameters.rotation = -this.airplanePropsModule.hdgTrue.get() * Avionics.Utils.DEG2RAD;
  }

  /**
   * A callback which is called when the map projection changes.
   * @param mapProjection The map projection that changed.
   * @param changeFlags The types of changes made to the projection.
   */
  private onMapProjectionChanged(mapProjection: MapProjection, changeFlags: number): void {
    if (BitFlags.isAll(changeFlags, MapProjectionChangeType.ProjectedSize)) {
      this.onProjectedSizeChanged();
    }
  }

  /**
   * A callback which is called when the size of the projected map window changes.
   */
  protected onProjectedSizeChanged(): void {
    this.updateRangeFromIndex();
    this.scheduleUpdate();
  }

  /**
   * A callback which is called when the range setting changes.
   */
  private onRangeSettingChanged(): void {
    this.updateRangeIndex();
  }

  /**
   * A callback which is called when the airplane's position changes.
   */
  private onAirplanePositionChanged(): void {
    this.updateTarget();
    this.scheduleUpdate();
  }

  /**
   * A callback which is called when the airplane's heading changes.
   */
  private onAirplaneRotationChanged(): void {
    this.updateRotation();
    this.scheduleUpdate();
  }

  /**
   * Schedules an update.
   */
  protected scheduleUpdate(): void {
    this.needUpdate = true;
  }

  /**
   * Updates this controller.
   */
  public update(): void {
    if (!this.needUpdate) {
      return;
    }

    this.updateModules();
    this.updateMapProjection();
    this.needUpdate = false;
  }

  /**
   * Updates map model modules.
   */
  protected updateModules(): void {
    this.rangeModule.setNominalRangeIndex(this.currentMapRangeIndex);
    this.trafficModule.outerRangeIndex.set(this.currentMapRangeIndex);
    this.trafficModule.innerRangeIndex.set(this.innerRangeIndexMap[this.currentMapRangeIndex]);
  }

  /**
   * Updates the map projection with the latest range, target, and rotation values.
   */
  protected updateMapProjection(): void {
    this.mapProjection.set(this.currentMapParameters);
  }
}