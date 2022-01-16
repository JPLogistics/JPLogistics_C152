import { FSComponent, NumberUnitInterface, Subject, UnitFamily, UnitType, Vec2Math, VNode } from 'msfssdk';
import { MapMiniCompassLayer } from '../../../Shared/Map/Layers/MapMiniCompassLayer';
import { MapRangeCompassLayer } from '../../../Shared/Map/Layers/MapRangeCompassLayer';
import { MapRangeRingLayer } from '../../../Shared/Map/Layers/MapRangeRingLayer';
import { MapDetailIndicator } from '../../../Shared/Map/Indicators/MapDetailIndicator';
import { MapOrientation } from '../../../Shared/Map/Modules/MapOrientationModule';
import { NavMapComponent, NavMapRangeTargetRotationController } from '../../../Shared/UI/NavMap/NavMapComponent';
import { MapPointerInfoLayer, MapPointerInfoLayerSize } from '../../../Shared/Map/Layers/MapPointerInfoLayer';
import { MapRangeSettings } from '../../../Shared/Map/MapRangeSettings';

/**
 * The PFD inset navigation map.
 */
export class PFDInsetNavMapComponent extends NavMapComponent {
  private readonly miniCompassLayerRef = FSComponent.createRef<MapMiniCompassLayer>();
  private readonly rangeRingLayerRef = FSComponent.createRef<MapRangeRingLayer>();
  private readonly rangeCompassLayerRef = FSComponent.createRef<MapRangeCompassLayer>();
  private readonly pointerInfoLayerRef = FSComponent.createRef<MapPointerInfoLayer>();

  /** @inheritdoc */
  protected createRangeTargetRotationController(): NavMapRangeTargetRotationController {
    return new PFDInsetNavMapRangeTargetRotationController(
      this.props.model,
      this.mapProjection,
      this.deadZone,
      this.props.settingManager,
      this.rangeSettingManager, 'pfdMapRangeIndex',
      MapRangeSettings.getRangeArraySubscribable(this.props.bus),
      this.pointerBoundsSub
    );
  }

  /** @inheritdoc */
  protected initLayers(): void {
    super.initLayers();

    this.attachLayer(this.miniCompassLayerRef.instance);
    this.attachLayer(this.rangeRingLayerRef.instance);
    this.attachLayer(this.rangeCompassLayerRef.instance);
    this.attachLayer(this.pointerInfoLayerRef.instance);
  }

  /** @inheritdoc */
  protected updatePointerBounds(): void {
    const size = this.mapProjection.getProjectedSize();
    const minX = this.deadZone[0];
    const minY = this.deadZone[1];
    const maxX = size[0] - this.deadZone[2];
    const maxY = size[1] - this.deadZone[3];
    const width = maxX - minX;
    const height = maxY - minY;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    this.pointerBoundsSub.set(
      Math.min(centerX, minX + width * 0.2),
      Math.min(centerY, minY + height * 0.2),
      Math.max(centerX, maxX - height * 0.4),
      Math.max(centerY, maxY - height * 0.2)
    );
  }

  /** @inheritdoc */
  protected renderTopLeftIndicators(): (VNode | null)[] {
    return [
      this.renderOrientationIndicator(),
      this.renderRangeIndicator()
    ];
  }

  /** @inheritdoc */
  protected renderMiniCompassLayer(): VNode | null {
    return (
      <MapMiniCompassLayer
        ref={this.miniCompassLayerRef} class='minicompass-layer'
        model={this.props.model} mapProjection={this.mapProjection}
        imgSrc={'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG1000/Assets/map_mini_compass.png'}
      />
    );
  }

  /** @inheritdoc */
  protected renderRangeRingLayer(): VNode | null {
    return (
      <MapRangeRingLayer
        ref={this.rangeRingLayerRef} model={this.props.model} mapProjection={this.mapProjection}
        showLabel={false} strokeWidth={2} strokeStyle={'white'}
      />
    );
  }

