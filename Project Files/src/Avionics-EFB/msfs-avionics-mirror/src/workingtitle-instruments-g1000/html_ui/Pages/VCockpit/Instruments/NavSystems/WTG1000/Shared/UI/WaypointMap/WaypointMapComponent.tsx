import {
  BitFlags, FSComponent, GeoPoint, GeoPointInterface, NumberUnit, NumberUnitInterface, Subject, Subscribable, UnitFamily, UnitType,
  Vec2Math, Vec2Subject, VecNSubject, VNode
} from 'msfssdk';
import {
  MapComponent, MapComponentProps, MapCullableTextLabelManager, MapCullableTextLayer, MapModel, MapOwnAirplaneLayer,
  MapProjection, MapProjectionChangeType
} from 'msfssdk/components/map';

import { MapBingLayer } from '../../Map/Layers/MapBingLayer';
import { MapMiniCompassLayer } from '../../Map/Layers/MapMiniCompassLayer';
import { MapRangeRingLayer } from '../../Map/Layers/MapRangeRingLayer';
import { MapWaypointHighlightLayer } from '../../Map/Layers/MapWaypointHighlightLayer';
import { MapWaypointsLayer } from '../../Map/Layers/MapWaypointsLayer';
import { MapWaypointRenderer } from '../../Map/MapWaypointRenderer';
import { MapWaypointHighlightStyles, MapWaypointNormalStyles, MapWaypointStyles } from '../../Map/MapWaypointStyles';
import { MapOrientationIndicator } from '../../Map/Indicators/MapOrientationIndicator';
import { MapTerrainController } from '../../Map/Controllers/MapTerrainController';
import { MapUserSettings } from '../../Map/MapUserSettings';
import { MapWaypointsVisController } from '../../Map/Controllers/MapWaypointsVisController';
import { Waypoint } from '../../Navigation/Waypoint';
import { WaypointMapModelModules } from './WaypointMapModel';
import { MapOrientation } from '../../Map/Modules/MapOrientationModule';
import { MapCrosshairController } from '../../Map/Controllers/MapCrosshairController';
import { MapCrosshairLayer } from '../../Map/Layers/MapCrosshairLayer';
import { MapPointerLayer } from '../../Map/Layers/MapPointerLayer';
import { MapPointerInfoLayer, MapPointerInfoLayerSize } from '../../Map/Layers/MapPointerInfoLayer';
import { MapRangeSettings } from '../../Map/MapRangeSettings';

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
 * Component props for MFDWptInfoMapComponent.
 */
export interface WaypointMapComponentProps extends MapComponentProps<WaypointMapModelModules> {
  /** A subscribable which provides the update frequency for the data the map uses. */
  dataUpdateFreq: Subscribable<number>;

  /** The unique ID for this map instance. */
  id: string;

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

  /** The CSS class(es) to apply to this component. */
  class?: string;
}

/**
 * A G1000 waypoint info map component.
 */
export abstract class WaypointMapComponent extends MapComponent<WaypointMapComponentProps> {
  private readonly rootRef = FSComponent.createRef<HTMLDivElement>();
  private readonly bingLayerRef = FSComponent.createRef<MapBingLayer>();
  private readonly waypointsLayerRef = FSComponent.createRef<MapWaypointsLayer>();
  private readonly waypointHighlightLayerRef = FSComponent.createRef<MapWaypointHighlightLayer>();
  private readonly textLayerRef = FSComponent.createRef<MapCullableTextLayer>();
  private readonly rangeRingLayerRef = FSComponent.createRef<MapRangeRingLayer>();
  private readonly crosshairLayerRef = FSComponent.createRef<MapCrosshairLayer>();
  private readonly ownAirplaneLayerRef = FSComponent.createRef<MapOwnAirplaneLayer<WaypointMapModelModules>>();
  private readonly miniCompassLayerRef = FSComponent.createRef<MapMiniCompassLayer>();
  private readonly pointerLayerRef = FSComponent.createRef<MapPointerLayer>();
  private readonly pointerInfoLayerRef = FSComponent.createRef<MapPointerInfoLayer>();

