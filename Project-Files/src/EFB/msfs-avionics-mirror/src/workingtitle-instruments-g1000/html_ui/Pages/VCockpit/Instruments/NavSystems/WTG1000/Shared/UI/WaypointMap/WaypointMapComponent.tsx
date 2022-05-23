import { FSComponent, NumberUnit, NumberUnitInterface, ReadonlyFloat64Array, Subject, Subscribable, UnitFamily, UnitType, Vec2Math, Vec2Subject, VNode } from 'msfssdk';
import { MapCullableTextLabelManager, MapCullableTextLayer, MapModel, MapOwnAirplaneLayer, MapProjection } from 'msfssdk/components/map';
import { Waypoint } from 'msfssdk/navigation';

import { MapCrosshairController } from '../../Map/Controllers/MapCrosshairController';
import { MapTerrainController } from '../../Map/Controllers/MapTerrainController';
import { MapWaypointsVisController } from '../../Map/Controllers/MapWaypointsVisController';
import { MapOrientationIndicator } from '../../Map/Indicators/MapOrientationIndicator';
import { MapBingLayer } from '../../Map/Layers/MapBingLayer';
import { MapCrosshairLayer } from '../../Map/Layers/MapCrosshairLayer';
import { MapMiniCompassLayer } from '../../Map/Layers/MapMiniCompassLayer';
import { MapPointerInfoLayer, MapPointerInfoLayerSize } from '../../Map/Layers/MapPointerInfoLayer';
import { MapPointerLayer } from '../../Map/Layers/MapPointerLayer';
import { MapRangeRingLayer } from '../../Map/Layers/MapRangeRingLayer';
import { MapWaypointHighlightLayer } from '../../Map/Layers/MapWaypointHighlightLayer';
import { MapWaypointsLayer } from '../../Map/Layers/MapWaypointsLayer';
import { MapRangeSettings } from '../../Map/MapRangeSettings';
import { MapUserSettings } from '../../Map/MapUserSettings';
import { MapWaypointRenderer } from '../../Map/MapWaypointRenderer';
import { MapWaypointHighlightStyles, MapWaypointNormalStyles, MapWaypointStyles } from '../../Map/MapWaypointStyles';
import { MapOrientation } from '../../Map/Modules/MapOrientationModule';
import { PointerMapComponent, PointerMapComponentProps, PointerMapRangeTargetRotationController } from '../../Map/PointerMapComponent';
import { WaypointMapModelModules } from './WaypointMapModel';

/**
 * Properties to pass to the own airplane layer.
 */
export interface WaypointMapOwnAirplaneLayerProps {
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
 * Component props for WaypointMapComponent.
 */
export interface WaypointMapComponentProps<M extends WaypointMapModelModules = WaypointMapModelModules> extends PointerMapComponentProps<M> {
  /** Properties to pass to the own airplane layer. */
  ownAirplaneLayerProps: WaypointMapOwnAirplaneLayerProps;

  /**
   * The size of the pointer info box.
   */
  pointerInfoSize: MapPointerInfoLayerSize;

  /**
   * A subscribable which provides a map range index.
   */
  rangeIndex: Subscribable<number>;

  /** A subscribable which provides a waypoint to bind as the focused waypoint. */
  waypoint: Subscribable<Waypoint | null>;

