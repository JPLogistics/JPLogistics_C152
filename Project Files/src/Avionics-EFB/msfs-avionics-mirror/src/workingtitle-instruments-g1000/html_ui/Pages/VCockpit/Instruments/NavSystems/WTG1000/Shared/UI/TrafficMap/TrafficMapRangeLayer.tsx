import { BitFlags, FSComponent, NumberUnitSubject, Subject, UnitType, Vec2Math, VNode } from 'msfssdk';
import { MapIndexedRangeModule, MapLabeledRingLabel, MapLabeledRingLayer, MapLayer, MapLayerProps, MapProjection, MapProjectionChangeType, MapSyncedCanvasLayer } from 'msfssdk/components/map';
import { MapRangeDisplay } from '../../Map/MapRangeDisplay';
import { MapTrafficModule } from '../../Map/Modules/MapTrafficModule';

/**
 * Modules required for TrafficMapRangeLayer.
 */
export interface TrafficMapRangeLayerModules {
  /** Range module. */
  range: MapIndexedRangeModule;

  /** Traffic module. */
  traffic: MapTrafficModule;
}

/**
 * Component props for TrafficMapRangeLayer.
 */
export interface TrafficMapRangeLayerProps extends MapLayerProps<TrafficMapRangeLayerModules> {
  /** The stroke width of the range rings, in pixels. */
  strokeWidth: number;

  /** The stroke color of the range rings. */
  strokeColor: string;

  /** The stroke dash of the range rings. */
  strokeDash: number[];

  /** The size of the major ring ticks, in pixels. */
  majorTickSize: number;

  /** The size of the minor ring ticks, in pixels. */
  minorTickSize: number;
}

/**
 * A map layer which displays inner and outer range rings for traffic maps.
 */
export class TrafficMapRangeLayer extends MapLayer<TrafficMapRangeLayerProps> {
  private static readonly vec2Cache = [new Float64Array(2)];

  private readonly tickLayerRef = FSComponent.createRef<MapSyncedCanvasLayer<TrafficMapRangeLayerProps>>();
  private readonly innerRangeLayerRef = FSComponent.createRef<MapLabeledRingLayer<TrafficMapRangeLayerProps>>();
  private readonly outerRangeLayerRef = FSComponent.createRef<MapLabeledRingLayer<TrafficMapRangeLayerProps>>();

  private readonly rangeModule = this.props.model.getModule('range');
  private readonly trafficModule = this.props.model.getModule('traffic');

  private readonly innerRangeSub = NumberUnitSubject.createFromNumberUnit(UnitType.NMILE.createNumber(0));
  private readonly outerRangeSub = NumberUnitSubject.createFromNumberUnit(UnitType.NMILE.createNumber(0));

  private innerLabel: MapLabeledRingLabel<MapRangeDisplay> | null = null;
  private outerLabel: MapLabeledRingLabel<MapRangeDisplay> | null = null;
  private needUpdateRings = false;

  // eslint-disable-next-line jsdoc/require-jsdoc
  public onAttached(): void {
    this.tickLayerRef.instance.onAttached();
    this.innerRangeLayerRef.instance.onAttached();
    this.outerRangeLayerRef.instance.onAttached();

    this.initLabels();
    this.initStyles();
    this.initModuleListeners();

    this.innerRangeSub.sub(() => { this.needUpdateRings = true; });
    this.outerRangeSub.sub(() => { this.needUpdateRings = true; });

    this.needUpdateRings = true;
  }

  /**
   * Initializes the range display labels.
   */
  private initLabels(): void {
    // TODO: Add customizable display unit support.
    this.innerLabel = this.innerRangeLayerRef.instance.createLabel<MapRangeDisplay>(
      <MapRangeDisplay range={this.innerRangeSub} displayUnit={Subject.create(UnitType.NMILE)} />
    ) as MapLabeledRingLabel<MapRangeDisplay>;

    this.innerLabel.setAnchor(new Float64Array([0.5, 0.5]));
    this.innerLabel.setRadialAngle(135 * Avionics.Utils.DEG2RAD);

    this.outerLabel = this.outerRangeLayerRef.instance.createLabel<MapRangeDisplay>(
      <MapRangeDisplay range={this.outerRangeSub} displayUnit={Subject.create(UnitType.NMILE)} />
    ) as MapLabeledRingLabel<MapRangeDisplay>;

    this.outerLabel.setAnchor(new Float64Array([0.5, 0.5]));
    this.outerLabel.setRadialAngle(135 * Avionics.Utils.DEG2RAD);
  }

  /**
   * Initializes ring styles.
   */
  private initStyles(): void {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.tickLayerRef.instance.display!.context.fillStyle = this.props.strokeColor;

    this.innerRangeLayerRef.instance.setRingStrokeStyles(this.props.strokeWidth, this.props.strokeColor, this.props.strokeDash);
    this.outerRangeLayerRef.instance.setRingStrokeStyles(this.props.strokeWidth, this.props.strokeColor, this.props.strokeDash);
  }