  protected readonly pointerBoundsSub = VecNSubject.createFromVector(new Float64Array([0, 0, this.props.projectedWidth, this.props.projectedHeight]));

  protected readonly rangeTargetRotationController: WaypointMapRangeTargetRotationController;

  protected readonly textManager = new MapCullableTextLabelManager();
  protected readonly waypointRenderer = new MapWaypointRenderer(this.textManager);

  protected readonly settingManager = MapUserSettings.getMfdManager(this.props.bus);

  protected readonly terrainColorController = new MapTerrainController(this.props.model, this.settingManager, false);
  protected readonly waypointsVisController = new MapWaypointsVisController(this.props.model, this.settingManager);
  protected readonly crosshairController = new MapCrosshairController(this.props.model);

  /** @inheritdoc */
  constructor(props: WaypointMapComponentProps) {
    super(props);

    this.updatePointerBounds();

    this.rangeTargetRotationController = new WaypointMapRangeTargetRotationController(
      this.props.model,
      this.mapProjection,
      MapRangeSettings.getRangeArraySubscribable(this.props.bus),
      this.props.rangeIndex,
      this.props.waypoint,
      this.pointerBoundsSub
    );
  }

  /** @inheritdoc */
  public onAfterRender(): void {
    super.onAfterRender();

    this.setRootSize(this.mapProjection.getProjectedSize());

    this.initEventBusHandlers();
    this.initWaypointHandler();

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
    this.props.dataUpdateFreq.sub(freq => {
      this.props.model.getModule('ownAirplaneProps').beginSync(this.props.bus, freq);
    }, true);
  }

