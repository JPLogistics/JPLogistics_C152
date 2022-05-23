import { FSComponent, Vec2Math, VNode } from 'msfssdk';
import { MapMiniCompassLayer } from '../../../../Shared/Map/Layers/MapMiniCompassLayer';
import { MapRangeCompassLayer } from '../../../../Shared/Map/Layers/MapRangeCompassLayer';
import { MapRangeRingLayer } from '../../../../Shared/Map/Layers/MapRangeRingLayer';
import { MapTerrainScaleIndicator } from '../../../../Shared/Map/Indicators/MapTerrainScaleIndicator';
import { MapOrientation } from '../../../../Shared/Map/Modules/MapOrientationModule';
import { NavMapComponent, NavMapComponentProps, NavMapRangeTargetRotationController } from '../../../../Shared/UI/NavMap/NavMapComponent';
import { MapPointerInfoLayer, MapPointerInfoLayerSize } from '../../../../Shared/Map/Layers/MapPointerInfoLayer';
import { MapRangeSettings } from '../../../../Shared/Map/MapRangeSettings';
import { NavMapModelModules } from '../../../../Shared/UI/NavMap/NavMapModel';

/**
 * The MFD navigation map.
 */
export class MFDNavMapComponent
  <
  M extends NavMapModelModules = NavMapModelModules,
  P extends NavMapComponentProps<M> = NavMapComponentProps<M>,
  R extends MFDNavMapRangeTargetRotationController<M> = MFDNavMapRangeTargetRotationController<M>
  >
  extends NavMapComponent<M, P, R> {

  protected readonly rtrController = this.createRangeTargetRotationController();

  /**
   * Creates a new range/target/rotation controller for this map.
   * @returns A new range/target/rotation controller for this map.
   */
  protected createRangeTargetRotationController(): R {
    return new MFDNavMapRangeTargetRotationController(
      this.props.model,
      this.mapProjection,
      this.deadZone,
      MapRangeSettings.getRangeArraySubscribable(this.props.bus),
      this.pointerBoundsSub,
      this.props.settingManager,
      this.rangeSettingManager, 'mfdMapRangeIndex'
    ) as R;
  }

  /** @inheritdoc */
  protected renderRangeDisplayLayer(): VNode | null {
    return null;
  }

  /** @inheritdoc */
  protected renderMiniCompassLayer(): VNode | null {
    return (
      <MapMiniCompassLayer
        class='minicompass-layer'
        model={this.props.model} mapProjection={this.mapProjection}
        imgSrc={'coui://html_ui/Pages/VCockpit/Instruments/NavSystems/WTG1000/Assets/map_mini_compass.png'}
      />
    );
  }

  /** @inheritdoc */
  protected renderRangeRingLayer(): VNode | null {
    return (
      <MapRangeRingLayer
        model={this.props.model} mapProjection={this.mapProjection}
        showLabel={true} strokeWidth={2} strokeStyle={'white'}
      />
    );
  }

  /** @inheritdoc */
  protected renderRangeCompassLayer(): VNode | null {
    return (
      <MapRangeCompassLayer
        model={this.props.model} mapProjection={this.mapProjection}
        bus={this.props.bus} showLabel={true}
        showHeadingBug={this.props.model.getModule('pointer').isActive.map(isActive => !isActive)}
        arcStrokeWidth={2} arcEndTickLength={10}
        referenceArrowWidth={15} referenceArrowHeight={20} referenceTickWidth={2} referenceTickHeight={5}
        bearingTickMajorLength={10} bearingTickMinorLength={5}
        bearingLabelFont={'Roboto-Bold'} bearingLabelFontSize={20} bearingLabelOutlineWidth={6} bearingLabelRadialOffset={0}
        headingBugWidth={20} headingBugHeight={10}
      />
    );
  }

  /** @inheritdoc */
  protected renderPointerInfoLayer(): VNode | null {
    return (
      <MapPointerInfoLayer
        model={this.props.model} mapProjection={this.mapProjection}
        size={MapPointerInfoLayerSize.Full}
      />
    );
  }

  /** @inheritdoc */
  protected renderTerrainScaleIndicator(): VNode | null {
    const terrainModule = this.props.model.getModule('terrain');
    return (
      <MapTerrainScaleIndicator show={terrainModule.showScale} terrainMode={terrainModule.terrainMode} />
    );
  }
}

/**
 * A controller for handling map range, target, and rotation changes for the MFD navigation map.
 */
export class MFDNavMapRangeTargetRotationController<M extends NavMapModelModules = NavMapModelModules> extends NavMapRangeTargetRotationController<M> {
  public static readonly NORTH_UP_TARGET_OFFSET_REL = new Float64Array(2);
  public static readonly HDG_TRK_UP_TARGET_OFFSET_REL = new Float64Array([0, 1 / 6]);

  /** @inheritdoc */
  protected getDesiredRangeEndpoints(out: Float64Array): Float64Array {
    const targetOffsetRel = this.mapModel.getModule('orientation').orientation.get() === MapOrientation.NorthUp
      ? MFDNavMapRangeTargetRotationController.NORTH_UP_TARGET_OFFSET_REL
      : MFDNavMapRangeTargetRotationController.HDG_TRK_UP_TARGET_OFFSET_REL;

    const targetRelY = targetOffsetRel[1] + 0.5;

    const trueTargetRelX = this.nominalToTrueRelativeX(targetOffsetRel[0] + 0.5);
    const trueTargetRelY = this.nominalToTrueRelativeY(targetRelY);

    out[0] = trueTargetRelX;
    out[1] = trueTargetRelY;
    out[2] = trueTargetRelX;
    out[3] = this.nominalToTrueRelativeY(targetRelY / 2);
    return out;
  }

  /** @inheritdoc */
  protected getDesiredTargetOffset(out: Float64Array): Float64Array {
    const deadZone = this.deadZone.get();

    const trueCenterOffsetX = (deadZone[0] - deadZone[2]) / 2;
    const trueCenterOffsetY = (deadZone[1] - deadZone[3]) / 2;

    const projectedSize = this.mapProjection.getProjectedSize();
    const relativeOffset = this.mapModel.getModule('orientation').orientation.get() === MapOrientation.NorthUp
      ? MFDNavMapRangeTargetRotationController.NORTH_UP_TARGET_OFFSET_REL
      : MFDNavMapRangeTargetRotationController.HDG_TRK_UP_TARGET_OFFSET_REL;
    return Vec2Math.set(
      relativeOffset[0] * projectedSize[0] + trueCenterOffsetX,
      relativeOffset[1] * projectedSize[1] + trueCenterOffsetY,
      out
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