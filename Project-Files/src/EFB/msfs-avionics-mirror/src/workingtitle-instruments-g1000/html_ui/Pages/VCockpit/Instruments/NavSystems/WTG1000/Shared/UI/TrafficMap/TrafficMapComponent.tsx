import { FSComponent, NumberUnit, ReadonlyFloat64Array, Subject, Subscribable, UnitFamily, Vec2Math, Vec2Subject, VNode } from 'msfssdk';
import { FlightPlanner } from 'msfssdk/flightplan';
import { MapCullableTextLabelManager, MapCullableTextLayer, MapModel, MapOwnAirplaneLayer, MapProjection } from 'msfssdk/components/map';
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
import { BaseMapComponent, BaseMapComponentProps, BaseMapRangeTargetRotationController } from '../../Map/BaseMapComponent';

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
export interface TrafficMapComponentProps<M extends TrafficMapModelModules = TrafficMapModelModules> extends BaseMapComponentProps<M> {
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
export abstract class TrafficMapComponent
  <
  M extends TrafficMapModelModules = TrafficMapModelModules,
  P extends TrafficMapComponentProps<M> = TrafficMapComponentProps<M>,
  R extends TrafficMapRangeTargetRotationController<M> = TrafficMapRangeTargetRotationController<M>
  >
  extends BaseMapComponent<M, P, R> {

  protected readonly textManager = new MapCullableTextLabelManager();
  protected readonly waypointRenderer = new MapWaypointRenderer(this.textManager);

  protected readonly trafficSettingManager = TrafficUserSettings.getManager(this.props.bus);
  protected readonly rangeSettingManager = MapRangeSettings.getManager(this.props.bus);

  protected readonly trafficController = new MapTrafficController(this.props.model, TrafficUserSettings.getManager(this.props.bus));

  /** @inheritdoc */
  public onAfterRender(thisNode: VNode): void {
    super.onAfterRender(thisNode);

    this.initEventBusHandlers();
    this.initControllers();
  }

  /**
   * Initializes event bus handlers.
   */
  protected initEventBusHandlers(): void {
    this.props.dataUpdateFreq.sub(freq => {
      this.props.model.getModule('ownAirplaneProps').beginSync(this.props.bus, freq);
    }, true);
  }

  /**
   * Initializes model controllers.
   */
  protected initControllers(): void {
    this.trafficController.init();
  }

  /** @inheritdoc */
  protected onUpdated(time: number, elapsed: number): void {
    this.updateRangeTargetRotationController();
    this.waypointRenderer.update(this.mapProjection);
    super.onUpdated(time, elapsed);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public render(): VNode {
    return (
      <div ref={this.rootRef} class={`traffic-map ${this.props.class ?? ''}`}>
        <MapFlightPlanLayer
          model={this.props.model} mapProjection={this.mapProjection}
          bus={this.props.bus} dataProvider={new MapActiveFlightPlanDataProvider(this.props.bus, this.props.flightPlanner)}
          drawEntirePlan={Subject.create(false)}
          waypointRenderer={this.waypointRenderer} textManager={this.textManager}
          inactiveWaypointStyles={this.getFlightPlanLayerInactiveWaypointsStyles()}
          activeWaypointStyles={this.getFlightPlanLayerActiveWaypointsStyles()}
        />
        <MapCullableTextLayer
          model={this.props.model} mapProjection={this.mapProjection}
          manager={this.textManager}
        />
        <TrafficMapRangeLayer
          model={this.props.model} mapProjection={this.mapProjection}
          strokeWidth={2} strokeColor={'white'} strokeDash={[4, 4]}
          majorTickSize={10} minorTickSize={5}
        />
        <MapTrafficIntruderLayer
          model={this.props.model} mapProjection={this.mapProjection}
          bus={this.props.bus}
          fontSize={this.props.trafficIntruderLayerProps.fontSize} iconSize={this.props.trafficIntruderLayerProps.iconSize}
          useOuterRangeMaxScale={true}
        />
        <MapOwnAirplaneLayer
          model={this.props.model} mapProjection={this.mapProjection}
          imageFilePath={Subject.create(this.props.ownAirplaneLayerProps.imageFilePath)} iconSize={this.props.ownAirplaneLayerProps.iconSize}
          iconAnchor={Vec2Subject.createFromVector(this.props.ownAirplaneLayerProps.iconAnchor)}
        />
        <MapMiniCompassLayer
          class='minicompass-layer'
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
 * A controller for handling map range, target, and rotation changes for a traffic map.
 */
export abstract class TrafficMapRangeTargetRotationController<M extends TrafficMapModelModules = TrafficMapModelModules> extends BaseMapRangeTargetRotationController<M> {
  public static readonly DEFAULT_MAP_RANGE_INDEX = 11;

  protected readonly innerRangeIndexMap: number[];

  protected readonly airplanePropsModule = this.mapModel.getModule('ownAirplaneProps');
  protected readonly trafficModule = this.mapModel.getModule('traffic');

  protected readonly rangeSetting = this.rangeSettingManager.getSetting(this.rangeSettingName);

  /**
   * Creates an instance of a MapRangeController.
   * @param mapModel The map model.
   * @param mapProjection The map projection.
   * @param deadZone A subscribable which provides the dead zone around the edge of the map projection window.
   * @param mapRanges An array of valid map ranges.
   * @param rangeSettingManager This controller's map range settings manager.
   * @param rangeSettingName The name of this controller's map range setting.
   */
  constructor(
    mapModel: MapModel<M>,
    mapProjection: MapProjection,
    deadZone: Subscribable<ReadonlyFloat64Array>,
    mapRanges: readonly NumberUnit<UnitFamily.Distance>[],
    protected readonly rangeSettingManager: UserSettingManager<MapRangeSettingTypes>,
    protected readonly rangeSettingName: keyof MapRangeSettingTypes
  ) {
    super(mapModel, mapProjection, deadZone, Subject.create(mapRanges), TrafficMapRangeTargetRotationController.DEFAULT_MAP_RANGE_INDEX);

    this.innerRangeIndexMap = mapRanges.map((range, index, array) => {
      while (--index >= 0) {
        if (array[index].compare(range) < 0) {
          return index;
        }
      }

      return -1;
    });
  }

  /** @inheritdoc */
  protected initListeners(): void {
    this.rangeSettingManager.whenSettingChanged(this.rangeSettingName).handle(this.onRangeSettingChanged.bind(this));

    this.airplanePropsModule.position.sub(this.onAirplanePositionChanged.bind(this));
    this.airplanePropsModule.hdgTrue.sub(this.onAirplaneRotationChanged.bind(this));
  }

  /**
   * Initializes this controller's state.
   */
  protected initState(): void {
    super.initState();

    this.updateTarget();
    this.updateRotation();
  }

  /**
   * Updates the range index.
   */
  protected updateRangeIndex(): void {
    const newIndex = Utils.Clamp(this.rangeSetting.value, 0, this.rangeArray.get().length - 1);
    if (newIndex !== this.currentMapRangeIndex) {
      this.currentMapRangeIndex = newIndex;
      this.updateRangeFromIndex();
      this.scheduleProjectionUpdate();
    }
  }

  /** @inheritdoc */
  protected getDesiredTargetOffset(out: Float64Array): Float64Array {
    const deadZone = this.deadZone.get();

    const trueCenterOffsetX = (deadZone[0] - deadZone[2]) / 2;
    const trueCenterOffsetY = (deadZone[1] - deadZone[3]) / 2;

    return Vec2Math.set(trueCenterOffsetX, trueCenterOffsetY, out);
  }

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
   * A callback which is called when the range setting changes.
   */
  protected onRangeSettingChanged(): void {
    this.updateRangeIndex();
  }

  /**
   * A callback which is called when the airplane's position changes.
   */
  protected onAirplanePositionChanged(): void {
    this.updateTarget();
    this.scheduleProjectionUpdate();
  }

  /**
   * A callback which is called when the airplane's heading changes.
   */
  protected onAirplaneRotationChanged(): void {
    this.updateRotation();
    this.scheduleProjectionUpdate();
  }

  /** @inheritdoc */
  protected updateModules(): void {
    super.updateModules();

    this.trafficModule.outerRangeIndex.set(this.currentMapRangeIndex);
    this.trafficModule.innerRangeIndex.set(this.innerRangeIndexMap[this.currentMapRangeIndex]);
  }
}