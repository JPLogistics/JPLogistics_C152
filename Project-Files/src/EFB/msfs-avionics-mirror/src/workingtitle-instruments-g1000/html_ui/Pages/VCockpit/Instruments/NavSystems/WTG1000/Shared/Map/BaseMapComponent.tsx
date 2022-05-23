import { BitFlags, FSComponent, GeoPoint, NumberUnitInterface, ReadonlyFloat64Array, Subscribable, UnitFamily, UnitType, VecNSubject, VNode } from 'msfssdk';
import { MapComponent, MapComponentProps, MapIndexedRangeModule, MapModel, MapProjection, MapProjectionChangeType } from 'msfssdk/components/map';

/**
 * Modules required by the base map.
 */
export interface BaseMapModules {
  /** Range module. */
  range: MapIndexedRangeModule;
}

/**
 * Component props for BaseMapComponent.
 */
export interface BaseMapComponentProps<M extends BaseMapModules = BaseMapModules> extends MapComponentProps<M> {
  /** A subscribable which provides the update frequency for the data the map uses. */
  dataUpdateFreq: Subscribable<number>;

  /**
   * A subscribable which provides the size of the dead zone around each edge of the map projection window, which is
   * displayed but excluded in map range calculations. Expressed as [left, top, right, bottom] in pixels. Defaults to 0
   * on all sides.
   */
  deadZone?: Subscribable<Float64Array>;

  /** The CSS class to apply to the root of the component. */
  class?: string;
}

/**
 * A G1000 map component.
 */
export abstract class BaseMapComponent
  <
  M extends BaseMapModules,
  P extends BaseMapComponentProps<M> = BaseMapComponentProps<M>,
  R extends BaseMapRangeTargetRotationController<M> = BaseMapRangeTargetRotationController<M>
  >
  extends MapComponent<P> {

  /** A node reference to the root of this component. */
  protected readonly rootRef = FSComponent.createRef<HTMLElement>();

  protected readonly deadZone: Subscribable<ReadonlyFloat64Array>;

  protected abstract readonly rtrController: R;

  /** @inheritdoc */
  constructor(props: P) {
    super(props);

    this.deadZone = this.props.deadZone ?? VecNSubject.create(new Float64Array(4));
    this.deadZone.sub(this.onDeadZoneChanged.bind(this));
  }

  /**
   * This method is called when the size of this map's dead zone changes.
   */
  protected onDeadZoneChanged(): void {
    // noop
  }

  /** @inheritdoc */
  public onAfterRender(thisNode: VNode): void {
    super.onAfterRender(thisNode);

    this.setRootSize(this.mapProjection.getProjectedSize());
    this.rtrController.init();
  }

  /**
   * Sets the size of this map's root HTML element.
   * @param size The new size, in pixels.
   */
  protected setRootSize(size: ReadonlyFloat64Array): void {
    this.rootRef.instance.style.width = `${size[0]}px`;
    this.rootRef.instance.style.height = `${size[1]}px`;
  }

  /** @inheritdoc */
  protected onProjectedSizeChanged(): void {
    this.setRootSize(this.mapProjection.getProjectedSize());
  }

  /** @inheritdoc */
  protected onUpdated(time: number, elapsed: number): void {
    this.updateRangeTargetRotationController();
    super.onUpdated(time, elapsed);
  }

  /**
   * Updates this map's range/target/rotation controller.
   */
  protected updateRangeTargetRotationController(): void {
    this.rtrController.update();
  }
}

/**
 * A controller for handling map range, target, and rotation changes.
 */
export abstract class BaseMapRangeTargetRotationController<M extends BaseMapModules = BaseMapModules> {
  protected currentMapRangeIndex = this.defaultMapRangeIndex;

  protected needUpdateProjection = false;

  protected currentMapParameters = {
    range: 0,
    rangeEndpoints: new Float64Array(4),
    target: new GeoPoint(0, 0),
    targetProjectedOffset: new Float64Array(2),
    rotation: 0
  };

