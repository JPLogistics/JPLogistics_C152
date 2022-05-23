import { FSComponent, GeoPointInterface, NumberUnitInterface, Subject, Subscribable, UnitFamily, Vec2Math, VecNSubject } from 'msfssdk';
import { MapModel, MapProjection } from 'msfssdk/components/map';
import { BaseMapComponent, BaseMapComponentProps, BaseMapModules, BaseMapRangeTargetRotationController } from './BaseMapComponent';
import { MapPointerModule } from './modules/MapPointerModule';

/**
 * Modules required by a pointer map.
 */
export interface PointerMapModules extends BaseMapModules {
  /** Pointer module. */
  pointer: MapPointerModule;
}

/**
 * Component props for PointerMapComponent.
 */
export interface PointerMapComponentProps<M extends PointerMapModules = PointerMapModules> extends BaseMapComponentProps<M> {
  /**
   * A subscribable which provides the offset of the boundary surrounding the area in which the pointer can freely
   * move, from the edge of the projected map, minus the dead zone. Expressed as `[left, top, right, bottom]`,
   * relative to the width and height, as appropriate, of the projected map. A positive offset is directed toward
   * the center of the map. Defaults to 0 on all sides.
   */
  pointerBoundsOffset?: Subscribable<Float64Array>;
}

/**
 * A G1000 map component which supports a pointer.
 */
export abstract class PointerMapComponent
  <
  M extends PointerMapModules = PointerMapModules,
  P extends PointerMapComponentProps<M> = PointerMapComponentProps<M>,
  R extends PointerMapRangeTargetRotationController<M> = PointerMapRangeTargetRotationController<M>
  >
  extends BaseMapComponent<M, P, R> {

  protected readonly pointerBoundsOffset: Subscribable<Float64Array>;
  protected readonly pointerBoundsSub = VecNSubject.createFromVector(new Float64Array([0, 0, this.props.projectedWidth, this.props.projectedHeight]));

  /**
   * Creates an instance of a NavMap.
   * @param props The properties of the nav map.
   */
  constructor(props: P) {
    super(props);

    this.pointerBoundsOffset = this.props.pointerBoundsOffset ?? Subject.create(new Float64Array(4));
    this.pointerBoundsOffset.sub(this.updatePointerBounds.bind(this));
    this.updatePointerBounds();
  }

  /** @inheritdoc */
  protected onDeadZoneChanged(): void {
    super.onDeadZoneChanged();

    this.updatePointerBounds();
  }

  /** @inheritdoc */
  protected onProjectedSizeChanged(): void {
    super.onProjectedSizeChanged();

    this.updatePointerBounds();
  }

  /**
   * Updates this map's pointer bounds.
   */
  protected updatePointerBounds(): void {
    const deadZone = this.deadZone.get();
    const offset = this.pointerBoundsOffset.get();

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
      Math.min(centerX, minX + width * offset[0]),
      Math.min(centerY, minY + height * offset[1]),
      Math.max(centerX, maxX - width * offset[2]),
      Math.max(centerY, maxY - height * offset[3])
    );
  }
}

/**
 * A controller for handling map range, target, and rotation changes. Supports the map pointer.
 */
export abstract class PointerMapRangeTargetRotationController<M extends PointerMapModules = PointerMapModules> extends BaseMapRangeTargetRotationController<M> {
  protected needUpdatePointerScroll = false;

  protected readonly pointerModule = this.mapModel.getModule('pointer');

  protected readonly pointerPositionChangedHandler = this.onPointerPositionChanged.bind(this);
  protected readonly pointerTargetChangedHandler = this.onPointerTargetChanged.bind(this);
  protected readonly pointerBoundsChangedHandler = this.onPointerBoundsChanged.bind(this);

  /**
   * Constructor.
   * @param mapModel The map model.
   * @param mapProjection The map projection.
   * @param deadZone A subscribable which provides the dead zone around the edge of the map projection window.
   * @param rangeArray A subscribable which provides an array of valid map ranges.
   * @param defaultMapRangeIndex The default map range index.
   * @param pointerBounds A subscribable which provides the bounds of the area accessible to the map pointer. The
   * bounds should be expressed as `[left, top, right, bottom]` in pixels.
   */
  constructor(
    mapModel: MapModel<M>,
    mapProjection: MapProjection,
    deadZone: Subscribable<Float64Array>,
    rangeArray: Subscribable<readonly NumberUnitInterface<UnitFamily.Distance>[]>,
    defaultMapRangeIndex: number,
    protected readonly pointerBounds: Subscribable<Float64Array>
  ) {
    super(mapModel, mapProjection, deadZone, rangeArray, defaultMapRangeIndex);
  }

  /** @inheritdoc */
  protected initListeners(): void {
    super.initListeners();

    this.pointerModule.isActive.sub(this.onPointerActiveChanged.bind(this));
  }

  /** @inheritdoc */
  protected initState(): void {
    super.initState();

    this.onPointerActiveChanged(this.pointerModule.isActive.get());
  }

  /**
   * Responds to map pointer activation changes.
   * @param isActive Whether the map pointer is active.
   */
  protected onPointerActiveChanged(isActive: boolean): void {
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

  private readonly pointerVec2Cache = [new Float64Array(2)];

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
      Vec2Math.set(scrollDeltaX, scrollDeltaY, this.pointerVec2Cache[0]),
      this.pointerVec2Cache[0]
    );

    this.mapProjection.invert(newTargetProjected, this.currentMapParameters.target);
    this.scheduleProjectionUpdate();

    this.needUpdatePointerScroll = false;
  }
}