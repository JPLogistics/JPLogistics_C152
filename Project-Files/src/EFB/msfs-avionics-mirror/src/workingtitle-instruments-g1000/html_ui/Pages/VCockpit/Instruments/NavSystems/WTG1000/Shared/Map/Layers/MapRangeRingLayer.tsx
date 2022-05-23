import { FSComponent, NumberUnitInterface, UnitFamily, UnitType } from 'msfssdk';
import { MapLabeledRingLabel, MapLabeledRingLayer, MapLayerProps, MapProjection, MapRangeModule } from 'msfssdk/components/map';
import { MapRangeDisplay } from '../MapRangeDisplay';
import { MapRangeRingModule } from '../Modules/MapRangeRingModule';
import { MapUnitsModule } from '../Modules/MapUnitsModule';

/**
 * Modules required by MapRangeRingLayer.
 */
interface MapRangeRingLayerModules {
  /** Display units module. */
  units: MapUnitsModule;

  /** Range module. */
  range: MapRangeModule;

  /** Range ring module. */
  rangeRing: MapRangeRingModule;
}

/**
 * Component props for MapRangeRingLayer.
 */
export interface MapRangeRingLayerProps extends MapLayerProps<MapRangeRingLayerModules> {
  /** Whether to show the range label. */
  showLabel: boolean;

  /** The stroke width of the range ring. */
  strokeWidth?: number;

  /** The stroke style of the range ring. */
  strokeStyle?: string | CanvasGradient | CanvasPattern;

  /** The stroke dash of the range ring. */
  strokeDash?: number[];

  /** The outline width of the range ring. */
  outlineWidth?: number;

  /** The outline style of the range ring. */
  outlineStyle?: string | CanvasGradient | CanvasPattern;

  /** The outline dash of the range ring. */
  outlineDash?: number[];
}

/**
 * A map layer which draws a range ring around the map target.
 */
export class MapRangeRingLayer extends MapLabeledRingLayer<MapRangeRingLayerProps> {
  private label: MapLabeledRingLabel<MapRangeDisplay> | null = null;
  private needUpdateRing = false;

  /**
   * Updates this layer according to its current visibility.
   */
  protected updateFromVisibility(): void {
    super.updateFromVisibility();

    if (this.isVisible()) {
      this.needUpdateRing = true;
    }
  }

  /** @inheritdoc */
  public onAttached(): void {
    super.onAttached();

    this.initLabel();
    this.initStyles();
    this.initModuleListeners();
    this.updateVisibility();
    this.needUpdateRing = true;
  }

  /**
   * Initializes the range display label.
   */
  private initLabel(): void {
    if (!this.props.showLabel) {
      return;
    }

    const rangeModule = this.props.model.getModule('range');
    this.label = this.createLabel<MapRangeDisplay>(
      <MapRangeDisplay range={rangeModule.nominalRange} displayUnit={this.props.model.getModule('units').distanceLarge} />
    ) as MapLabeledRingLabel<MapRangeDisplay>;

    this.label.setAnchor(new Float64Array([0.5, 0.5]));
    this.label.setRadialAngle(225 * Avionics.Utils.DEG2RAD);
  }

  /**
   * Initializes ring styles.
   */
  private initStyles(): void {
    this.setRingStrokeStyles(this.props.strokeWidth, this.props.strokeStyle, this.props.strokeDash);
    this.setRingOutlineStyles(this.props.outlineWidth, this.props.outlineStyle, this.props.outlineDash);
  }

  /**
   * Initializes modules listeners.
   */
  private initModuleListeners(): void {
    const rangeModule = this.props.model.getModule('range');
    rangeModule.nominalRange.sub(this.onRangeChanged.bind(this));

    const rangeRingModule = this.props.model.getModule('rangeRing');
    rangeRingModule.show.sub(this.onRangeRingShowChanged.bind(this));
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public onMapProjectionChanged(mapProjection: MapProjection, changeFlags: number): void {
    super.onMapProjectionChanged(mapProjection, changeFlags);

    if (!this.isVisible()) {
      return;
    }

    this.needUpdateRing = true;
  }

  /**
   * Updates this layer's visibility.
   */
  private updateVisibility(): void {
    this.setVisible(this.props.model.getModule('rangeRing').show.get());
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public onUpdated(time: number, elapsed: number): void {
    if (this.needUpdateRing) {
      this.updateRing();
      this.needUpdateRing = false;
    }

    super.onUpdated(time, elapsed);
  }

  /**
   * Updates the ring.
   */
  private updateRing(): void {
    const center = this.props.mapProjection.getTargetProjected();
    const radius = (this.props.model.getModule('range').nominalRange.get().asUnit(UnitType.GA_RADIAN) as number) / this.props.mapProjection.getProjectedResolution();

    this.setRingPosition(center, radius);
  }

  /**
   * A callback which is called when the nominal map range changes.
   * @param range The new nominal map range.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private onRangeChanged(range: NumberUnitInterface<UnitFamily.Distance>): void {
    if (!this.isVisible()) {
      return;
    }

    this.needUpdateRing = true;
  }

  /**
   * A callback which is called when the show range ring property changes.
   * @param show The new value of the show range ring property.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private onRangeRingShowChanged(show: boolean): void {
    this.updateVisibility();
  }
}