  /**
   * Initializes the focused waypoint handler.
   */
  private initWaypointHandler(): void {
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
   * Initializes this map's layers.
   */
  protected initLayers(): void {
    this.attachLayer(this.bingLayerRef.instance);
    this.attachLayer(this.waypointsLayerRef.instance);
    this.attachLayer(this.waypointHighlightLayerRef.instance);
    this.attachLayer(this.textLayerRef.instance);
    this.attachLayer(this.rangeRingLayerRef.instance);
    this.attachLayer(this.crosshairLayerRef.instance);
    this.attachLayer(this.ownAirplaneLayerRef.instance);
    this.attachLayer(this.miniCompassLayerRef.instance);
    this.attachLayer(this.pointerLayerRef.instance);
    this.attachLayer(this.pointerInfoLayerRef.instance);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  protected onProjectedSizeChanged(): void {
    this.setRootSize(this.mapProjection.getProjectedSize());
    this.updatePointerBounds();
  }

  /**
   * Updates this map's pointer bounds.
   */
  private updatePointerBounds(): void {
    const size = this.mapProjection.getProjectedSize();
    const width = size[0];
    const height = size[1];

    this.pointerBoundsSub.set(
      width * 0.1,
      height * 0.1,
      width * 0.6,
      height * 0.9
    );
  }

  /**
   * A callback which is called when the focused waypoint changes.
   * @param waypoint The new focused waypoint.
   */
  private onWaypointChanged(waypoint: Waypoint | null): void {
    this.props.model.getModule('waypointHighlight').waypoint.set(waypoint);
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

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div ref={this.rootRef} class={`waypoint-map ${this.props.class ?? ''}`}>
        <MapBingLayer
          ref={this.bingLayerRef} model={this.props.model} mapProjection={this.mapProjection}
          bingId={this.props.id}
        />
        <MapWaypointsLayer
          ref={this.waypointsLayerRef} model={this.props.model} mapProjection={this.mapProjection}
          bus={this.props.bus}
          waypointRenderer={this.waypointRenderer} textManager={this.textManager}
          styles={this.getWaypointsLayerStyles()}
        />
        <MapWaypointHighlightLayer
          ref={this.waypointHighlightLayerRef} model={this.props.model} mapProjection={this.mapProjection}
          waypointRenderer={this.waypointRenderer} textManager={this.textManager}
          styles={this.getWaypointHighlightLayerStyles()}
        />
        <MapCullableTextLayer
          ref={this.textLayerRef} model={this.props.model} mapProjection={this.mapProjection}
          manager={this.textManager}
        />
        <MapRangeRingLayer
          ref={this.rangeRingLayerRef} model={this.props.model} mapProjection={this.mapProjection}
          showLabel={true} strokeWidth={2} strokeStyle={'white'}
        />
        <MapCrosshairLayer
          ref={this.crosshairLayerRef} model={this.props.model} mapProjection={this.mapProjection}
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
        <MapPointerInfoLayer
          ref={this.pointerInfoLayerRef} model={this.props.model} mapProjection={this.mapProjection}
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
          ref={this.pointerLayerRef} model={this.props.model} mapProjection={this.mapProjection}
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
 * A controller for handling map range, target, and rotation changes.
 */
export class WaypointMapRangeTargetRotationController {
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

  private static readonly vec2Cache = [new Float64Array(2)];

  private needUpdateProjection = false;
  private needUpdatePointerScroll = false;

  private currentMapParameters = {
    range: 0,
    target: new GeoPoint(0, 0),
    targetProjectedOffset: new Float64Array(2),
    rotation: 0
  };

  private readonly airplanePropsModule = this.mapModel.getModule('ownAirplaneProps');
  private readonly pointerModule = this.mapModel.getModule('pointer');

  private readonly airplanePositionChangedHandler = this.onAirplanePositionChanged.bind(this);
  private readonly pointerPositionChangedHandler = this.onPointerPositionChanged.bind(this);
  private readonly pointerTargetChangedHandler = this.onPointerTargetChanged.bind(this);
  private readonly pointerBoundsChangedHandler = this.onPointerBoundsChanged.bind(this);

  private areAirplanePositionListenersActive = false;

  /**
   * Creates an instance of a MapRangeController.
   * @param mapModel The map model.
   * @param mapProjection The map projection.
   * @param rangeArray A subscribable which provides an array of valid map ranges.
   * @param rangeIndex A subscribable which provides a range index for this controller to bind.
   * @param waypoint A subscribable which provides a waypoint for this controller to bind as the focused waypoint.
   * @param pointerBounds A subscribable which provides the bounds of the area accessible to the map pointer. The
   * bounds should be expressed as `[left, top, right, bottom]` in pixels.
   */
  constructor(
    protected readonly mapModel: MapModel<WaypointMapModelModules>,
    protected readonly mapProjection: MapProjection,
    protected readonly rangeArray: Subscribable<readonly NumberUnitInterface<UnitFamily.Distance>[]>,
    private readonly rangeIndex: Subscribable<number>,
    private readonly waypoint: Subscribable<Waypoint | null>,
    protected readonly pointerBounds: Subscribable<Float64Array>
  ) {
  }

  /**
   * Executes this controller's first-run initialization code.
   */
  public init(): void {
    this.rangeArray.sub(ranges => {
      this.mapModel.getModule('range').nominalRanges.set(ranges);
    }, true);

    this.rangeIndex.sub(this.onRangeIndexChanged.bind(this));

    this.mapProjection.addChangeListener(this.onMapProjectionChanged.bind(this));
    this.initModuleListeners();
    this.initState();
    this.scheduleProjectionUpdate();
  }

  /**
   * Initializes module listeners.
   */
  private initModuleListeners(): void {
    this.waypoint.sub(this.onWaypointChanged.bind(this), true);
    this.pointerModule.isActive.sub(this.onPointerActiveChanged.bind(this), true);
  }

  /**
   * Initializes this controller's state.
   */
  private initState(): void {
    this.updateRangeFromIndex();
    this.updateTargetFromPPos();
  }

  /**
   * Updates the current range from the current range index.
   */
  private updateRangeFromIndex(): void {
    const ranges = this.rangeArray.get();
    const nominalRange = ranges[Utils.Clamp(this.rangeIndex.get(), 0, ranges.length - 1)];
    this.currentMapParameters.range = this.convertToTrueRange(nominalRange);
  }

  /**
   * Converts a nominal range to a true map range.
   * @param nominalRange The nominal range to convert.
   * @returns the true map range for the given nominal range, in great-arc radians.
   */
  protected convertToTrueRange(nominalRange: NumberUnitInterface<UnitFamily.Distance>): number {
    return nominalRange.asUnit(UnitType.GA_RADIAN) * 4;
  }

  /**
   * Updates the map target based on the airplane's present position.
   */
  private updateTargetFromPPos(): void {
    this.currentMapParameters.target.set(this.airplanePropsModule.position.get());
  }

  /**
   * Updates the map target based on the airplane's present position.
   */
  private updateTargetFromWaypoint(): void {
    const waypoint = this.waypoint.get();
    if (waypoint) {
      this.currentMapParameters.target.set(waypoint.location);
      this.pointerModule.position.set(this.mapProjection.getTargetProjected());
    }
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
  private onProjectedSizeChanged(): void {
    this.updateRangeFromIndex();
    this.scheduleProjectionUpdate();
  }

  /**
   * Responds to range index changes.
   */
  private onRangeIndexChanged(): void {
    this.updateRangeFromIndex();
    this.scheduleProjectionUpdate();
  }

  /**
   * Responds to focused waypoint changes.
   */
  private onWaypointChanged(): void {
    this.updateAirplanePositionListeners();
    this.updateTargetFromWaypoint();
    this.scheduleProjectionUpdate();
  }

  /**
   * Responds to airplane position changes.
   */
  private onAirplanePositionChanged(): void {
    this.updateTargetFromPPos();
    this.scheduleProjectionUpdate();
  }

  /**
   * Responds to map pointer activation changes.
   * @param isActive Whether the map pointer is active.
   */
  private onPointerActiveChanged(isActive: boolean): void {
    this.updateAirplanePositionListeners();
    this.updatePointerListeners();

    if (!isActive) {
      this.updateTargetFromWaypoint();
    }

    this.scheduleProjectionUpdate();
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
   * Updates listeners for airplane position and on ground status.
   */
  private updateAirplanePositionListeners(): void {
    this.setAirplanePositionListenersActive(!this.waypoint.get() && !this.pointerModule.isActive.get());
  }

  /**
   * Activates or deactivates airplane position listeners.
   * @param value Whether to activate airplane position listeners.
   */
  private setAirplanePositionListenersActive(value: boolean): void {
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
   * Schedules an update.
   */
  private scheduleProjectionUpdate(): void {
    this.needUpdateProjection = true;
  }

  /**
   * Schedules an update to scrolling due to the pointer.
   */
  private schedulePointerScrollUpdate(): void {
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
  private updateModules(): void {
    this.mapModel.getModule('range').setNominalRangeIndex(this.rangeIndex.get());
  }

  /**
   * Updates the map projection with the latest range, target, and rotation values.
   */
  private updateMapProjection(): void {
    if (!this.needUpdateProjection) {
      return;
    }

    this.mapProjection.set(this.currentMapParameters);

    this.needUpdateProjection = false;
  }

  /**
   * Updates scrolling due to the pointer.
   */
  private updatePointerScroll(): void {
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
      Vec2Math.set(scrollDeltaX, scrollDeltaY, WaypointMapRangeTargetRotationController.vec2Cache[0]),
      WaypointMapRangeTargetRotationController.vec2Cache[0]
    );

    this.mapProjection.invert(newTargetProjected, this.currentMapParameters.target);
    this.scheduleProjectionUpdate();

    this.needUpdatePointerScroll = false;
  }
}