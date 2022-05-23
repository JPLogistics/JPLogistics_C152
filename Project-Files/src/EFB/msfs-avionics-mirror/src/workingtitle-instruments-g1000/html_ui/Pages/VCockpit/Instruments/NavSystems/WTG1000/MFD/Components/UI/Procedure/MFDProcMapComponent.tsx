import {
  FSComponent, GeoPoint, NumberUnitInterface, ReadonlyFloat64Array, Subject, Subscribable, UnitFamily, UnitType,
  Vec2Math, Vec2Subject, VNode
} from 'msfssdk';
import { DebounceTimer } from 'msfssdk/utils/time';
import { MapCullableTextLabelManager, MapCullableTextLayer, MapModel, MapOwnAirplaneLayer, MapProjection } from 'msfssdk/components/map';
import { FlightPlan, FlightPlanner } from 'msfssdk/flightplan';
import { ProcedureType } from 'garminsdk/flightplan';
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
import { MapWaypointHighlightStyles, MapWaypointStyles } from '../../../../Shared/Map/MapWaypointStyles';
import { PointerMapComponent, PointerMapComponentProps, PointerMapRangeTargetRotationController } from '../../../../Shared/Map/PointerMapComponent';
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
export interface MFDProcMapComponentProps extends PointerMapComponentProps<MFDProcMapModelModules> {
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

  /** The unique ID for this map's Bing component. */
  bingId: string;
}

/**
 * A G1000 MFD procedure preview map component.
 */
export class MFDProcMapComponent extends PointerMapComponent<MFDProcMapModelModules, MFDProcMapComponentProps, MFDProcMapRangeTargetRotationController> {
  private static readonly FLIGHT_PLAN_FOCUS_DEFAULT_RANGE_INDEX = 17;

  protected readonly rtrController = new MFDProcMapRangeTargetRotationController(
    this.props.model,
    this.mapProjection,
    this.deadZone,
    MapRangeSettings.getRangeArraySubscribable(this.props.bus),
    this.pointerBoundsSub,
    this.props.rangeIndex,
    MFDProcMapComponent.FLIGHT_PLAN_FOCUS_DEFAULT_RANGE_INDEX
  );

  private readonly textManager = new MapCullableTextLabelManager();
  private readonly waypointRenderer = new MapWaypointRenderer(this.textManager);

  private readonly crosshairController = new MFDProcMapCrosshairController(this.props.model);


  /** @inheritdoc */
  public onAfterRender(thisNode: VNode): void {
    super.onAfterRender(thisNode);

    this.initEventBusHandlers();
    this.initControllers();
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
        <MFDProcMapPreviewLayer
          model={this.props.model} mapProjection={this.mapProjection}
          bus={this.props.bus}
          procedureType={this.props.procedureType}
          procedurePlan={this.props.procedurePlan}
          transitionPlan={this.props.transitionPlan}
          waypointRenderer={this.waypointRenderer}
          procedureWaypointStyles={MFDProcMapWaypointStyles.getStyles(true, 10, 10)}
          transitionWaypointStyles={MFDProcMapWaypointStyles.getStyles(false, 0, 0)}
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
          size={MapPointerInfoLayerSize.Full}
        />
        <MapPointerLayer
          model={this.props.model} mapProjection={this.mapProjection}
        />
      </div>
    );
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
 * A controller for handling map range, target, and rotation changes for the MFD procedure preview map.
 */
export class MFDProcMapRangeTargetRotationController extends PointerMapRangeTargetRotationController<MFDProcMapModelModules> {
  private static readonly FOCUS_DEBOUNCE_DELAY = 500; // milliseconds

  private readonly airplanePropsModule = this.mapModel.getModule('ownAirplaneProps');
  private readonly focusModule = this.mapModel.getModule('focus');

  private readonly focusCalculator = new MapFlightPlanFocusCalculator(this.mapProjection);
  private readonly focusRangeTarget = { range: 0, target: new GeoPoint(0, 0) };

  private readonly focusDebounceTimer = new DebounceTimer();
  private readonly focusMargins = new Float64Array([20, 20, 20, 20]);

  private readonly airplanePositionChangedHandler = this.onAirplanePositionChanged.bind(this);
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
   * @param pointerBounds A subscribable which provides the bounds of the area accessible to the map pointer. The
   * bounds should be expressed as `[left, top, right, bottom]` in pixels.
   * @param rangeIndex A subscribable which provides a range index for this controller to bind.
   * @param flightPlanFocusDefaultRangeIndex The index of the map range to which this controller defaults when focusing
   * on the flight plan with a calculated focus range of zero.
   */
  constructor(
    mapModel: MapModel<MFDProcMapModelModules>,
    mapProjection: MapProjection,
    deadZone: Subscribable<ReadonlyFloat64Array>,
    rangeArray: Subscribable<readonly NumberUnitInterface<UnitFamily.Distance>[]>,
    pointerBounds: Subscribable<ReadonlyFloat64Array>,
    private readonly rangeIndex: Subject<number>,
    private readonly flightPlanFocusDefaultRangeIndex: number
  ) {
    super(mapModel, mapProjection, deadZone, rangeArray, flightPlanFocusDefaultRangeIndex, pointerBounds);
  }

  /** @inheritdoc */
  protected initListeners(): void {
    super.initListeners();

    this.rangeIndex.sub(this.onRangeIndexChanged.bind(this));
    this.focusModule.isActive.sub(this.onIsFlightPlanFocusActiveChanged.bind(this));
  }

  /** @inheritdoc */
  protected initState(): void {
    super.initState();

    this.updateFocusMargins();
  }

  /** @inheritdoc */
  protected onDeadZoneChanged(): void {
    this.updateFocusMargins();
    this.updateRangeEndpoints();
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
   * Updates the map target based on the airplane's present position.
   */
  private updateTargetFromPPos(): void {
    this.currentMapParameters.target.set(this.airplanePropsModule.position.get());
  }

  /**
   * Responds to range index changes.
   */
  private onRangeIndexChanged(): void {
    this.currentMapRangeIndex = this.rangeIndex.get();
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

  /** @inheritdoc */
  protected onPointerActivated(): void {
    this.focusModule.isActive.set(false);
    this.setAirplanePositionListenersActive(false);
    this.updateIsFlightPlanFocusedListener();
  }

  /** @inheritdoc */
  protected onPointerDeactivated(): void {
    this.updateIsFlightPlanFocusedListener();
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
    const targetRange = this.focusCalculator.calculateRangeTarget(
      this.focusModule.focus.get(),
      this.focusMargins,
      this.airplanePropsModule.position.get(),
      this.focusRangeTarget
    );

    if (isNaN(targetRange.range)) {
      this.setAirplanePositionListenersActive(true);
      return;
    }

    this.setAirplanePositionListenersActive(false);

    this.currentMapParameters.target.set(targetRange.target);

    const ranges = this.rangeArray.get();

    const rangeIndex = targetRange.range > 0
      ? ranges.findIndex(range => range.asUnit(UnitType.GA_RADIAN) >= targetRange.range)
      : this.flightPlanFocusDefaultRangeIndex;

    this.rangeIndex.set(rangeIndex < 0 ? ranges.length - 1 : rangeIndex);

    this.updateRangeFromIndex();
    this.scheduleProjectionUpdate();
  }
}