  /** @inheritdoc */
  protected renderRangeCompassLayer(): VNode | null {
    return (
      <MapRangeCompassLayer
        ref={this.rangeCompassLayerRef} model={this.props.model} mapProjection={this.mapProjection}
        bus={this.props.bus} showLabel={false}
        showHeadingBug={Subject.create(false)}
        arcStrokeWidth={2} arcEndTickLength={5}
        referenceTickWidth={2} referenceTickHeight={5}
        bearingTickMajorLength={10} bearingTickMinorLength={5}
        bearingLabelFont={'Roboto-Bold'} bearingLabelFontSize={20} bearingLabelOutlineWidth={6} bearingLabelRadialOffset={0}
      />
    );
  }

  /** @inheritdoc */
  protected renderPointerInfoLayer(): VNode | null {
    return (
      <MapPointerInfoLayer
        ref={this.pointerInfoLayerRef} model={this.props.model} mapProjection={this.mapProjection}
        size={MapPointerInfoLayerSize.Small}
      />
    );
  }

  /** @inheritdoc */
  protected renderTerrainScaleIndicator(): VNode | null {
    return null;
  }

  /** @inheritdoc */
  protected renderDetailIndicator(): VNode | null {
    return (
      <MapDetailIndicator declutterMode={this.props.model.getModule('declutter').mode} showTitle={false} />
    );
  }

  /** @inheritdoc */
  protected renderWaypointHighlightLayer(): VNode | null {
    return null;
  }

  /** @inheritdoc */
  protected renderHighlightLineLayer(): VNode | null {
    return null;
  }
}

/**
 * A controller for handling map range, target, and rotation changes for the MFD navigation map.
 */
class PFDInsetNavMapRangeTargetRotationController extends NavMapRangeTargetRotationController {
  public static readonly NORTH_UP_TARGET_OFFSET_REL = new Float64Array(2);
  public static readonly HDG_TRK_UP_TARGET_OFFSET_REL = new Float64Array([0, 1 / 6]);

  private static readonly tempVec2_1 = new Float64Array(2);

  /** @inheritdoc */
  protected convertToTrueRange(nominalRange: NumberUnitInterface<UnitFamily.Distance>): number {
    const projectedHeight = this.mapProjection.getProjectedSize()[1];
    const correctedHeight = projectedHeight - this.deadZone[1] - this.deadZone[3];
    const orientation = this.orientationModule.orientation.get();
    const factor = orientation === MapOrientation.NorthUp ? 2.5 : 2;

    return nominalRange.asUnit(UnitType.GA_RADIAN) as number * projectedHeight / correctedHeight * factor;
  }

  /** @inheritdoc */
  protected getDesiredTargetOffset(): Float64Array {
    const trueCenterOffsetX = (this.deadZone[0] - this.deadZone[2]) / 2;
    const trueCenterOffsetY = (this.deadZone[1] - this.deadZone[3]) / 2;

    const projectedSize = this.mapProjection.getProjectedSize();
    const relativeOffset = this.orientationModule.orientation.get() === MapOrientation.NorthUp
      ? PFDInsetNavMapRangeTargetRotationController.NORTH_UP_TARGET_OFFSET_REL
      : PFDInsetNavMapRangeTargetRotationController.HDG_TRK_UP_TARGET_OFFSET_REL;
    return Vec2Math.set(
      relativeOffset[0] * projectedSize[0] + trueCenterOffsetX,
      relativeOffset[1] * projectedSize[1] + trueCenterOffsetY,
      PFDInsetNavMapRangeTargetRotationController.tempVec2_1
    );
  }

  /** @inheritdoc */
  protected updateModules(): void {
    super.updateModules();

    const isNorthUp = this.mapModel.getModule('orientation').orientation.get() === MapOrientation.NorthUp;
    this.mapModel.getModule('rangeRing').show.set(isNorthUp);
    this.mapModel.getModule('rangeCompass').show.set(!isNorthUp);
  }
}