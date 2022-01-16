import {
  BitFlags, DebounceTimer, FSComponent, GeoPoint, GeoPointInterface, NumberUnitInterface, Subject, Subscribable, UnitFamily, UnitType,
  Vec2Math, Vec2Subject, VecNSubject, VNode
} from 'msfssdk';
import {
  MapComponent, MapComponentProps, MapCullableTextLabelManager, MapCullableTextLayer, MapModel, MapOwnAirplaneLayer,
  MapProjection, MapProjectionChangeType
} from 'msfssdk/components/map';
import { FlightPlan, FlightPlanner } from 'msfssdk/flightplan';
import { ProcedureType } from '../../../../Shared/FlightPlan/Fms';
import { MapBingLayer } from '../../../../Shared/Map/Layers/MapBingLayer';
import { MapCrosshairLayer } from '../../../../Shared/Map/Layers/MapCrosshairLayer';
import { MapMiniCompassLayer } from '../../../../Shared/Map/Layers/MapMiniCompassLayer';
import { MapPointerInfoLayer, MapPointerInfoLayerSize } from '../../../../Shared/Map/Layers/MapPointerInfoLayer';
import { MapPointerLayer } from '../../../../Shared/Map/Layers/MapPointerLayer';
import { MapRangeRingLayer } from '../../../../Shared/Map/Layers/MapRangeRingLayer';
import { MapWaypointHighlightLayer } from '../../../../Shared/Map/Layers/MapWaypointHighlightLayer';
import { MapFlightPlanFocusCalculator } from '../../../../Shared/Map/MapFlightPlanFocusCalculator';
import { MapRangeSettings } from '../../../../Shared/Map/MapRangeSettings';
import { MapWaypointRenderer } from '../../../../Shared/Map/MapWaypointRenderer';
import { MapWaypointHighlightStyles, MapWaypointNormalStyles, MapWaypointStyles } from '../../../../Shared/Map/MapWaypointStyles';
import { MFDProcMapCrosshairController } from './MFDProcMapCrosshairController';
import { MFDProcMapModelModules } from './MFDProcMapModel';
import { MFDProcMapPreviewLayer } from './MFDProcMapPreviewLayer';
import { MFDProcMapWaypointStyles } from './MFDProcMapWaypointStyles';

/**
 * Properties to pass to the own airplane layer.
 */
export interface MFDProcMapOwnAirplaneLayerProps {
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
 * Component props for MFDProcMapComponent.
 */
export interface MFDProcMapComponentProps extends MapComponentProps<MFDProcMapModelModules> {
  /** A subscribable which provides the update frequency for the data the map uses. */
  dataUpdateFreq: Subscribable<number>;

  /** The unique ID for this map's Bing instance. */
  bingId: string;

  /**
   * A subscribable which provides the dead zone around each edge of the map projection window, which is displayed but
   * excluded in map range calculations. Expressed as [left, top, right, bottom] in pixels. Defaults to 0 on all sides.
   */
  deadZone?: Subscribable<Float64Array>;

  /** An instance of the flight planner. */
  flightPlanner: FlightPlanner;

  /** A subscribable which provides the procedure type previewed by the layer. */
  procedureType: Subscribable<ProcedureType>;

  /** A subscribable which provides the flight plan containing the procedure to be previewed. */
  procedurePlan: Subscribable<FlightPlan | null>;

  /** A subscribable which provides the flight plan containing the transitions to be previewed. */
  transitionPlan: Subscribable<FlightPlan | null>;

  /** Properties to pass to the own airplane layer. */
  ownAirplaneLayerProps: MFDProcMapOwnAirplaneLayerProps;

  /**
   * A subject to bind the map range index.
   */
  rangeIndex: Subject<number>;

  /** The CSS class(es) to apply to this component. */
  class?: string;
}

/**
 * A G1000 MFD procedure preview map component.
 */
export class MFDProcMapComponent extends MapComponent<MFDProcMapComponentProps> {
  private static readonly FLIGHT_PLAN_FOCUS_DEFAULT_RANGE_INDEX = 17;

  private readonly rootRef = FSComponent.createRef<HTMLDivElement>();
  private readonly bingLayerRef = FSComponent.createRef<MapBingLayer>();
  private readonly previewLayerRef = FSComponent.createRef<MFDProcMapPreviewLayer>();
  private readonly waypointHighlightLayerRef = FSComponent.createRef<MapWaypointHighlightLayer>();
  private readonly textLayerRef = FSComponent.createRef<MapCullableTextLayer>();
  private readonly rangeRingLayerRef = FSComponent.createRef<MapRangeRingLayer>();
  private readonly crosshairLayerRef = FSComponent.createRef<MapCrosshairLayer>();
  private readonly ownAirplaneLayerRef = FSComponent.createRef<MapOwnAirplaneLayer<MFDProcMapModelModules>>();
  private readonly miniCompassLayerRef = FSComponent.createRef<MapMiniCompassLayer>();
  private readonly pointerLayerRef = FSComponent.createRef<MapPointerLayer>();
  private readonly pointerInfoLayerRef = FSComponent.createRef<MapPointerInfoLayer>();