  /**
   * Constructor.
   * @param mapModel The map model.
   * @param mapProjection The map projection.
   * @param deadZone A subscribable which provides the dead zone around the edge of the map projection window.
   * @param rangeArray A subscribable which provides an array of valid map ranges.
   * @param defaultMapRangeIndex The default map range index.
   */
  constructor(
    protected readonly mapModel: MapModel<M>,
    protected readonly mapProjection: MapProjection,
    protected readonly deadZone: Subscribable<ReadonlyFloat64Array>,
    protected readonly rangeArray: Subscribable<readonly NumberUnitInterface<UnitFamily.Distance>[]>,
    protected readonly defaultMapRangeIndex: number
  ) {
  }

  /**
   * Executes this controller's first-run initialization code.
   */
  public init(): void {
    this.rangeArray.sub(this.onRangeArrayChanged.bind(this), true);
    this.deadZone.sub(this.onDeadZoneChanged.bind(this));
    this.mapProjection.addChangeListener(this.onMapProjectionChanged.bind(this));
    this.initListeners();
    this.initState();
    this.scheduleProjectionUpdate();
  }

  /**
   * Initializes listeners required by this controller.
   */
  protected initListeners(): void {
    // noop
  }

  /**
   * Initializes this controller's state.
   */
  protected initState(): void {
    this.updateRangeFromIndex();
    this.updateTargetOffset();
    this.updateRangeEndpoints();
  }

  /**
   * This method is called when the size of the dead zone changes.
   */
  protected onDeadZoneChanged(): void {
    this.updateTargetOffset();
    this.updateRangeEndpoints();
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
   * Updates the current range from the current range index.
   */
  protected updateRangeFromIndex(): void {
    const nominalRange = this.rangeArray.get()[this.currentMapRangeIndex];
    this.currentMapParameters.range = nominalRange.asUnit(UnitType.GA_RADIAN);
  }

  /**
   * Updates the current range endpoints.
   */
  protected updateRangeEndpoints(): void {
    this.getDesiredRangeEndpoints(this.currentMapParameters.rangeEndpoints);
  }

  /**
   * Gets the current desired range endpoints.
   * @param out The vector to which to write the result.
   * @returns The current desired range endpoints.
   */
  protected abstract getDesiredRangeEndpoints(out: Float64Array): Float64Array;

  /**
   * Updates the target offset.
   */
  protected updateTargetOffset(): void {
    this.getDesiredTargetOffset(this.currentMapParameters.targetProjectedOffset);
  }

  /**
   * Gets the current desired target offset.
   * @param out The vector to which to write the result.
   * @returns The current desired target offset.
   */
  protected abstract getDesiredTargetOffset(out: Float64Array): Float64Array;

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
    this.updateTargetOffset();
    this.updateRangeEndpoints();
    this.scheduleProjectionUpdate();
  }

  /**
   * Schedules an update to the map projection.
   */
  protected scheduleProjectionUpdate(): void {
    this.needUpdateProjection = true;
  }

  /**
   * Updates this controller.
   */
  public update(): void {
    this.updateModules();
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
   * Converts a nominal relative projected x coordinate to a true relative projected x coordinate for this controller's
   * map. Nominal relative coordinates are expressed relative to the map's projected width and height, *excluding* dead
   * zones. True relative coordinates are expressed relative to the map's projected width and height, *including* dead
   * zones.
   * @param nominalRelX A nominal relative projected x coordinate.
   * @returns The true relative projected x coordinate equivalent of the specified nominal coordinate for this
   * controller's map.
   */
  protected nominalToTrueRelativeX(nominalRelX: number): number {
    const width = this.mapProjection.getProjectedSize()[0];
    const deadZone = this.deadZone.get();

    return (nominalRelX * (width - deadZone[0] - deadZone[2]) + deadZone[0]) / width;
  }

  /**
   * Converts a nominal relative projected y coordinate to a true relative projected x coordinate for this controller's
   * map. Nominal relative coordinates are expressed relative to the map's projected width and height, *excluding* dead
   * zones. True relative coordinates are expressed relative to the map's projected width and height, *including* dead
   * zones.
   * @param nominalRelY A nominal relative projected y coordinate.
   * @returns The true relative projected y coordinate equivalent of the specified nominal coordinate for this
   * controller's map.
   */
  protected nominalToTrueRelativeY(nominalRelY: number): number {
    const height = this.mapProjection.getProjectedSize()[1];
    const deadZone = this.deadZone.get();

    return (nominalRelY * (height - deadZone[1] - deadZone[3]) + deadZone[1]) / height;
  }
}