  /**
   * Initializes modules listeners.
   */
  private initModuleListeners(): void {
    const innerRangeCallback = this.updateInnerRange.bind(this);
    const outerRangeCallback = this.updateOuterRange.bind(this);

    this.rangeModule.nominalRanges.sub(innerRangeCallback);
    this.rangeModule.nominalRanges.sub(outerRangeCallback);

    this.trafficModule.innerRangeIndex.sub(innerRangeCallback);
    this.trafficModule.outerRangeIndex.sub(outerRangeCallback);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public onMapProjectionChanged(mapProjection: MapProjection, changeFlags: number): void {
    this.tickLayerRef.instance.onMapProjectionChanged(mapProjection, changeFlags);
    this.innerRangeLayerRef.instance.onMapProjectionChanged(mapProjection, changeFlags);
    this.outerRangeLayerRef.instance.onMapProjectionChanged(mapProjection, changeFlags);

    this.needUpdateRings = BitFlags.isAny(changeFlags, MapProjectionChangeType.TargetProjected | MapProjectionChangeType.ProjectedResolution);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public onUpdated(time: number, elapsed: number): void {
    this.tickLayerRef.instance.onUpdated(time, elapsed);

    if (this.needUpdateRings) {
      this.updateRings();
      this.needUpdateRings = false;
    }

    this.innerRangeLayerRef.instance.onUpdated(time, elapsed);
    this.outerRangeLayerRef.instance.onUpdated(time, elapsed);
  }

  /**
   * Updates the rings.
   */
  private updateRings(): void {
    const center = this.props.mapProjection.getTargetProjected();
    const innerRadius = (this.innerRangeSub.get().asUnit(UnitType.GA_RADIAN) as number) / this.props.mapProjection.getProjectedResolution();
    const outerRadius = (this.outerRangeSub.get().asUnit(UnitType.GA_RADIAN) as number) / this.props.mapProjection.getProjectedResolution();

    if (innerRadius > 0) {
      this.innerRangeLayerRef.instance.setVisible(true);
      this.innerRangeLayerRef.instance.setRingPosition(center, innerRadius);
    } else {
      this.innerRangeLayerRef.instance.setVisible(false);
    }

    if (outerRadius > 0) {
      this.outerRangeLayerRef.instance.setVisible(true);
      this.outerRangeLayerRef.instance.setRingPosition(center, outerRadius);
    } else {
      this.outerRangeLayerRef.instance.setVisible(false);
    }

    this.updateTicks(center, innerRadius, outerRadius);
  }

  /**
   * Updates the ring tick marks.
   * @param center The projected center of the rings.
   * @param innerRadius The radius of the inner ring, in pixels.
   * @param outerRadius The radius of the outer ring, in pixels.
   */
  private updateTicks(center: Float64Array, innerRadius: number, outerRadius: number): void {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const display = this.tickLayerRef.instance.display!;

    display.clear();

    if (innerRadius > 0) {
      this.drawInnerTicks(display.context, center, innerRadius);
    }

    if (outerRadius > 0) {
      this.drawOuterTicks(display.context, center, outerRadius);
    }
  }

  /**
   * Draws the inner ring ticks to a canvas.
   * @param context A canvas 2D rendering context.
   * @param center The projected center of the inner ring.
   * @param radius The radius of the inner ring, in pixels.
   */
  private drawInnerTicks(context: CanvasRenderingContext2D, center: Float64Array, radius: number): void {
    const step = Math.PI / 2;
    for (let i = 0; i < 4; i++) {
      const pos = Vec2Math.setFromPolar(radius, i * step, TrafficMapRangeLayer.vec2Cache[0]);
      this.drawTick(context, center[0] + pos[0], center[1] + pos[1], this.props.majorTickSize);
    }
  }

  /**
   * Draws the outer ring ticks to a canvas.
   * @param context A canvas 2D rendering context.
   * @param center The projected center of the outer ring.
   * @param radius The radius of the outer ring, in pixels.
   */
  private drawOuterTicks(context: CanvasRenderingContext2D, center: Float64Array, radius: number): void {
    const step = Math.PI / 6;
    for (let i = 0; i < 12; i++) {
      const pos = Vec2Math.setFromPolar(radius, i * step, TrafficMapRangeLayer.vec2Cache[0]);
      this.drawTick(context, center[0] + pos[0], center[1] + pos[1], i % 3 === 0 ? this.props.majorTickSize : this.props.minorTickSize);
    }
  }

  /**
   * Draws a tick to a canvas.
   * @param context A canvas 2D rendering context.
   * @param x The x-coordinate of the center of the tick.
   * @param y The y-coordinate of the center of the tick.
   * @param size The size of the tick, in pixels.
   */
  private drawTick(context: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    context.fillRect(x - size / 2, y - size / 2, size, size);
  }

  /**
   * Updates the inner ring range.
   */
  private updateInnerRange(): void {
    const range = this.rangeModule.nominalRanges.get()[this.trafficModule.innerRangeIndex.get()];
    this.innerRangeSub.set(range ?? 0);
  }

  /**
   * Updates the outer ring range.
   */
  private updateOuterRange(): void {
    const range = this.rangeModule.nominalRanges.get()[this.trafficModule.outerRangeIndex.get()];
    this.outerRangeSub.set(range ?? 0);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public render(): VNode {
    return (
      <div>
        <MapSyncedCanvasLayer ref={this.tickLayerRef} model={this.props.model} mapProjection={this.props.mapProjection} />
        <MapLabeledRingLayer ref={this.innerRangeLayerRef} model={this.props.model} mapProjection={this.props.mapProjection} />
        <MapLabeledRingLayer ref={this.outerRangeLayerRef} model={this.props.model} mapProjection={this.props.mapProjection} />
      </div>
    );
  }
}