  private readonly deadZoneSub;
  private readonly pointerBoundsSub = VecNSubject.createFromVector(new Float64Array([0, 0, this.props.projectedWidth, this.props.projectedHeight]));

  private readonly rangeTargetRotationController: MFDProcMapRangeTargetRotationController;

  private readonly textManager = new MapCullableTextLabelManager();
  private readonly waypointRenderer = new MapWaypointRenderer(this.textManager);

  private readonly crosshairController = new MFDProcMapCrosshairController(this.props.model);

  /** @inheritdoc */
  constructor(props: MFDProcMapComponentProps) {
    super(props);

    this.deadZoneSub = this.props.deadZone ?? Subject.create(new Float64Array(4));

    this.rangeTargetRotationController = new MFDProcMapRangeTargetRotationController(
      this.props.model,
      this.mapProjection,
      this.deadZoneSub,
      MapRangeSettings.getRangeArraySubscribable(this.props.bus),
      this.props.rangeIndex,
      this.pointerBoundsSub,
      MFDProcMapComponent.FLIGHT_PLAN_FOCUS_DEFAULT_RANGE_INDEX
    );
  }

  /** @inheritdoc */
  public onAfterRender(): void {
    super.onAfterRender();

    this.setRootSize(this.mapProjection.getProjectedSize());
    this.deadZoneSub.sub(this.onDeadZoneChanged.bind(this), true);

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
    this.props.dataUpdateFreq.sub(freq => {
      this.props.model.getModule('ownAirplaneProps').beginSync(this.props.bus, freq);
    }, true);
  }

  /**
   * Initializes model controllers.
   */
  private initControllers(): void {
    this.crosshairController.init();
  }

  /**
   * Initializes this map's layers.
   */
  protected initLayers(): void {
    this.attachLayer(this.bingLayerRef.instance);
    this.attachLayer(this.previewLayerRef.instance);
    this.attachLayer(this.waypointHighlightLayerRef.instance);
    this.attachLayer(this.textLayerRef.instance);
    this.attachLayer(this.rangeRingLayerRef.instance);
    this.attachLayer(this.crosshairLayerRef.instance);
    this.attachLayer(this.ownAirplaneLayerRef.instance);
    this.attachLayer(this.miniCompassLayerRef.instance);
    this.attachLayer(this.pointerLayerRef.instance);
    this.attachLayer(this.pointerInfoLayerRef.instance);
  }

  /** @inheritdoc */
  protected onProjectedSizeChanged(): void {
    this.setRootSize(this.mapProjection.getProjectedSize());
    this.updatePointerBounds();
  }

  /**
   * Responds to changes in this map's dead zone.
   */
  private onDeadZoneChanged(): void {
    this.updatePointerBounds();
  }