  /** The unique ID for this map's Bing component. */
  bingId: string;
}

/**
 * A G1000 waypoint map component.
 */
export abstract class WaypointMapComponent
  <
  M extends WaypointMapModelModules = WaypointMapModelModules,
  P extends WaypointMapComponentProps<M> = WaypointMapComponentProps<M>,
  R extends WaypointMapRangeTargetRotationController<M> = WaypointMapRangeTargetRotationController<M>
  >
  extends PointerMapComponent<M, P, R> {

  protected readonly rtrController = this.createRangeTargetRotationController();

  protected readonly textManager = new MapCullableTextLabelManager();
  protected readonly waypointRenderer = new MapWaypointRenderer(this.textManager);

  protected readonly settingManager = MapUserSettings.getMfdManager(this.props.bus);

  protected readonly terrainColorController = new MapTerrainController(this.props.model, this.settingManager, false);
  protected readonly waypointsVisController = new MapWaypointsVisController(this.props.model, this.settingManager);
  protected readonly crosshairController = new MapCrosshairController(this.props.model);

  /**
   * Creates a new range/target/rotation controller for this map.
   * @returns A new range/target/rotation controller for this map.
   */
  protected createRangeTargetRotationController(): R {
    return new WaypointMapRangeTargetRotationController(
      this.props.model,
      this.mapProjection,
      this.deadZone,
      MapRangeSettings.getRangeArraySubscribable(this.props.bus),
      this.pointerBoundsSub,
      this.props.rangeIndex,
      this.props.waypoint
    ) as R;
  }

  /** @inheritdoc */
  public onAfterRender(thisNode: VNode): void {
    super.onAfterRender(thisNode);

    this.initEventBusHandlers();
    this.initWaypointHandler();
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
   * Initializes the focused waypoint handler.
   */
  protected initWaypointHandler(): void {
    this.props.waypoint.sub(this.onWaypointChanged.bind(this), true);
  }

  /**
   * Initializes model controllers.
   */
  private initControllers(): void {
    this.terrainColorController.init();
    this.waypointsVisController.init();
    this.crosshairController.init();
  }

  /**
   * A callback which is called when the focused waypoint changes.
   * @param waypoint The new focused waypoint.
   */
  private onWaypointChanged(waypoint: Waypoint | null): void {
    this.props.model.getModule('waypointHighlight').waypoint.set(waypoint);
  }

  /** @inheritdoc */
  protected onUpdated(time: number, elapsed: number): void {
    this.updateRangeTargetRotationController();
    this.waypointRenderer.update(this.mapProjection);
    super.onUpdated(time, elapsed);
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div ref={this.rootRef} class={`waypoint-map ${this.props.class ?? ''}`}>
        <MapBingLayer
          model={this.props.model} mapProjection={this.mapProjection}
          bingId={this.props.bingId}
        />
        <MapWaypointsLayer
          model={this.props.model} mapProjection={this.mapProjection}
          bus={this.props.bus}
          waypointRenderer={this.waypointRenderer} textManager={this.textManager}
          styles={this.getWaypointsLayerStyles()}
        />
        <MapWaypointHighlightLayer
          model={this.props.model} mapProjection={this.mapProjection}
          waypointRenderer={this.waypointRenderer} textManager={this.textManager}
          styles={this.getWaypointHighlightLayerStyles()}
        />
        <MapCullableTextLayer
          model={this.props.model} mapProjection={this.mapProjection}
          manager={this.textManager}
        />
        <MapRangeRingLayer
          model={this.props.model} mapProjection={this.mapProjection}
          showLabel={true} strokeWidth={2} strokeStyle={'white'}
        />
        <MapCrosshairLayer
          model={this.props.model} mapProjection={this.mapProjection}
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
        <MapPointerInfoLayer
          model={this.props.model} mapProjection={this.mapProjection}
          size={this.props.pointerInfoSize}
        />
        <MapOrientationIndicator
          orientation={this.props.model.getModule('orientation').orientation}
          text={{
            [MapOrientation.NorthUp]: 'NORTH UP',
            [MapOrientation.TrackUp]: 'TRK UP',
            [MapOrientation.HeadingUp]: 'HDG UP'
          }}
          isVisible={this.props.model.getModule('pointer').isActive.map(isActive => !isActive)}
        />
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
  private getWaypointsLayerStyles(): MapWaypointNormalStyles {
    return MapWaypointStyles.getNormalStyles(1, 10);
  }

  /**
   * Gets styles for the waypoint highlight layer.
   * @returns styles for the waypoint highlight layer.
   */
  private getWaypointHighlightLayerStyles(): MapWaypointHighlightStyles {
    return MapWaypointStyles.getHighlightStyles(1, 20);
  }
}

/**
 * A controller for handling map range, target, and rotation changes for a waypoint map.
 */
export class WaypointMapRangeTargetRotationController<M extends WaypointMapModelModules = WaypointMapModelModules> extends PointerMapRangeTargetRotationController<M> {
  public static readonly DEFAULT_MAP_RANGES: readonly NumberUnit<UnitFamily.Distance>[] = [
    ...[
      250,
      400,
      500,
      750,
      1000,
      1500,
      2500
    ].map(value => UnitType.FOOT.createNumber(value)),
    ...[
      0.5,
      0.75,
      1,
      1.5,
      2.5,
      4,
      5,
      7.5,
      10,
      15,
      25,
      40,
      50,
      75,
      100,
      150,
      250,
      400,
      500,
      750,
      1000
    ].map(value => UnitType.NMILE.createNumber(value))
  ];
  public static readonly DEFAULT_MAP_RANGE_INDEX = 14;

  private readonly airplanePropsModule = this.mapModel.getModule('ownAirplaneProps');

  private readonly airplanePositionChangedHandler = this.onAirplanePositionChanged.bind(this);

  private areAirplanePositionListenersActive = false;

  /**
   * Constructor.
   * @param mapModel The map model.
   * @param mapProjection The map projection.
   * @param deadZone A subscribable which provides the dead zone around the edge of the map projection window.
   * @param rangeArray A subscribable which provides an array of valid map ranges.
   * @param pointerBounds A subscribable which provides the bounds of the area accessible to the map pointer. The
   * bounds should be expressed as `[left, top, right, bottom]` in pixels.
   * @param rangeIndex A subscribable which provides a range index for this controller to bind.
   * @param waypoint A subscribable which provides a waypoint for this controller to bind as the focused waypoint.
   */
  constructor(
    mapModel: MapModel<M>,
    mapProjection: MapProjection,
    deadZone: Subscribable<ReadonlyFloat64Array>,
    rangeArray: Subscribable<readonly NumberUnitInterface<UnitFamily.Distance>[]>,
    pointerBounds: Subscribable<ReadonlyFloat64Array>,
    private readonly rangeIndex: Subscribable<number>,
    private readonly waypoint: Subscribable<Waypoint | null>
  ) {
    super(mapModel, mapProjection, deadZone, rangeArray, WaypointMapRangeTargetRotationController.DEFAULT_MAP_RANGE_INDEX, pointerBounds);
  }

  /** @inheritdoc */
  protected initListeners(): void {
    super.initListeners();

    this.rangeIndex.sub(this.onRangeIndexChanged.bind(this));
    this.waypoint.sub(this.onWaypointChanged.bind(this), true);
  }

  /** @inheritdoc */
  protected getDesiredRangeEndpoints(out: Float64Array): Float64Array {
    const trueCenterRelX = this.nominalToTrueRelativeX(0.5);
    const trueCenterRelY = this.nominalToTrueRelativeY(0.5);

    out[0] = trueCenterRelX;
    out[1] = trueCenterRelY;
    out[2] = trueCenterRelX;
    out[3] = this.nominalToTrueRelativeY(0.75);
    return out;
  }

  /** @inheritdoc */
  protected getDesiredTargetOffset(out: Float64Array): Float64Array {
    const deadZone = this.deadZone.get();
    const trueCenterOffsetX = (deadZone[0] - deadZone[2]) / 2;
    const trueCenterOffsetY = (deadZone[1] - deadZone[3]) / 2;

    return Vec2Math.set(trueCenterOffsetX, trueCenterOffsetY, out);
  }

  /**
   * Responds to range index changes.
   */
  protected onRangeIndexChanged(): void {
    this.currentMapRangeIndex = this.rangeIndex.get();
    this.updateRangeFromIndex();
    this.scheduleProjectionUpdate();
  }

  /**
   * Updates the map target based on the airplane's present position.
   */
  protected updateTargetFromPPos(): void {
    this.currentMapParameters.target.set(this.airplanePropsModule.position.get());
  }

  /**
   * Updates the map target based on the focused waypoint.
   */
  protected updateTargetFromWaypoint(): void {
    const waypoint = this.waypoint.get();
    if (waypoint) {
      this.currentMapParameters.target.set(waypoint.location);
      this.pointerModule.position.set(this.mapProjection.getTargetProjected());
    }
  }

  /**
   * Responds to focused waypoint changes.
   */
  protected onWaypointChanged(): void {
    this.updateAirplanePositionListeners();
    this.updateTargetFromWaypoint();
    this.scheduleProjectionUpdate();
  }

  /**
   * Responds to airplane position changes.
   */
  protected onAirplanePositionChanged(): void {
    this.updateTargetFromPPos();
    this.scheduleProjectionUpdate();
  }

  /** @inheritdoc */
  protected onPointerActiveChanged(isActive: boolean): void {
    this.updateAirplanePositionListeners();

    super.onPointerActiveChanged(isActive);
  }

  /** @inheritdoc */
  protected onPointerDeactivated(): void {
    this.updateTargetFromWaypoint();
  }

  /**
   * Updates listeners for airplane position and on ground status.
   */
  protected updateAirplanePositionListeners(): void {
    this.setAirplanePositionListenersActive(!this.waypoint.get() && !this.pointerModule.isActive.get());
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
    } else {
      this.airplanePropsModule.position.unsub(this.airplanePositionChangedHandler);
    }

    this.areAirplanePositionListenersActive = value;
  }
}