  /**
   * Updates this map's pointer bounds.
   */
  private updatePointerBounds(): void {
    const deadZone = this.deadZoneSub.get();

    const size = this.mapProjection.getProjectedSize();
    const minX = deadZone[0];
    const minY = deadZone[1];
    const maxX = size[0] - deadZone[2];
    const maxY = size[1] - deadZone[3];
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

  /** @inheritdoc */
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
          bingId={this.props.bingId}
        />
        <MFDProcMapPreviewLayer
          ref={this.previewLayerRef} model={this.props.model} mapProjection={this.mapProjection}
          bus={this.props.bus}
          procedureType={this.props.procedureType}
          procedurePlan={this.props.procedurePlan}
          transitionPlan={this.props.transitionPlan}
          waypointRenderer={this.waypointRenderer}
          procedureWaypointStyles={MFDProcMapWaypointStyles.getStyles(true, 10, 10)}
          transitionWaypointStyles={MFDProcMapWaypointStyles.getStyles(false, 0, 0)}
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
          size={MapPointerInfoLayerSize.Full}
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
export class MFDProcMapRangeTargetRotationController {
  private static readonly FOCUS_DEBOUNCE_DELAY = 500; // milliseconds

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
  private readonly focusModule = this.mapModel.getModule('focus');

  private readonly focusCalculator = new MapFlightPlanFocusCalculator(this.mapProjection);
  private readonly focusRangeTarget = { range: 0, target: new GeoPoint(0, 0) };

  private readonly focusDebounceTimer = new DebounceTimer();
  private readonly focusMargins = new Float64Array([20, 20, 20, 20]);

  private readonly airplanePositionChangedHandler = this.onAirplanePositionChanged.bind(this);
  private readonly pointerPositionChangedHandler = this.onPointerPositionChanged.bind(this);
  private readonly pointerTargetChangedHandler = this.onPointerTargetChanged.bind(this);
  private readonly pointerBoundsChangedHandler = this.onPointerBoundsChanged.bind(this);
  private readonly isFlightPlanFocusedChangedHandler = this.onIsFlightPlanFocusChanged.bind(this);
  private readonly flightPlanFocusChangedHandler = this.onFlightPlanFocusChanged.bind(this);

  private areAirplanePositionListenersActive = false;
  private isIsFlightPlanFocusedListenerActive = false;
  private areFlightPlanFocusListenersActive = false;

  private skipFlightPlanFocusDebounce = false;

  /**
   * Constructor.
   * @param mapModel The map model.
   * @param mapProjection The map projection.
   * @param deadZone A subscribable which provides the map's dead zone.
   * @param rangeArray A subscribable which provides an array of valid map ranges.
   * @param rangeIndex A subscribable which provides a range index for this controller to bind.
   * @param pointerBounds A subscribable which provides the bounds of the area accessible to the map pointer. The
   * bounds should be expressed as `[left, top, right, bottom]` in pixels.
   * @param flightPlanFocusDefaultRangeIndex The index of the map range to which this controller defaults when focusing
   * on the flight plan with a calculated focus range of zero.
   */
  constructor(
    private readonly mapModel: MapModel<MFDProcMapModelModules>,
    private readonly mapProjection: MapProjection,
    private readonly deadZone: Subscribable<Float64Array>,
    private readonly rangeArray: Subscribable<readonly NumberUnitInterface<UnitFamily.Distance>[]>,
    private readonly rangeIndex: Subject<number>,
    private readonly pointerBounds: Subscribable<Float64Array>,
    private readonly flightPlanFocusDefaultRangeIndex: number
  ) {
    this.updateFocusMargins();
    this.focusModule.isActive.sub(this.onIsFlightPlanFocusActiveChanged.bind(this));
  }

  /**
   * Executes this controller's first-run initialization code.
   */
  public init(): void {
    this.rangeArray.sub(ranges => {
      this.mapModel.getModule('range').nominalRanges.set(ranges);
    }, true);

    this.rangeIndex.sub(this.onRangeIndexChanged.bind(this));
    this.deadZone.sub(this.onDeadZoneChanged.bind(this));

    this.mapProjection.addChangeListener(this.onMapProjectionChanged.bind(this));
    this.initModuleListeners();
    this.initState();
    this.scheduleProjectionUpdate();
  }

  /**
   * Initializes module listeners.
   */
  private initModuleListeners(): void {
    this.pointerModule.isActive.sub(this.onPointerActiveChanged.bind(this), true);
  }

  /**
   * Initializes this controller's state.
   */
  private initState(): void {
    this.updateRangeFromIndex();
    this.updateTargetOffset();
    this.updateTargetFromPPos();
  }

  /**
   * This method is called when the size of the dead zone changes.
   */
  private onDeadZoneChanged(): void {
    this.updateFocusMargins();
    this.updateRangeFromIndex();
    this.updateTargetOffset();
    this.scheduleProjectionUpdate();
  }

  /**
   * Updates the flight plan focus margins.
   */
  private updateFocusMargins(): void {
    const deadZone = this.deadZone.get();

    this.focusMargins[0] = deadZone[0] + 20;
    this.focusMargins[1] = deadZone[1] + 20;
    this.focusMargins[2] = deadZone[2] + 20;
    this.focusMargins[3] = deadZone[3] + 20;
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
   * Updates the target offset.
   */
  private updateTargetOffset(): void {
    const deadZone = this.deadZone.get();
    const trueCenterOffsetX = (deadZone[0] - deadZone[2]) / 2;
    const trueCenterOffsetY = (deadZone[1] - deadZone[3]) / 2;

    this.currentMapParameters.targetProjectedOffset[0] = trueCenterOffsetX;
    this.currentMapParameters.targetProjectedOffset[1] = trueCenterOffsetY;
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
    this.updatePointerListeners();

    if (isActive) {
      this.focusModule.isActive.set(false);
      this.setAirplanePositionListenersActive(false);
    }
    this.updateIsFlightPlanFocusedListener();

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
   * Responds to changes in whether flight plan focus is active.
   * @param isActive Whether flight plan focus is active.
   */
  private onIsFlightPlanFocusActiveChanged(isActive: boolean): void {
    this.updateFlightPlanFocusListeners();

    if (!isActive) {
      this.focusDebounceTimer.clear();
    }

    this.scheduleProjectionUpdate();
  }

  /**
   * Responds to changes in whether the flight plan is focused.
   * @param isFocused Whether the flight plan is focused.
   */
  private onIsFlightPlanFocusChanged(isFocused: boolean): void {
    this.focusModule.isActive.set(isFocused);
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
   * Updates is flight plan focused listener.
   */
  private updateIsFlightPlanFocusedListener(): void {
    this.setIsFlightPlanFocusedListenerActive(!this.pointerModule.isActive.get());
  }

  /**
   * Updates flight plan focus listeners.
   */
  private updateFlightPlanFocusListeners(): void {
    this.setFlightPlanFocusListenersActive(this.focusModule.isActive.get());
  }

  /**
   * Activates or deactivates the is flight plan focused listener.
   * @param value Whether to activate the is flight plan focused listener.
   */
  private setIsFlightPlanFocusedListenerActive(value: boolean): void {
    if (value === this.isIsFlightPlanFocusedListenerActive) {
      return;
    }

    if (value) {
      this.focusModule.isFocused.sub(this.isFlightPlanFocusedChangedHandler, true);
    } else {
      this.focusModule.isFocused.unsub(this.isFlightPlanFocusedChangedHandler);
    }

    this.isIsFlightPlanFocusedListenerActive = value;
  }

  /**
   * Activates or deactivates flight plan focus listeners.
   * @param value Whether to activate flight plan focus listeners.
   */
  private setFlightPlanFocusListenersActive(value: boolean): void {
    if (value === this.areFlightPlanFocusListenersActive) {
      return;
    }

    if (value) {
      this.skipFlightPlanFocusDebounce = true;
      this.focusModule.focus.sub(this.flightPlanFocusChangedHandler, true);
      this.skipFlightPlanFocusDebounce = false;
    } else {
      this.focusModule.focus.unsub(this.flightPlanFocusChangedHandler);
    }

    this.areFlightPlanFocusListenersActive = value;
  }

  /**
   * Responds to changes in the flight plan focus.
   */
  private onFlightPlanFocusChanged(): void {
    if (this.skipFlightPlanFocusDebounce) {
      this.updateRangeTargetFromFocus();
    } else {
      this.scheduleUpdateRangeTargetFromFocus();
    }
  }

  private readonly updateRangeTargetFromFocusBound = this.updateRangeTargetFromFocus.bind(this);

  /**
   * Schedules an update of the map target and range from the current flight plan focus after a debounce delay.
   */
  private scheduleUpdateRangeTargetFromFocus(): void {
    this.focusDebounceTimer.schedule(
      this.updateRangeTargetFromFocusBound,
      MFDProcMapRangeTargetRotationController.FOCUS_DEBOUNCE_DELAY
    );
  }

  /**
   * Updates the map target and range from the current flight plan focus.
   */
  private updateRangeTargetFromFocus(): void {
    const targetRange = this.focusCalculator.calculateRangeTarget(this.focusModule.focus.get(), this.focusMargins, this.focusRangeTarget);

    if (isNaN(targetRange.range)) {
      this.setAirplanePositionListenersActive(true);
      return;
    }

    this.setAirplanePositionListenersActive(false);

    this.currentMapParameters.target.set(targetRange.target);

    const ranges = this.rangeArray.get();

    // when flight plan is focused, we are guaranteed to be in North Up mode, so true range = nominal range * 4.
    const rangeIndex = targetRange.range > 0
      ? ranges.findIndex(range => range.asUnit(UnitType.GA_RADIAN) * 4 >= targetRange.range)
      : this.flightPlanFocusDefaultRangeIndex;

    this.rangeIndex.set(rangeIndex < 0 ? ranges.length - 1 : rangeIndex);

    this.updateRangeFromIndex();
    this.scheduleProjectionUpdate();
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
      Vec2Math.set(scrollDeltaX, scrollDeltaY, MFDProcMapRangeTargetRotationController.vec2Cache[0]),
      MFDProcMapRangeTargetRotationController.vec2Cache[0]
    );

    this.mapProjection.invert(newTargetProjected, this.currentMapParameters.target);
    this.scheduleProjectionUpdate();

    this.needUpdatePointerScroll = false;
  }
}